<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

use App\Models\Table;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class TableController extends Controller
{
    public function index($slug): JsonResponse
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        
        if ($event->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $tables = $event->tables()->get();
        return response()->json($tables);
    }

    public function store(Request $request, $slug): JsonResponse
    {
        $event = Event::where('slug', $slug)->firstOrFail();
        
        if ($event->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('tables')->where(function ($query) use ($event) {
                    return $query->where('event_id', $event->id);
                }),
            ],
            'capacity' => 'integer|min:1',
            'pos_x' => 'numeric',
            'pos_y' => 'numeric',
        ], [
            'name.unique' => 'Une table avec ce nom existe déjà pour cet événement.'
        ]);

        $table = $event->tables()->create($validated);
        
        return response()->json($table, 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $table = Table::findOrFail($id);
        $event = $table->event;

        if ($event->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('tables')->where(function ($query) use ($event) {
                    return $query->where('event_id', $event->id);
                })->ignore($table->id),
            ],
            'capacity' => 'sometimes|integer|min:1',
            'pos_x' => 'sometimes|numeric',
            'pos_y' => 'sometimes|numeric',
        ], [
            'name.unique' => 'Une table avec ce nom existe déjà pour cet événement.'
        ]);

        $table->update($validated);
        
        return response()->json($table);
    }

    public function destroy($id): JsonResponse
    {
        $table = Table::findOrFail($id);
        $event = $table->event;

        if ($event->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $table->delete();
        
        return response()->json(['message' => 'Table deleted']);
    }
}
