import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, User, Users, ShieldCheck, Loader2, Lock, ArrowRight } from 'lucide-react';
import { guestService } from '../services/api';
import { Button, cn } from '../components/ui/Base';
import { useAuth } from '../hooks/useAuth';
import AuthModal from '../components/AuthModal';

const CheckInPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, user, login: setAuthData } = useAuth();
    const [status, setStatus] = useState('loading'); // 'loading', 'success', 'warning', 'error', 'unauthorized'
    const [guest, setGuest] = useState(null);
    const [error, setError] = useState(null);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    // Audio context helper for premium beeps
    const playBeep = (type) => {
        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gain = context.createGain();

            oscillator.connect(gain);
            gain.connect(context.destination);

            if (type === 'success') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, context.currentTime); // A5
                oscillator.frequency.exponentialRampToValueAtTime(1320, context.currentTime + 0.1);
                gain.gain.setValueAtTime(0.3, context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.3);
            } else if (type === 'warning') {
                // Double beep for warning
                [0, 0.2].forEach(delay => {
                    const osc = context.createOscillator();
                    const g = context.createGain();
                    osc.connect(g);
                    g.connect(context.destination);
                    osc.frequency.setValueAtTime(440, context.currentTime + delay);
                    g.gain.setValueAtTime(0.2, context.currentTime + delay);
                    g.gain.exponentialRampToValueAtTime(0.01, context.currentTime + delay + 0.15);
                    osc.start(context.currentTime + delay);
                    osc.stop(context.currentTime + delay + 0.15);
                });
            } else {
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(220, context.currentTime); // Lower pitch
                gain.gain.setValueAtTime(0.2, context.currentTime);
                gain.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);
                oscillator.start(context.currentTime);
                oscillator.stop(context.currentTime + 0.5);
            }
        } catch (e) { console.error('Audio error:', e); }

        if (navigator.vibrate) {
            navigator.vibrate(type === 'success' ? 50 : [100, 50, 100]);
        }
    };

    const performCheckIn = async () => {
        setStatus('loading');
        try {
            const response = await guestService.checkIn(token);
            setGuest(response.data.guest);
            setStatus('success');
            playBeep('success');
        } catch (err) {
            if (err.response?.status === 401) {
                // If unauthorized and we had a staff token, maybe it's invalid
                if (localStorage.getItem('staffToken')) {
                    localStorage.removeItem('staffToken');
                    setError("Le token staff est invalide ou a été réinitialisé.");
                    setStatus('error');
                } else {
                    setStatus('unauthorized');
                }
                playBeep('error');
            } else if (err.response?.status === 403) {
                setError("Accès refusé : Seul l'hôte ou le staff autorisé peut valider les invitations.");
                setStatus('error');
                playBeep('error');
            } else if (err.response?.status === 422) {
                setGuest(err.response.data.guest);
                setStatus('warning');
                playBeep('warning');
            } else if (err.response?.status === 404) {
                setError("Invitation introuvable ou inexistante.");
                setStatus('error');
                playBeep('error');
            } else {
                setError(err.response?.data?.message || 'Erreur lors du check-in.');
                setStatus('error');
                playBeep('error');
            }
        }
    };

    useEffect(() => {
        // Check if there is a staff_token in the URL
        const queryParams = new URLSearchParams(window.location.search);
        const staffTokenFromUrl = queryParams.get('staff_token');
        
        if (staffTokenFromUrl) {
            localStorage.setItem('staffToken', staffTokenFromUrl);
            // Clean up the URL query params
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        const hasStaffToken = !!localStorage.getItem('staffToken');

        // Handle "setup" mode (authentication only, no actual check-in)
        if (token === 'setup') {
            if (hasStaffToken) {
                setStatus('success_setup');
            } else {
                setStatus('unauthorized');
            }
            return;
        }

        if (!isAuthenticated && !hasStaffToken) {
            setStatus('unauthorized');
        } else {
            performCheckIn();
        }
    }, [token, isAuthenticated]);

    const handleLoginSuccess = (userData, token) => {
        setAuthData(userData, token);
        setIsAuthModalOpen(false);
        // performCheckIn will be triggered by the useEffect since isAuthenticated changes
    };

    return (
        <div className="min-h-screen bg-[#fcfaf7] flex items-center justify-center p-6 font-sans">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white rounded-[48px] shadow-2xl p-10 border border-stone-100 text-center relative overflow-hidden"
            >
                {/* Decorative gradients */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-amber-200 to-transparent opacity-50" />

                <AnimatePresence mode="wait">
                    {status === 'loading' && (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-8 py-12"
                        >
                            <div className="relative w-24 h-24 mx-auto">
                                <Loader2 className="w-full h-full text-amber-500/20 animate-spin" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <ShieldCheck className="w-10 h-10 text-amber-500 animate-pulse" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <h2 className="text-3xl font-black text-stone-800 tracking-tighter uppercase">Vérification</h2>
                                <p className="text-stone-400 font-medium text-sm">Sécurisation du point d'entrée...</p>
                            </div>
                        </motion.div>
                    )}

                    {status === 'unauthorized' && (
                        <motion.div
                            key="unauthorized"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-8 py-6"
                        >
                            <div className="w-24 h-24 bg-stone-900 rounded-[32px] flex items-center justify-center text-white mx-auto shadow-xl relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/40 to-transparent opacity-50" />
                                <Lock size={40} className="relative z-10" />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-3xl font-black text-stone-900 tracking-tighter uppercase leading-none">Accès Hôte Uniquement</h2>
                                <p className="text-stone-500 text-sm leading-relaxed px-4">
                                    Cette page est réservée à l'hôte ou au staff autorisé. Connectez-vous ou entrez un code d'accès.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <Button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="w-full h-16 rounded-[22px] bg-[#d4ff4f] text-[#1a1a1a] font-black uppercase tracking-widest text-xs hover:bg-[#c5f035] transition-all shadow-xl active:scale-95 group"
                                >
                                    Espace Hôte
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </Button>

                                <div className="flex items-center gap-4 py-2">
                                    <div className="h-px flex-1 bg-stone-100" />
                                    <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Ou Code Staff</span>
                                    <div className="h-px flex-1 bg-stone-100" />
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        id="staff-token-input"
                                        type="password"
                                        placeholder="Entrez le code staff..."
                                        className="flex-1 h-14 bg-stone-50 border border-stone-200 rounded-2xl px-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const val = e.target.value;
                                                if (val) {
                                                    localStorage.setItem('staffToken', val);
                                                    performCheckIn();
                                                }
                                            }
                                        }}
                                    />
                                    <Button
                                        onClick={() => {
                                            const val = document.getElementById('staff-token-input').value;
                                            if (val) {
                                                localStorage.setItem('staffToken', val);
                                                performCheckIn();
                                            }
                                        }}
                                        className="w-14 h-14 p-0 bg-stone-900 text-white rounded-2xl flex items-center justify-center shadow-lg"
                                    >
                                        <ArrowRight size={20} />
                                    </Button>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/')}
                                className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 transition-colors"
                            >
                                Retour à l'accueil
                            </button>
                        </motion.div>
                    )}

                    {status === 'success_setup' && (
                        <motion.div
                            key="success_setup"
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <div className="w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-200 relative">
                                <ShieldCheck size={56} strokeWidth={2.5} />
                            </div>

                            <div className="space-y-2">
                                <h1 className="text-4xl font-black text-stone-900 tracking-tighter uppercase leading-none">Staff Activé</h1>
                                <p className="text-emerald-600 font-black uppercase tracking-[0.2em] text-[10px]">Appareil de scan prêt</p>
                            </div>

                            <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
                                <p className="text-stone-500 text-sm font-medium leading-relaxed">
                                    Votre appareil est maintenant configuré comme terminal de réception. Vous pouvez commencer à scanner les QR codes des invités.
                                </p>
                            </div>

                            <Button
                                onClick={() => navigate('/')}
                                className="w-full h-16 rounded-[22px] bg-stone-900 text-white font-black uppercase tracking-widest text-xs active:scale-95"
                            >
                                Terminer la configuration
                            </Button>
                        </motion.div>
                    )}

                    {status === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="space-y-8"
                        >
                            <motion.div
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="w-28 h-28 bg-emerald-500 rounded-full flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-200 relative"
                            >
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 rounded-full border-4 border-emerald-500/30"
                                />
                                <CheckCircle size={56} strokeWidth={2.5} />
                            </motion.div>

                            <div className="space-y-2">
                                <h1 className="text-4xl font-black text-stone-900 tracking-tighter uppercase leading-none">Accès Confirmé</h1>
                                <p className="text-emerald-600 font-black uppercase tracking-[0.2em] text-[10px]">Identité Vérifiée avec succès</p>
                            </div>

                            <div className="mt-10 p-8 bg-stone-50 rounded-[32px] border border-stone-100 space-y-6 text-left relative group">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-stone-400 border border-stone-100 shadow-sm">
                                        <User size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-black tracking-widest text-stone-400 mb-1">Invité</p>
                                        <p className="font-black text-stone-900 text-xl tracking-tight">{guest?.name}</p>
                                    </div>
                                </div>

                                {(guest?.table?.name || guest?.table_number) && (
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-200/50 shadow-sm">
                                            <Users size={28} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-amber-500 mb-1">Positionnement</p>
                                            <p className="font-black text-amber-900 text-xl tracking-tight">Table {guest.table?.name || guest.table_number}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={() => navigate('/dashboard')}
                                className="w-full h-16 rounded-[22px] bg-stone-900 text-white font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl active:scale-95"
                            >
                                Retour au Dashboard
                            </Button>
                        </motion.div>
                    )}

                    {status === 'warning' && (
                        <motion.div
                            key="warning"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8"
                        >
                            <div className="w-28 h-28 bg-amber-500 rounded-full flex items-center justify-center text-white mx-auto shadow-2xl shadow-amber-200">
                                <ShieldCheck size={56} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-4xl font-black text-stone-900 tracking-tighter uppercase leading-none">Déjà Scanné</h1>
                                <p className="text-amber-600 font-bold text-sm bg-amber-50 py-1 px-4 rounded-full inline-block">
                                    Cet invité est déjà entré
                                </p>
                            </div>

                            <div className="p-8 bg-amber-50/50 rounded-[32px] border border-amber-100 text-left space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-amber-600 border border-amber-200 shadow-sm">
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-stone-800 text-lg">{guest?.name}</p>
                                        <p className="text-xs text-stone-500 font-medium">Table : {guest?.table?.name || guest?.table_number || 'Non assignée'}</p>
                                    </div>
                                </div>
                            </div>

                            <Button
                                onClick={() => navigate('/dashboard')}
                                className="w-full h-16 rounded-[22px] bg-amber-600 text-white font-black uppercase tracking-widest text-xs shadow-lg active:scale-95"
                            >
                                Terminer
                            </Button>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="space-y-8"
                        >
                            <div className="w-28 h-28 bg-rose-500 rounded-full flex items-center justify-center text-white mx-auto shadow-2xl shadow-rose-200">
                                <XCircle size={56} strokeWidth={2.5} />
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-4xl font-black text-stone-900 tracking-tighter uppercase leading-none">Accès Refusé</h1>
                                <p className="text-rose-600 font-bold text-sm px-6">{error}</p>
                            </div>

                            <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100">
                                <p className="text-rose-700 text-xs font-bold leading-relaxed uppercase tracking-tight">
                                    Passe invalide ou vous n'avez pas les droits requis pour cet événement.
                                </p>
                            </div>

                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full h-16 rounded-[22px] bg-stone-900 text-white font-black uppercase tracking-widest text-xs active:scale-95"
                            >
                                Réessayer
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onSuccess={handleLoginSuccess}
            />
        </div>
    );
};

export default CheckInPage;
