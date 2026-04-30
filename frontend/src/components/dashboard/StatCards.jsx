import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../ui/Base';

export const StatCard = ({ icon: Icon, label, value, subtext, progress, variant = 'white' }) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const isDark = variant === 'dark';
    const isGold = variant === 'gold';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={!isMobile ? { y: -2 } : {}}
            className={cn(
                "relative p-6 rounded-3xl overflow-hidden transition-all duration-300 h-full flex flex-col justify-between border",
                variant === 'white' && "bg-card border-border shadow-sm text-foreground",
                variant === 'gold' && "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10",
                variant === 'dark' && "bg-muted border-border text-foreground",
                variant === 'champagne' && "bg-muted/50 border-border text-foreground"
            )}
        >
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                        isGold ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"
                    )}>
                        {Icon && <Icon size={20} strokeWidth={2} />}
                    </div>
                    {progress !== undefined && (
                        <span className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded-md",
                            isGold ? "bg-white/10 text-white" : "bg-primary text-primary-foreground"
                        )}>
                            {progress}%
                        </span>
                    )}
                </div>

                <div className="space-y-1">
                    <p className={cn(
                        "text-[10px] font-bold uppercase tracking-widest opacity-70",
                        isGold ? "text-zinc-100" : "text-muted-foreground"
                    )}>
                        {label}
                    </p>

                    <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-bold tracking-tight">
                            {value}
                        </span>
                        {subtext && (
                            <span className="text-xs font-medium text-zinc-100">
                                / {subtext}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {progress !== undefined && (
                <div className="mt-6">
                    <div className={cn(
                        "h-1.5 w-full rounded-full overflow-hidden",
                        isGold ? "bg-white/10" : "bg-muted"
                    )}>
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "circOut" }}
                            className={cn(
                                "h-full rounded-full",
                                isGold ? "bg-primary" : "bg-primary"
                            )}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export const StatGrid = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                icon={stats.confirmedIcon}
                label="Confirmés"
                value={stats.confirmed}
                subtext={stats.total}
                progress={stats.rate}
                variant="gold"
            />
            <StatCard
                icon={stats.pendingIcon}
                label="En Attente"
                value={stats.pending}
                variant="white"
            />
            <StatCard
                icon={stats.declinedIcon}
                label="Déclinés"
                value={stats.declined}
                variant="white"
            />
            <StatCard
                icon={stats.totalIcon}
                label="Capacité"
                value={stats.total}
                subtext={stats.limit}
                progress={stats.capacity_rate}
                variant="white"
            />
        </div>
    );
};
