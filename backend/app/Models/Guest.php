<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use Illuminate\Notifications\Notifiable;

class Guest extends Model
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'event_id', 
        'name', 
        'phone', 
        'email',
        'guest_type', 
        'guest_count',
        'status', 
        'table_number', 
        'table_id',
        'seat_number',
        'token', 
        'qr_code', 
        'checked_in', 
        'invitation_sent',
        'token_expires_at',
        'music_suggestions',
        'guestbook_message',
        'reminder_sent_2d',
        'reminder_sent_1d'
    ];

    protected $casts = [
        'token_expires_at' => 'datetime',
        'checked_in' => 'boolean',
        'invitation_sent' => 'boolean',
        'reminder_sent_2d' => 'boolean',
        'reminder_sent_1d' => 'boolean',
        'music_suggestions' => 'array',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($guest) {
            if (!$guest->token) {
                $guest->token = \Illuminate\Support\Str::random(32);
            }
        });
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(Table::class);
    }
}

class Response extends Model
{
    use HasFactory;

    protected $fillable = ['event_id', 'guest_id', 'response', 'message'];

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class);
    }
}
