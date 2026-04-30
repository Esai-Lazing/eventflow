<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::where('user_id', Auth::id());
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }
        return $query->orderBy('created_at', 'desc')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'type' => 'required|string',
            'date' => 'required|date',
            'time' => 'required',
            'location' => 'required|string',
            'description' => 'nullable|string',
            'template' => 'required|string',
            'customization' => 'nullable|array',
            'status' => 'nullable|string',
            'current_step' => 'nullable|integer',
        ]);

        $slug = Str::slug($validated['title']) . '-' . Str::random(6);
        $customization = $request->customization ?? null;

        if ($customization && is_array($customization)) {
            $customization = $this->handleBase64Images($customization, $slug);
        }

        $event = Event::create([
            'title' => $validated['title'],
            'type' => $validated['type'],
            'date' => $validated['date'],
            'time' => $validated['time'],
            'location' => $validated['location'],
            'description' => $validated['description'] ?? null,
            'template' => $validated['template'],
            'customization' => $customization,
            'status' => $request->status ?? 'draft',
            'current_step' => $request->current_step ?? 0,
            'user_id' => Auth::id(),
            'slug' => $slug,
        ]);

        return response()->json($event, 201);
    }


    public function show(string $slug)
    {
        $event = Event::with('guests')->where('slug', $slug)->firstOrFail();
        return response()->json($event);
    }

    public function update(Request $request, string $slug)
    {
        $event = Event::where('slug', $slug)->where('user_id', Auth::id())->firstOrFail();
        
        $data = $request->only(['customization', 'status', 'current_step', 'guest_limit', 'title', 'date', 'time', 'location', 'description']);

        if (isset($data['customization']) && is_array($data['customization'])) {
            $data['customization'] = $this->handleBase64Images($data['customization'], $event->slug);
        }

        $event->update($data);

        return response()->json($event);
    }

    public function uploadMusic(Request $request, string $slug)
    {
        $request->validate([
            'music' => 'required|file|mimes:mp3,wav,m4a,aac,mpga,mpeg,ogg,mp4|max:20480',
            'title' => 'required|string|max:255'
        ]);

        $event = Event::where('slug', $slug)->where('user_id', Auth::id())->firstOrFail();

        if ($request->hasFile('music')) {
            $file = $request->file('music');
            $fileName = time() . '_' . $file->getClientOriginalName();
            // Use 'public' disk explicitly
            $path = $file->storeAs('music/' . $event->id, $fileName, 'public');
            // Use proxy URL to avoid CORS issues with static files on localhost:8000
            $url = url('/api/music-proxy/' . $event->id . '/' . $fileName);

            $customization = $event->customization ?? [];
            if (!isset($customization['songs'])) {
                $customization['songs'] = [];
            }

            $newSong = [
                'id' => uniqid(),
                'title' => $request->title,
                'url' => $url,
                'path' => $path,
                'is_active' => count($customization['songs']) === 0 // Active if first song
            ];

            $customization['songs'][] = $newSong;
            $event->update(['customization' => $customization]);

            return response()->json($event);
        }

        return response()->json(['message' => 'No file uploaded'], 400);
    }

    public function deleteMusic(Request $request, string $slug, string $songId)
    {
        $event = Event::where('slug', $slug)->where('user_id', Auth::id())->firstOrFail();
        $customization = $event->customization ?? [];

        if (isset($customization['songs'])) {
            $songIndex = -1;
            foreach ($customization['songs'] as $index => $song) {
                if ($song['id'] === $songId) {
                    $songIndex = $index;
                    break;
                }
            }

            if ($songIndex !== -1) {
                $song = $customization['songs'][$songIndex];
                if (isset($song['path'])) {
                    Storage::disk('public')->delete($song['path']);
                }
                
                array_splice($customization['songs'], $songIndex, 1);
                
                // If we deleted the active song, set another one as active if available
                if ($song['is_active'] && count($customization['songs']) > 0) {
                    $customization['songs'][0]['is_active'] = true;
                }

                $event->update(['customization' => $customization]);
            }
        }

        return response()->json($event);
    }

    public function proxyMusic($eventId, $fileName)
    {
        // Use Storage facade to get the correct path on the public disk
        $path = Storage::disk('public')->path('music/' . $eventId . '/' . $fileName);
        
        if (!Storage::disk('public')->exists('music/' . $eventId . '/' . $fileName)) {
            abort(404);
        }

        return response()->file($path, [
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET',
            'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
        ]);
    }

    /**
     * Process customization array and save base64 images as public files.
     */
    private function handleBase64Images(array $data, string $slug)
    {
        foreach ($data as $key => &$value) {
            if (is_array($value)) {
                $value = $this->handleBase64Images($value, $slug);
            } elseif (is_string($value) && str_starts_with($value, 'data:image/')) {
                try {
                    // Extract format and data
                    $commaPos = strpos($value, ',');
                    $header = substr($value, 0, $commaPos);
                    
                    // Determine extension
                    $extension = 'jpg';
                    if (str_contains($header, 'image/png')) $extension = 'png';
                    elseif (str_contains($header, 'image/webp')) $extension = 'webp';
                    elseif (str_contains($header, 'image/jpeg')) $extension = 'jpg';
                    elseif (str_contains($header, 'image/gif')) $extension = 'gif';

                    $imageContent = base64_decode(substr($value, $commaPos + 1));
                    
                    $id = uniqid();
                    $folder = 'events/' . $slug;
                    
                    // 1. Save original format (Frontend sends WebP for performance)
                    $extension = str_contains($header, 'image/webp') ? 'webp' : (str_contains($header, 'image/png') ? 'png' : 'jpg');
                    $fileName = "img_{$id}.{$extension}";
                    Storage::disk('public')->put($folder . '/' . $fileName, $imageContent);

                    // 2. If it's WebP, also save a JPG version specifically for social media (WhatsApp)
                    // This requires the GD extension.
                    if ($extension === 'webp' && function_exists('imagecreatefromstring')) {
                        try {
                            $img = imagecreatefromstring($imageContent);
                            if ($img) {
                                ob_start();
                                imagejpeg($img, null, 85);
                                Storage::disk('public')->put($folder . "/img_{$id}.jpg", ob_get_clean());
                                imagedestroy($img);
                            }
                        } catch (\Exception $e) {
                            Log::warning("Could not create JPG version for sharing: " . $e->getMessage());
                        }
                    }
                    
                    // The URL stored in database points to the high-performance WebP version
                    $value = url('/api/image-proxy/' . $slug . '/' . $fileName);
                } catch (\Exception $e) {
                    Log::error("Failed to process base64 image in customization: " . $e->getMessage());
                }
            }
        }
        return $data;
    }

    /**
     * Proxy for customization images to avoid CORS and storage:link issues.
     */
    public function proxyImage($slug, $fileName)
    {
        $filePath = 'events/' . $slug . '/' . $fileName;
        $disk = Storage::disk('public');

        // 1. If the exact file exists, serve it
        if ($disk->exists($filePath)) {
            $path = $disk->path($filePath);
            $extension = pathinfo($fileName, PATHINFO_EXTENSION);
            $mime = match($extension) {
                'webp' => 'image/webp',
                'png'  => 'image/png',
                'gif'  => 'image/gif',
                default => 'image/jpeg',
            };

            return response()->file($path, [
                'Content-Type' => $mime,
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
                'Cache-Control' => 'public, max-age=86400',
            ]);
        }

        // 2. Fallback: If JPG is requested but missing, try to convert from WebP on-the-fly
        // This fixes previews for invitations created before the dual-format update.
        if (str_ends_with($fileName, '.jpg')) {
            $webpName = str_replace('.jpg', '.webp', $fileName);
            $webpPath = 'events/' . $slug . '/' . $webpName;

            if ($disk->exists($webpPath) && function_exists('imagecreatefromstring')) {
                try {
                    $img = imagecreatefromstring($disk->get($webpPath));
                    if ($img) {
                        ob_start();
                        imagejpeg($img, null, 85);
                        $jpgData = ob_get_clean();
                        imagedestroy($img);

                        // Cache the generated JPG for future requests
                        $disk->put($filePath, $jpgData);

                        return response($jpgData)->header('Content-Type', 'image/jpeg')
                                                 ->header('Access-Control-Allow-Origin', '*')
                                                 ->header('Cache-Control', 'public, max-age=86400');
                    }
                } catch (\Exception $e) {
                    Log::warning("On-the-fly JPG conversion failed: " . $e->getMessage());
                }
            }
        }

        abort(404);
    }
    /**
     * Handle social sharing with dynamic meta tags.
     */
    public function shareInvitation($slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        $customization = $event->customization ?? [];
        
        $coupleNames = $customization['hosts'] ?? '';
        if (!$coupleNames) {
            $bride = $customization['bride'] ?? 'Mariée';
            $groom = $customization['groom'] ?? 'Marié';
            $coupleNames = "{$bride} & {$groom}";
        }

        $title = "Invitation de " . $coupleNames;
        $image = $customization['couplePhoto'] ?? "https://eventflow.lazdev-consult.com/logo.png";
        
        // Force the .jpg extension for the social sharing image (WhatsApp compatibility)
        // while keeping .webp for the web application performance.
        $image = str_replace('.webp', '.jpg', $image);

        $description = $customization['intro']['text'] ?? "Nous sommes ravis de vous inviter à célébrer notre union.";

        // Use the current sharing URL for og:url to ensure WhatsApp stays on this page
        // which contains the server-rendered meta tags.
        $ogUrl = url()->current();

        return view('share', [
            'title' => $title,
            'image' => $image,
            'description' => $description,
            'slug' => $slug,
            'ogUrl' => $ogUrl
        ]);
    }
}
