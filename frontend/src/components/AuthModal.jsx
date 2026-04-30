import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Button } from './ui/Base';
import { InputEvent } from './ui/InputEvent';
import { authService } from '../services/api';

// InputEvent is now used directly below

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [authError, setAuthError] = useState(null);

    if (!isOpen) return null;

    const validateForm = () => {
        const errors = {};
        if (!isLogin && !formData.name.trim()) {
            errors.name = 'Le nom complet est requis pour l\'inscription.';
        }
        if (!formData.email.trim()) {
            errors.email = 'L\'adresse email est requise.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Format d\'email invalide (ex: jean@exemple.com).';
        }
        if (!formData.password) {
            errors.password = 'Le mot de passe est obligatoire.';
        } else if (!isLogin && formData.password.length < 8) {
            errors.password = 'Le mot de passe doit faire au moins 8 caractères.';
        }
        if (!isLogin && formData.password !== formData.password_confirmation) {
            errors.password_confirmation = 'La confirmation ne correspond pas au mot de passe.';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        setAuthError(null);
        setFieldErrors({});

        try {
            const response = isLogin
                ? await authService.login({ email: formData.email, password: formData.password })
                : await authService.register(formData);

            onSuccess(response.data.user, response.data.access_token);
        } catch (err) {
            const errorData = err.response?.data;

            if (err.response?.status === 422 && errorData?.errors) {
                const backendErrors = {};
                Object.keys(errorData.errors).forEach(key => {
                    backendErrors[key] = errorData.errors[key][0];
                });
                setFieldErrors(backendErrors);
            } else {
                // Better generic messages based on error type
                const msg = errorData?.message ||
                    (err.response?.status === 401 ? 'Identifiants incorrects.' :
                        err.response?.status === 403 ? 'Compte bloqué ou non autorisé.' :
                            'Impossible de contacter le serveur. Veuillez réessayer.');
                setAuthError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear errors for this field as the user types
        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
        if (authError) setAuthError(null);
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-1000">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md max-h-[85vh] bg-white rounded-[2.2rem] overflow-hidden shadow-2xl flex flex-col z-20"
            >
                <div className="p-6 flex items-center justify-between bg-dark/5/50 border-b border-dark/5">
                    <div className="text-left">
                        <div>
                            <h3 className="text-xl font-bold text-stone-900 tracking-tight leading-none">
                                {isLogin ? 'Authentification' : 'Créer un compte'}
                            </h3>
                            <p className="text-sm text-stone-400 font-bold mt-1 opacity-80">
                                {isLogin ? "Accès sécurisé" : "Rejoindre l'aventure"}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 hover:bg-dark/5 rounded-full flex items-center justify-center text-dark/40 hover:text-dark transition-all"><X size={20} /></button>
                </div>

                <div className="p-6 pt-8">
                    {authError && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-rose-500 rounded-2xl text-white text-[11px] font-bold text-center uppercase tracking-widest shadow-lg shadow-rose-200"
                        >
                            {authError}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <InputEvent
                                label="Nom complet"
                                icon={User}
                                type="text"
                                placeholder="Jean Dupont"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                error={fieldErrors.name}
                                className="py-4 rounded-2xl"
                            />
                        )}

                        <InputEvent
                            label="Email professionnel ou personnel"
                            icon={Mail}
                            type="email"
                            placeholder="jean@exemple.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            error={fieldErrors.email}
                            className="py-4 rounded-2xl"
                        />

                        <InputEvent
                            label="Mot de passe"
                            icon={Lock}
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            error={fieldErrors.password}
                            className="py-4 rounded-2xl"
                        />
                        {!isLogin && (
                            <InputEvent
                                label="Confirmez le mot de passe"
                                icon={Lock}
                                type="password"
                                placeholder="••••••••"
                                value={formData.password_confirmation}
                                onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                                error={fieldErrors.password_confirmation}
                                className="py-4 rounded-2xl"
                            />
                        )}

                        <div className="pt-3">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-14 bg-[#18181b] font-medium text-md hover:bg-zinc-800 text-[#c09050] rounded-full flex items-center justify-center gap-3 transition-all active:scale-95 border-none"
                            >
                                {loading ? 'Vérification en cours...' : isLogin ? 'Se connecter' : 'Valider l\'inscription'}
                                {!loading && <ArrowRight size={18} strokeWidth={3} className="ml-2" />}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-8 pb-10 text-center">
                        <p className="text-stone-500 text-sm font-medium">
                            {isLogin ? "Pas encore de compte ?" : "Vous avez déjà un compte ?"}
                            <button
                                onClick={() => {
                                    setIsLogin(!isLogin);
                                    setFieldErrors({});
                                    setAuthError(null);
                                }}
                                className="ml-2 text-[#c09050] font-bold text-sm hover:text-[#b08040] transition-colors underline underline-offset-4 decoration-[#c09050]/30"
                            >
                                {isLogin ? "S'inscrire" : "Se connecter"}
                            </button>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AuthModal;
