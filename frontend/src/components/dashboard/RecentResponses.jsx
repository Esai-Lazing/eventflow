import React, { useState, useEffect } from 'react';
import { cn } from '../ui/Base';
import { ArrowRight } from 'lucide-react';
import InsetCornerCard from '../ui/InsetCornerCard';

const statusConfig = {
    confirmed: { label: '✓ Confirmé', dot: 'bg-emerald-400', text: 'text-emerald-500', avatarBg: 'bg-primary text-primary-foreground' },
    declined: { label: '✕ Décliné', dot: 'bg-rose-400', text: 'text-rose-500', avatarBg: 'bg-muted text-muted-foreground' },
    pending: { label: '· En attente', dot: 'bg-amber-400', text: 'text-amber-500', avatarBg: 'bg-secondary text-foreground' },
};

export const RecentResponses = ({ guests, onSeeAll }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <div className="bg-background p-2 rounded-[2rem] shadow-md border border-border">
            <InsetCornerCard
                bg="bg-card"
                cutoutColor="var(--background)"
                className="p-0"
                containerClassName="h-full"
                position="top-right"
                cornerElement={
                    <button
                        onClick={onSeeAll}
                        className="relative font-semibold text-muted-foreground bg-card hover:bg-muted h-10 w-10 lg:h-14 lg:w-14 flex justify-center items-center rounded-full transition-all group/btn border border-border"
                    >
                        <ArrowRight size={isMobile ? 18 : 20} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                }
            >
                <div className="mb-4 lg:mb-6 max-w-fit pt-4 lg:pt-5 px-5 lg:px-7">
                    <h3 className="text-base lg:text-lg font-bold text-foreground tracking-tight">Derniers invités</h3>
                    <p className="text-[10px] lg:text-[11px] text-muted-foreground mt-0.5 lg:mt-1">Activité récente</p>
                </div>

                <div className="overflow-y-auto flex-1 custom-scrollbar" data-lenis-prevent>
                    {guests.slice(0, 5).map((guest) => {
                        const cfg = statusConfig[guest.status] || statusConfig.pending;
                        return (
                            <div key={guest.id} className="flex items-center justify-between px-5 lg:px-6 py-2 lg:py-2.5 first:border-t border-b border-border hover:bg-muted/30 transition-colors group/item">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl flex items-center justify-center font-semibold text-[13px] shrink-0", cfg.avatarBg)}>
                                        {guest.name[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{guest.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                                            <p className={cn("text-[11px] font-medium", cfg.text)}>{cfg.label}</p>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[11px] text-muted-foreground group-hover/item:text-foreground transition-colors">
                                    {new Date(guest.updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                </span>
                            </div>
                        );
                    })}
                    {guests.length === 0 && (
                        <div className="py-16 text-center">
                            <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                                <span className="text-xl">👥</span>
                            </div>
                            <p className="text-[12px] font-medium text-muted-foreground">Aucun invité pour l'instant.</p>
                        </div>
                    )}
                </div>
            </InsetCornerCard>
        </div>
    );
};