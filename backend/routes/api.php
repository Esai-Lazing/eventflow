<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\RSVPController;
use App\Http\Controllers\GuestController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Auth Routes (Public)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::put('/user/password', [AuthController::class, 'updatePassword']);
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{slug}', [EventController::class, 'update']);
    Route::post('/events/{slug}/music', [EventController::class, 'uploadMusic']);
    Route::delete('/events/{slug}/music/{songId}', [EventController::class, 'deleteMusic']);
    Route::get('/events/{id}/stats', [RSVPController::class, 'stats']);
    
    // Guests
    Route::get('/events/{slug}/guests', [GuestController::class, 'index']);
    Route::post('/events/{slug}/guests', [GuestController::class, 'store']);
    Route::put('/guests/{id}', [GuestController::class, 'update']);
    Route::delete('/guests/{id}', [GuestController::class, 'destroy']);

    // Tables
    Route::get('/events/{slug}/tables', [\App\Http\Controllers\TableController::class, 'index']);
    Route::post('/events/{slug}/tables', [\App\Http\Controllers\TableController::class, 'store']);
    Route::put('/tables/{id}', [\App\Http\Controllers\TableController::class, 'update']);
    Route::delete('/tables/{id}', [\App\Http\Controllers\TableController::class, 'destroy']);
    
    // Dashboard
    Route::get('/dashboard/data', [\App\Http\Controllers\DashboardController::class, 'getData']);
});

// Public / Token-based Routes (Rate Limited)
Route::middleware('throttle:20,1')->group(function () {
    Route::post('/guests/{token}/check-in', [GuestController::class, 'checkIn']);
    Route::get('/guests/{token}', [GuestController::class, 'show']);
    Route::post('/guests/{token}/music', [GuestController::class, 'suggestMusic']);
    Route::post('/guests/{token}/guestbook', [GuestController::class, 'postGuestbook']);
    Route::get('/guests/{token}/notifications', [GuestController::class, 'getNotifications']);
});

Route::get('/events/slug/{slug}', [EventController::class, 'show']);
Route::get('/music-proxy/{eventId}/{fileName}', [EventController::class, 'proxyMusic'])->where('fileName', '.*');
Route::get('/image-proxy/{slug}/{fileName}', [EventController::class, 'proxyImage'])->where('fileName', '.*');
Route::get('/s/{slug}', [EventController::class, 'shareInvitation']);
Route::post('/rsvp/{slug}', [RSVPController::class, 'submit']);
