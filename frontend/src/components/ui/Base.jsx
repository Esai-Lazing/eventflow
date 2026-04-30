import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const Button = ({ className, variant = 'primary', ...props }) => {
    const variants = {
        primary: 'bg-[#1a1a1a] text-white hover:bg-[#2a2a2a] active:scale-[0.97]',
        lime: 'bg-[#d4ff4f] text-[#1a1a1a] hover:bg-[#c5f035] active:scale-[0.97]',
        secondary: 'bg-[#c8cfc2] text-[#4a5240] hover:bg-[#bbc3ae] active:scale-[0.97]',
        outline: 'bg-white/60 backdrop-blur-sm border border-white/40 text-[#1a1a1a] hover:bg-white/80 active:scale-[0.97]',
        ghost: 'text-[#7a8270] hover:text-[#1a1a1a] hover:bg-white/30 active:scale-[0.97]',
    };

    return (
        <button
            className={cn(
                'w-full cursor-pointer py-3.5 px-6 rounded-2xl font-bold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none text-sm tracking-tight',
                variants[variant],
                className
            )}
            {...props}
        />
    );
};

export const Input = ({ label, error, className, ...props }) => {
    return (
        <div className="w-full space-y-2">
            {label && <label className="text-sm font-normal text-foreground/70 ml-1">{label}</label>}
            <input
                className={cn(
                    'w-full px-3 py-3.5 bg-transparent border border-foreground/20 rounded-lg outline-none transition-all duration-200 focus:border-[#1a1a1a]/20 focus:ring-4 focus:ring-[#1a1a1a]/5 text-foreground/70 placeholder:text-foreground/50 text-sm',
                    error && 'border-rose-400 focus:border-rose-400 focus:ring-rose-400/10',
                    className
                )}
                {...props}
            />
            {error && <p className="text-[11px] text-rose-500 font-bold ml-1">{error}</p>}
        </div>
    );
};
