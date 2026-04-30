<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Guest;
use App\Models\Response;
use Illuminate\Http\Request;

class RSVPController extends Controller
{
    public function submit(Request $request, string $slug)
    {
        $event = Event::where('slug', $slug)->firstOrFail();

        $validated = $request->validate([
            'guest_token' => 'required|string',
            'guest_name' => 'required|string',
            'response' => 'required|in:confirmed,declined,pending',
            'message' => 'nullable|string',
        ]);

        $guest = Guest::where('event_id', $event->id)
            ->where('token', $validated['guest_token'])
            ->firstOrFail();

        $guest->update(['status' => $validated['response']]);

        // If resetting to pending, clear existing responses
        if ($validated['response'] === 'pending') {
            Response::where('guest_id', $guest->id)->delete();
            return response()->json([
                'message' => 'Status reset to pending.',
                'data' => null
            ]);
        }

        $response = Response::create([
            'event_id' => $event->id,
            'guest_id' => $guest->id,
            'response' => $validated['response'],
            'message' => $validated['message'],
        ]);

        return response()->json([
            'message' => 'Response submitted successfully!',
            'data' => $response
        ]);
    }

    public function stats(int $eventId)
    {
        $total = Guest::where('event_id', $eventId)->count();
        $confirmed = Guest::where('event_id', $eventId)->where('status', 'confirmed')->count();
        $declined = Guest::where('event_id', $eventId)->where('status', 'declined')->count();
        $pending = Guest::where('event_id', $eventId)->where('status', 'pending')->count();

        return response()->json([
            'total' => $total,
            'confirmed' => $confirmed,
            'declined' => $declined,
            'pending' => $pending,
        ]);
    }
}
