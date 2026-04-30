import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, AlertCircle, RefreshCcw } from 'lucide-react';
import { cn } from '../components/ui/Base';

const ErrorPage = ({ code = "404", title, message }) => {
    const navigate = useNavigate();

    const errorData = {
        "404": {
            title: "Page non trouvée",
            message: "Désolé, la page que vous recherchez n'existe pas ou a été déplacée.",
            icon: AlertCircle,
        },
        "500": {
            title: "Erreur serveur",
            message: "Une erreur inattendue s'est produite de notre côté. Veuillez réessayer plus tard.",
            icon: RefreshCcw,
        }
    };

    const currentError = errorData[code] || {
        title: title || "Une erreur est survenue",
        message: message || "Quelque chose s'est mal passé.",
        icon: AlertCircle,
    };

    const Icon = currentError.icon;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-md text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="mb-8 flex justify-center"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                        <div className="relative w-24 h-24 bg-card border border-border/50 rounded-3xl flex items-center justify-center shadow-2xl backdrop-blur-sm">
                            <span className="text-4xl font-black text-foreground">{code}</span>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4 tracking-tight">
                        {currentError.title}
                    </h1>
                    <p className="text-muted-foreground text-[15px] leading-relaxed mb-10 max-w-[320px] mx-auto">
                        {currentError.message}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="w-full sm:w-auto h-12 px-8 bg-background border border-border text-foreground hover:bg-muted/50 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 group shadow-sm active:scale-95"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Retour
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full sm:w-auto h-12 px-8 bg-foreground text-background hover:bg-foreground/90 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 group shadow-lg active:scale-95"
                    >
                        <Home size={18} />
                        Accueil
                    </button>
                </motion.div>
            </div>

            {/* Footer Branding */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1 }}
                className="absolute bottom-8 left-0 right-0 text-center"
            >
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.3em]">
                    Inviattion • Experience
                </p>
            </motion.div>
        </div>
    );
};

export default ErrorPage;
