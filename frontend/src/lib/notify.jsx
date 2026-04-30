import React from 'react';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle, X, Info, Clock, Trash2, UserX } from 'lucide-react';
import { cn } from './utils';

const CustomToast = ({ t, title, description, icon: Icon, type = 'success' }) => {
    const typeStyles = {
        success: {
            border: 'border-emerald-500/20',
            bg: 'bg-emerald-50/50 dark:bg-emerald-500/5',
            iconBg: 'bg-emerald-500/10',
            iconText: 'text-emerald-500',
            accent: 'bg-emerald-500'
        },
        error: {
            border: 'border-rose-500/30',
            bg: 'bg-rose-50/50 dark:bg-rose-500/5',
            iconBg: 'bg-rose-500/10',
            iconText: 'text-rose-500',
            accent: 'bg-rose-500'
        },
        warning: {
            border: 'border-amber-500/30',
            bg: 'bg-amber-50/50 dark:bg-amber-500/5',
            iconBg: 'bg-amber-500/10',
            iconText: 'text-amber-500',
            accent: 'bg-amber-500'
        },
        info: {
            border: 'border-blue-500/30',
            bg: 'bg-blue-50/50 dark:bg-blue-500/5',
            iconBg: 'bg-blue-500/10',
            iconText: 'text-blue-500',
            accent: 'bg-blue-500'
        }
    };

    const styles = typeStyles[type] || typeStyles.success;

    return (
        <div className={cn(
            "flex items-start gap-3 md:gap-4 border shadow-2xl p-4 md:p-4 rounded-xl font-sans relative overflow-hidden transition-all duration-300",
            "w-[calc(100vw-2rem)] sm:w-[380px] backdrop-blur-md",
            styles.bg,
            styles.border
        )}>
            <div className={cn("absolute left-1 rounded-lg top-1/2 -translate-y-1/2 h-[70%] w-1", styles.accent)}></div>
            <div className={cn("flex items-center justify-center rounded-full w-10 h-10 shrink-0 shadow-sm border border-black/5", styles.iconBg, styles.iconText)}>
                {Icon ? <Icon size={18} strokeWidth={2.5} /> : <CheckCircle2 size={18} strokeWidth={2.5} />}
            </div>
            <div className="flex flex-col gap-0.5 flex-1 pt-0.5 min-w-0">
                <h3 className="font-bold text-foreground text-[14px] md:text-[15px] leading-tight">{title}</h3>
                {description && (
                    <div className="text-muted-foreground text-[12px] md:text-[13px] font-medium leading-relaxed opacity-80 line-clamp-2">
                        {description}
                    </div>
                )}
            </div>
            <button
                onClick={() => toast.dismiss(t)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted p-1.5 rounded-xl transition-all shrink-0 mt-0.5"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export const notify = {
    success: (title, description, icon) => toast.custom((t) => (
        <CustomToast t={t} title={title} description={description} icon={icon || CheckCircle2} type="success" />
    )),
    error: (title, description, icon) => toast.custom((t) => (
        <CustomToast t={t} title={title} description={description} icon={icon || AlertTriangle} type="error" />
    )),
    warning: (title, description, icon) => toast.custom((t) => (
        <CustomToast t={t} title={title} description={description} icon={icon || AlertTriangle} type="warning" />
    )),
    info: (title, description, icon) => toast.custom((t) => (
        <CustomToast t={t} title={title} description={description} icon={icon || Info} type="info" />
    ))
};
