<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SendGuestReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:send-guest-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envoie des rappels aux invités (J-2 et J-1) pour les événements confirmés.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Début de l\'envoi des rappels...');

        // J-2 Reminders
        $guests2d = \App\Models\Guest::where('status', 'confirmed')
            ->where('reminder_sent_2d', false)
            ->whereHas('event', function($query) {
                $query->whereDate('date', now()->addDays(2)->toDateString());
            })
            ->with('event')
            ->get();

        foreach ($guests2d as $guest) {
            $guest->notify(new \App\Notifications\GuestReminderNotification($guest, 2));
            $guest->update(['reminder_sent_2d' => true]);
            $this->line("Rappel J-2 envoyé à : " . $guest->name . " (" . $guest->event->title . ")");
        }

        // J-1 Reminders
        $guests1d = \App\Models\Guest::where('status', 'confirmed')
            ->where('reminder_sent_1d', false)
            ->whereHas('event', function($query) {
                $query->whereDate('date', now()->addDay()->toDateString());
            })
            ->with('event')
            ->get();

        foreach ($guests1d as $guest) {
            $guest->notify(new \App\Notifications\GuestReminderNotification($guest, 1));
            $guest->update(['reminder_sent_1d' => true]);
            $this->line("Rappel J-1 envoyé à : " . $guest->name . " (" . $guest->event->title . ")");
        }

        $this->info('Fin de l\'envoi des rappels.');
    }
}
