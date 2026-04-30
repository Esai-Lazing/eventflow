import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Search, CheckCircle2, MessageCircle, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Input, Button, cn } from './Base';
import { InputEvent } from './InputEvent';
import { SwitchEvent } from './SwitchEvent';
import { toast } from 'sonner';
import { notify } from '../../lib/notify';

export const WhatsAppBroadcasterModal = ({ isOpen, onClose, guests, event, onMarkAsSent }) => {
    const [search, setSearch] = useState('');
    const [showOnlyUnsent, setShowOnlyUnsent] = useState(false);

    const filteredGuests = guests.filter(g => {
        const nameMatches = g.name.toLowerCase().includes(search.toLowerCase());
        const unsentMatches = showOnlyUnsent ? !g.invitation_sent : true;
        return nameMatches && unsentMatches;
    });

    const getWhatsAppLink = (guest) => {
        const invitationLink = `${window.location.origin}/api/s/${event.slug}?token=${guest.token}`;

        // Dynamic greeting based on guest count
        let greetingName = guest.name;
        if (guest.guest_count >= 2) {
            const names = guest.name.trim().split(' ');
            const lastName = names[names.length - 1];

            if (guest.guest_count === 2) {
                greetingName = `M. & Mme ${lastName}`;
            } else {
                greetingName = `La Famille ${lastName}`;
            }
        }

        const bride = event.customization?.bride;
        const groom = event.customization?.groom;
        const hostNames = (bride && groom) ? `${bride} & ${groom}` : event.title;

        const message = `✨ *INVITATION DE MARIAGE* ✨\n\nBonjour *${greetingName}*,\n\nNous avons l'immense joie de vous convier à la célébration de notre union : *${hostNames}*.\n\nVotre présence parmi nous pour ce moment d'exception nous honorerait profondément. Votre invitation personnelle ainsi que votre *Pass d'accès QR Code* sont disponibles via le lien suivant :\n\n👉 ${invitationLink}\n\n_Avec toute notre affection, nous avons hâte de vous retrouver._`;
        return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-lg bg-card rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-border"
                        data-lenis-prevent
                    >
                        {/* Header */}
                        <div className="p-2 md:p-4 lg:p-6 border-b border-border flex items-center justify-between bg-muted/50">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center border border-emerald-500 shadow-sm">
                                    <MessageCircle size={22} strokeWidth={2.5} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-foreground tracking-tight">WhatsApp Diffusion</h2>
                                    </div>
                                    <p className="text-sm text-muted-foreground font-medium">Gérez vos envois personnalisés</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search & Filters */}
                        <div className="p-2 md:p-4 lg:p-6 border-b border-border bg-muted/20 flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex-1">
                                    <InputEvent
                                        icon={Search}
                                        placeholder="rechercher un invité..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="h-11 border-border bg-card focus:border-primary focus:ring-primary/5 rounded-full"
                                    />
                                </div>

                                <div
                                    className="flex items-center gap-2 cursor-pointer select-none group"
                                    onClick={() => setShowOnlyUnsent(!showOnlyUnsent)}
                                >
                                    <span className="text-[13px] font-bold text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap">Non envoyé</span>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <SwitchEvent
                                            checked={showOnlyUnsent}
                                            onChange={(e) => setShowOnlyUnsent(e.target.checked)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar" data-lenis-prevent>
                            {filteredGuests.length > 0 ? (
                                filteredGuests.map((guest) => (
                                    <div
                                        key={guest.id}
                                        className="group flex items-center justify-between p-2 md:p-4 lg:p-2 rounded-2xl hover:bg-muted/50 border border-transparent transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-primary font-bold text-base border border-border">
                                                {guest.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-[15px] font-bold text-foreground tracking-tight leading-none mb-1.5">{guest.name}</p>
                                                <div className="flex items-center gap-2">
                                                    {guest.invitation_sent && (guest.status === 'pending') ? (
                                                        <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                                                            <CheckCircle2 size={12} />
                                                            Invité notifié
                                                        </span>
                                                    ) : (
                                                        <span className={cn(
                                                            "text-[10px] font-bold rounded-full ",
                                                            guest.status === 'confirmed' ? "text-emerald-500" :
                                                                guest.status === 'declined' ? "text-rose-500" : "text-muted-foreground"
                                                        )}>
                                                            {guest.status === 'pending' ? 'En attente' : guest.status === 'confirmed' ? "Confirmé" : "Décliné"}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {(guest.status === 'confirmed' || guest.status === 'declined') ? (
                                                <div className="h-8 px-4 rounded-full bg-foreground/10 text-foreground text-[13px] font-bold flex items-center gap-2 border border-foreground/20 opacity-60">
                                                    <CheckCircle2 size={14} />
                                                    <span>Traité</span>
                                                </div>
                                            ) : (
                                                <Button
                                                    onClick={() => {
                                                        if (!guest.table_id && (!guest.table || !guest.table.name)) {
                                                            notify.error("Action requise", "Cet invité n'est pas encore assigné à une table. Veuillez le placer avant d'envoyer son invitation.");
                                                            return;
                                                        }
                                                        window.open(getWhatsAppLink(guest), '_blank');
                                                        onMarkAsSent(guest.id);
                                                    }}
                                                    className={cn(
                                                        "h-8 px-2 rounded-full text-[13px] font-bold flex items-center gap-2 transition-all w-auto",
                                                        guest.invitation_sent
                                                            ? "bg-primary/10 text-primary border border-primary/20 shadow-none hover:bg-primary/20"
                                                            : "bg-primary text-primary-foreground hover:bg-primary/80 hover:opacity-90 shadow-lg shadow-primary/10 border-none group/send"
                                                    )}
                                                >
                                                    <Send size={14} className={cn(guest.invitation_sent ? "opacity-30" : "text-primary-foreground")} />
                                                    <span>{guest.invitation_sent ? "Renvoyer" : "Envoyer"}</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center space-y-4">
                                    <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center mx-auto text-muted-foreground/20">
                                        <Search size={32} />
                                    </div>
                                    <p className="text-sm font-bold text-muted-foreground">Aucun invité trouvé</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
