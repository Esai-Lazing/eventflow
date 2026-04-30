<?php

namespace App\Http\Controllers;

use App\Models\Guest;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GuestController extends Controller
{
    public function store(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->where('user_id', Auth::id())->firstOrFail();

        // Pre-processing to avoid 422 on empty strings for numeric/id fields
        if ($request->has('table_id') && empty($request->input('table_id'))) {
            $request->merge(['table_id' => null]);
        }
        if ($request->has('seat_number') && empty($request->input('seat_number'))) {
            $request->merge(['seat_number' => null]);
        }

        $validated = $request->validate([
            'name' => 'required|string',
            'guest_type' => 'nullable|string',
            'guest_count' => 'nullable|integer|min:1',
            'table_number' => 'nullable|string',
            'table_id' => 'nullable|integer|exists:tables,id',
            'seat_number' => 'nullable|integer',
        ]);

        if ($event->guest_limit > 0 && $event->guests()->count() >= $event->guest_limit) {
            return response()->json(['message' => 'La limite d\'invités pour cet événement a été atteinte.'], 422);
        }

        // Constraint: Table capacity check
        if (!empty($validated['table_id'])) {
            $table = \App\Models\Table::find($validated['table_id']);
            if ($table && $table->guests()->count() >= $table->capacity) {
                return response()->json(['message' => "La table {$table->name} est déjà pleine (max: {$table->capacity})."], 422);
            }
        }

        // Constraint: Seat exclusivity check
        if (!empty($validated['table_id']) && !empty($validated['seat_number'])) {
            $isSeatTaken = Guest::where('table_id', $validated['table_id'])
                ->where('seat_number', $validated['seat_number'])
                ->exists();
                
            if ($isSeatTaken) {
                return response()->json(['message' => "Le siège {$validated['seat_number']} est déjà occupé sur cette table."], 422);
            }
        }

        $expiry = $event->date ? \Illuminate\Support\Carbon::parse($event->date)->addDay() : now()->addDay();

        $guest = $event->guests()->create([
            ...$validated,
            'token_expires_at' => $expiry,
            'status' => 'pending'
        ]);

        return response()->json($guest, 201);
    }

    public function index(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->where('user_id', Auth::id())->firstOrFail();
        
        $guests = $event->guests()
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json($guests);
    }

    public function update(Request $request, $id)
    {
        $guest = Guest::whereHas('event', function($query) {
            $query->where('user_id', Auth::id());
        })->findOrFail($id);

        // Pre-processing to avoid 422 on empty strings for numeric/id fields
        if ($request->has('table_id') && empty($request->input('table_id'))) {
            $request->merge(['table_id' => null]);
        }
        if ($request->has('seat_number') && empty($request->input('seat_number'))) {
            $request->merge(['seat_number' => null]);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'guest_type' => 'nullable|string',
            'guest_count' => 'nullable|integer|min:1',
            'table_number' => 'nullable|string',
            'table_id' => 'nullable|exists:tables,id',
            'seat_number' => 'nullable|integer',
            'status' => 'sometimes|string|in:pending,confirmed,declined',
            'invitation_sent' => 'sometimes|boolean'
        ]);

        /* 
        // Constraint: Prevent moving guest if invitation sent or confirmed
        // Relaxed to allow the event owner to manage their seating plan freely even after RSVPs.
        if (array_key_exists('table_id', $validated) && $validated['table_id'] != $guest->table_id) {
            if ($guest->status === 'confirmed' || $guest->status === 'declined') {
                return response()->json([
                    'message' => "L'invité a déjà répondu ('{$guest->status}'). Placement verrouillé."
                ], 403);
            }
            
            if ($guest->invitation_sent) {
                return response()->json([
                    'message' => "L'invitation a déjà été envoyée. Modification du placement bloquée."
                ], 403);
            }
        }
        */

        // Constraint: Table capacity check
        if (isset($validated['table_id']) && $validated['table_id'] != $guest->table_id) {
            $table = \App\Models\Table::find($validated['table_id']);
            if ($table && $table->guests()->count() >= $table->capacity) {
                return response()->json(['message' => "La table {$table->name} est déjà pleine (max: {$table->capacity})."], 422);
            }
        }

        // Constraint: Seat exclusivity check
        $targetTableId = $validated['table_id'] ?? $guest->table_id;
        $targetSeat = $validated['seat_number'] ?? null;

        if ($targetTableId && $targetSeat) {
            $isSeatTaken = Guest::where('table_id', $targetTableId)
                ->where('seat_number', $targetSeat)
                ->where('id', '!=', $guest->id)
                ->exists();
                
            if ($isSeatTaken) {
                return response()->json(['message' => "Le siège {$targetSeat} est déjà occupé sur cette table."], 422);
            }
        }

        $guest->update($validated);

        return response()->json($guest);
    }

    public function destroy(Request $request, $id)
    {
        $guest = Guest::whereHas('event', function($query) {
            $query->where('user_id', Auth::id());
        })->findOrFail($id);

        /* 
        if ($guest->status !== 'declined' && $guest->invitation_sent) {
            return response()->json(['message' => 'Uniquement les invités ayant décliné peuvent être supprimés après l\'envoi de l\'invitation.'], 403);
        }

        if ($guest->invitation_sent && $guest->status !== 'declined') {
             return response()->json(['message' => 'Suppression impossible : Invitation en cours ou acceptée.'], 403);
        }
        */

        $guest->delete();

        return response()->json(['message' => 'Invité supprimé avec succès.']);
    }

    public function checkIn(Request $request, $token)
    {
        $staffToken = $request->header('X-Staff-Token');

        // Security check: Find guest and ensure the authenticated user owns the event OR a valid staff token is provided
        $guest = Guest::where('token', $token)
            ->whereHas('event', function($query) use ($staffToken) {
                $query->where('user_id', Auth::id())
                      ->orWhere(function($q) use ($staffToken) {
                          $q->whereNotNull('staff_token')
                            ->where('staff_token', $staffToken);
                      });
            })
            ->with(['event', 'table'])
            ->firstOrFail();

        if ($guest->checked_in) {
            return response()->json([
                'message' => 'Attention : Cet invité a déjà été scanné !',
                'guest' => $guest
            ], 422);
        }

        if ($guest->token_expires_at && $guest->token_expires_at->isPast()) {
            return response()->json(['message' => 'L\'invitation a expiré.'], 403);
        }

        $guest->update(['checked_in' => true]);

        return response()->json([
            'message' => 'Check-in réussi !',
            'guest' => $guest
        ]);
    }

    public function refreshStaffToken(Request $request, $slug)
    {
        $event = Event::where('slug', $slug)->where('user_id', Auth::id())->firstOrFail();
        
        $newToken = bin2hex(random_bytes(16)); // Secure random token
        $event->update(['staff_token' => $newToken]);

        return response()->json([
            'staff_token' => $newToken,
            'message' => 'Token Staff généré avec succès.'
        ]);
    }

    public function show(Request $request, $token)
    {
        $guest = Guest::with(['event', 'table.guests'])->where('token', $token)->firstOrFail();

        // Security: Mask other guests' names to protect privacy
        if ($guest->table) {
            $guest->table->setRelation('guests', $guest->table->guests->map(function ($g) use ($guest) {
                if ($g->id !== $guest->id) {
                    $parts = explode(' ', trim($g->name));
                    if (count($parts) > 1) {
                        $g->name = $parts[0] . ' ' . mb_substr($parts[count($parts) - 1], 0, 1) . '.';
                    }
                }
                return $g;
            }));
        }

        if ($guest->token_expires_at && $guest->token_expires_at->isPast()) {
            return response()->json(['message' => 'L\'invitation a expiré.'], 403);
        }

        return response()->json($guest);
    }

    public function suggestMusic(Request $request, $token)
    {
        $guest = Guest::where('token', $token)->firstOrFail();
        
        $validated = $request->validate([
            'songs' => 'required|array',
            'link' => 'nullable|string'
        ]);

        $guest->update(['music_suggestions' => $validated]);

        return response()->json(['message' => 'Suggestions enregistrées !']);
    }

    public function postGuestbook(Request $request, $token)
    {
        $guest = Guest::where('token', $token)->firstOrFail();
        
        $validated = $request->validate([
            'name' => 'required|string',
            'message' => 'required|string'
        ]);

        $guest->update(['guestbook_message' => $validated['message']]);
        
        return response()->json(['message' => 'Message ajouté !']);
    }

    public function getNotifications(string $token)
    {
        $guest = Guest::where('token', $token)->firstOrFail();
        
        $notifications = $guest->unreadNotifications->map(function ($notification) {
            return [
                'id' => $notification->id,
                'title' => $notification->data['title'] ?? 'Rappel',
                'message' => $notification->data['message'] ?? '',
                'created_at' => $notification->created_at
            ];
        });

        // Marquer comme lues
        $guest->unreadNotifications->markAsRead();

        return response()->json($notifications);
    }
}
