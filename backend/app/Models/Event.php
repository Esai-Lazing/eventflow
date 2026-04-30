<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'type',
        'date',
        'time',
        'location',
        'description',
        'template',
        'cover_image',
        'slug',
        'customization',
        'status',
        'current_step',
        'guest_limit',
        'staff_token'
    ];

    protected $casts = [
        'customization' => 'array',
        'date' => 'date',
        'current_step' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function guests(): HasMany
    {
        return $this->hasMany(Guest::class);
    }

    public function responses(): HasMany
    {
        return $this->hasMany(Response::class);
    }

    public function tables(): HasMany
    {
        return $this->hasMany(Table::class);
    }
}
