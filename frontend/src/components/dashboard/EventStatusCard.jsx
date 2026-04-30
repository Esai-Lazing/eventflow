import React, { useState, useEffect } from 'react';
import { Share2, MessageCircle, Copy, ArrowUpRight, MessageCircleReply, MessageCircleHeart } from 'lucide-react';

export const EventStatusCard = ({ event, onWhatsAppBroadcaster, onShare, showWhatsAppButton = true }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    return (
        <div className="rounded-[1.75rem] lg:rounded-[1.75rem] bg-zinc-900 p-5 lg:p-7 flex flex-col justify-between min-h-0 lg:min-h-[360px] relative overflow-hidden shadow-md shadow-zinc-900/15">
            {/* Subtle warm glow */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[#c09050]/8 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-full h-32 bg-linear-to-t from-zinc-950/40 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-5 lg:mb-7">
                    <div className="w-7 h-7 lg:w-8 lg:h-8 bg-[#c09050]/12 border border-[#c09050]/20 rounded-lg lg:rounded-xl flex items-center justify-center">
                        <Share2 size={isMobile ? 12 : 14} className="text-[#c09050]" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Diffusion</span>
                </div>

                <h3 className="text-xl lg:text-[22px] font-bold text-white leading-tight mb-2">
                    Partagez votre<br />événement
                </h3>
                <p className="text-[11px] lg:text-[12px] text-zinc-500 leading-relaxed max-w-[240px]">
                    Diffusez des invitations via WhatsApp ou copiez votre lien direct.
                </p>
            </div>

            {/* Stats row */}
            <div className="relative z-10 flex gap-3 lg:gap-4 my-4 lg:my-5">
                <div className="flex-1 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50">
                    <p className="text-[9px] lg:text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Statut</p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <p className="text-[11px] lg:text-[12px] font-semibold text-zinc-200 capitalize">{event.status === 'published' ? 'Publié' : 'Brouillon'}</p>
                    </div>
                </div>
                <div className="flex-1 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl bg-zinc-800/60 border border-zinc-700/50">
                    <p className="text-[9px] lg:text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Type</p>
                    <p className="text-[11px] lg:text-[12px] font-semibold text-zinc-200 capitalize">{event.type || 'Mariage'}</p>
                </div>
            </div>

            {/* Action buttons */}
            <div className="relative z-10 space-y-2 mt-auto">
                {showWhatsAppButton && (
                    <button
                        onClick={onWhatsAppBroadcaster}
                        className="w-full flex items-center justify-between px-4 py-3.5 bg-[#c09050] text-white rounded-xl font-semibold text-[12px] uppercase tracking-wider active:scale-[0.98] transition-all hover:bg-[#b08040] shadow-lg shadow-[#c09050]/20"
                    >
                        <div className="flex items-center gap-2">
                            <MessageCircleHeart size={15} strokeWidth={2} />
                            <span>Diffuser via WhatsApp</span>
                        </div>
                        <ArrowUpRight size={15} />
                    </button>
                )}

                <button
                    onClick={onShare}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-zinc-800 text-zinc-300 rounded-xl font-semibold text-[12px] uppercase tracking-wider active:scale-[0.98] transition-all hover:bg-zinc-700 border border-zinc-700"
                >
                    <div className="flex items-center gap-2">
                        <Copy size={14} />
                        <span>Copier le lien</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-[#c09050]" />
                </button>
            </div>
        </div>
    );
};
