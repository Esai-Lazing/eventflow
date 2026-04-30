<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GuestReminderNotification extends Notification
{
    use Queueable;

    protected $guest;
    protected $daysLeft;

    /**
     * Create a new notification instance.
     */
    public function __construct($guest, $daysLeft)
    {
        $this->guest = $guest;
        $this->daysLeft = $daysLeft;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        // On utilise la base de données pour les notifs navigateur
        // Et on ajoutera l'appel WhatsApp ici
        return ['database'];
    }

    /**
     * Get the array representation of the notification (for Browser/Database).
     */
    public function toArray(object $notifiable): array
    {
        $event = $this->guest->event;
        $title = $this->daysLeft == 1 ? "C'est pour demain !" : "J-2 avant le grand jour !";
        
        // On déclenche l'envoi WhatsApp ici si un numéro est présent
        $this->sendWhatsApp($notifiable);

        return [
            'title' => $title,
            'message' => "Nous avons hâte de vous retrouver pour " . $event->title . ". N'oubliez pas votre Pass QR !",
            'event_slug' => $event->slug,
            'guest_token' => $this->guest->token,
            'days_left' => $this->daysLeft
        ];
    }

    /**
     * Envoi WhatsApp via API (UltraMsg ou similaire)
     */
    protected function sendWhatsApp($notifiable)
    {
        if (!$this->guest->phone) return;

        $event = $this->guest->event;
        $url = config('app.frontend_url', 'http://localhost:5173') . '/invite/' . $event->slug . '?token=' . $this->guest->token;
        
        $message = "Bonjour " . $this->guest->name . " ! 👋\n\n";
        $message .= "C'est un petit rappel pour *" . $event->title . "*.\n";
        $message .= ($this->daysLeft == 1 ? "C'est demain !" : "Plus que 2 jours !") . " 🎊\n\n";
        $message .= "Retrouvez tous les détails et votre Pass QR ici : " . $url . "\n\n";
        $message .= "À très vite !";

        // Récupération des clés depuis le fichier .env
        $token = config('services.whatsapp.token');
        $instanceId = config('services.whatsapp.instance_id');

        if ($token && $instanceId) {
            try {
                \Illuminate\Support\Facades\Http::post("https://api.ultramsg.com/{$instanceId}/messages/chat", [
                    'token' => $token,
                    'to' => $this->guest->phone,
                    'body' => $message,
                    'priority' => 1
                ]);
                \Illuminate\Support\Facades\Log::info("WhatsApp envoyé avec succès à " . $this->guest->phone);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Erreur WhatsApp : " . $e->getMessage());
            }
        } else {
            // Fallback sur le Log si les clés ne sont pas configurées
            \Illuminate\Support\Facades\Log::info("[WhatsApp Simulation] To: " . $this->guest->phone . " | Message: " . $message);
        }
    }
}
