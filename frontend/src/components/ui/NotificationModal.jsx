import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X, Trash2 } from 'lucide-react';
import { Button, cn } from './Base';

export const NotificationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'info', // 'info', 'success', 'warning', 'error'
    confirmText = 'Confirmer',
    cancelText = 'Annuler',
    showCancel = true
}) => {
    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle2 className="text-emerald-500" size={32} />;
            case 'warning': return <AlertCircle className="text-amber-500" size={32} />;
            case 'error': return <Trash2 className="text-rose-500" size={32} />;
            default: return <Info className="text-primary" size={32} />;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-card w-full max-w-sm rounded-[2.5rem] shadow-2xl relative overflow-hidden p-10 text-center space-y-8 border border-border"
                    >
                        <div className="flex justify-center pt-2">
                            <div className={cn(
                                "w-24 h-24 rounded-[2rem] flex items-center justify-center border transition-transform duration-500 hover:rotate-6",
                                type === 'success' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                    type === 'error' ? "bg-rose-500/10 text-rose-500 border-rose-500/20" :
                                        type === 'warning' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                            "bg-primary/10 text-primary border-primary/20"
                            )}>
                                {React.cloneElement(getIcon(), { size: 40, strokeWidth: 2.5 })}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-foreground">
                                {title === 'Succès' ? 'Réussi' : title}
                            </h3>
                            <p className="text-muted-foreground text-[14px] font-medium leading-relaxed px-2 opacity-80">{message}</p>
                        </div>

                        <div className="flex flex-col gap-3 pt-4">
                            <button
                                onClick={() => {
                                    if (onConfirm) onConfirm();
                                    onClose();
                                }}
                                className="w-full py-4 bg-foreground text-background rounded-2xl font-bold hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-foreground/5"
                            >
                                {confirmText}
                            </button>
                            {showCancel && (
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-muted text-muted-foreground rounded-2xl font-bold border border-border hover:text-foreground hover:bg-muted/80 transition-all active:scale-95"
                                >
                                    {cancelText}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
