<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function getData(Request $request)
    {
        $user = Auth::user();
        
        // Fetch all events for the user
        $events = Event::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();
            
        if ($events->isEmpty()) {
            return response()->json([
                'events' => [],
                'selectedEvent' => null,
                'guests' => [],
                'tables' => []
            ]);
        }

        // Use the requested slug or the first event
        $slug = $request->query('slug');
        $selectedEvent = $slug 
            ? $events->where('slug', $slug)->first() 
            : $events->first();
            
        if (!$selectedEvent) {
            $selectedEvent = $events->first();
        }

        // Load guests and tables for the selected event in parallel (Eloquent handles this sequentially but it's one DB session)
        $guests = $selectedEvent->guests()
            ->orderBy('created_at', 'desc')
            ->get();
            
        $tables = $selectedEvent->tables()->get();

        return response()->json([
            'events' => $events,
            'selectedEvent' => $selectedEvent,
            'guests' => $guests,
            'tables' => $tables
        ]);
    }
}
