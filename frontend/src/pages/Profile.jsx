import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, LogOut, Shield, ChevronRight, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../components/ui/Base';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { notify } from '../lib/notify';
import { Sidebar, MobileNav, MobileHeader } from '../components/dashboard/Navigation';
import { NotificationModal } from '../components/ui/NotificationModal';
import { InputEvent } from '@/components/ui/InputEvent';
import { authService } from '../services/api';

const ProfilePage = () => {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [activeSection, setActiveSection] = useState('info'); // 'info' or 'security'
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const handleUpdateProfile = async (e) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        setErrors({});
        try {
            const response = await authService.updateProfile({
                name: formData.name,
                email: formData.email
            });
            updateUser(response.data.user);
            notify.success('Succès', response.data.message || 'Profil mis à jour avec succès');
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
            notify.error('Erreur', error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        if (e) e.preventDefault();
        setErrors({});

        if (!formData.current_password || !formData.new_password || !formData.confirm_password) {
            return notify.error('Champs manquants', 'Veuillez remplir tous les champs');
        }

        if (formData.new_password !== formData.confirm_password) {
            const matchError = { confirm_password: ['Les mots de passe ne correspondent pas'] };
            setErrors(matchError);
            // Clear fields even on local validation error as requested
            setFormData(prev => ({ ...prev, current_password: '', new_password: '', confirm_password: '' }));
            return notify.error('Erreur de saisie', 'Les mots de passe ne correspondent pas');
        }

        setIsLoading(true);
        try {
            const response = await authService.updatePassword({
                current_password: formData.current_password,
                new_password: formData.new_password,
                new_password_confirmation: formData.confirm_password
            });
            notify.success('Succès', response.data.message || 'Mot de passe modifié avec succès');
        } catch (error) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
                const errorsList = error.response.data.errors;
                Object.keys(errorsList).forEach(key => {
                    notify.error('Erreur de validation', errorsList[key][0]);
                });
            } else {
                notify.error('Erreur', error.response?.data?.message || 'Erreur lors du changement de mot de passe');
            }
        } finally {
            // SECURITY & USER REQUEST: Always clear password fields after attempt
            setFormData(prev => ({
                ...prev,
                current_password: '',
                new_password: '',
                confirm_password: ''
            }));
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        logout();
        navigate('/');
    };

    const handleTabChange = (tab) => {
        navigate('/dashboard', { state: { activeTab: tab } });
    };

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300 lg:pl-75">
            <Sidebar
                activeTab="profile"
                onTabChange={handleTabChange}
                eventTitle="Mon Compte"
                onPreview={() => navigate('/dashboard')}
            />
            <MobileHeader eventTitle="Compte" />
            <MobileNav
                activeTab="profile"
                onTabChange={handleTabChange}
                onAddGuest={() => navigate('/dashboard')}
            />

            <div className="max-w-4xl mx-auto px-4 pt-8 lg:pt-12 pb-34 lg:pb-24">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Paramètres</h1>
                    <p className="text-muted-foreground mt-2 text-sm sm:text-base">Gérez les paramètres de votre compte et vos préférences de sécurité.</p>
                </div>

                {/* Sleek Underline Tabs */}
                <div className="flex space-x-8 border-b border-border/60 mb-8 overflow-x-auto custom-scrollbar">
                    <button
                        onClick={() => setActiveSection('info')}
                        className={cn(
                            "pb-4 text-sm font-medium transition-all relative whitespace-nowrap",
                            activeSection === 'info' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Général
                        {activeSection === 'info' && (
                            <motion.div layoutId="activeTabProfile" className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveSection('security')}
                        className={cn(
                            "pb-4 text-sm font-medium transition-all relative whitespace-nowrap",
                            activeSection === 'security' ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Sécurité
                        {activeSection === 'security' && (
                            <motion.div layoutId="activeTabProfile" className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground" />
                        )}
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeSection === 'info' ? (
                        <motion.div
                            key="info"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                        >
                            {/* Avatar Section */}
                            <div className="border border-border/60 rounded-2xl overflow-hidden bg-card/30 dark:bg-zinc-900/20 backdrop-blur-sm">
                                <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                    <div>
                                        <h3 className="text-lg font-medium text-foreground mb-1">Photo de profil</h3>
                                        <p className="text-sm text-muted-foreground">Votre avatar généré est utilisé sur l'ensemble de l'interface.</p>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-full bg-linear-to-tr from-premium-gold to-premium-gold-light p-[2px] shadow-sm shrink-0">
                                            <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-premium-gold text-2xl font-light">
                                                {user?.name?.[0].toUpperCase() || 'U'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Identité Section */}
                            <div className="border border-border/60 rounded-2xl overflow-hidden bg-card/30 dark:bg-zinc-900/20 backdrop-blur-sm">
                                <div className="p-6 sm:p-8">
                                    <h3 className="text-lg font-medium text-foreground mb-1">Votre Identité</h3>
                                    <p className="text-sm text-muted-foreground mb-6">C'est le nom qui sera affiché sur votre tableau de bord et vos communications.</p>
                                    <InputEvent
                                        label="Nom complet"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        error={errors.name?.[0]}
                                        className="max-w-md w-full bg-background border-border/60 focus:border-foreground/30 text-foreground capitalize transition-all placeholder:text-foreground/20"
                                        placeholder="Ex: Jean Dupont"
                                    />
                                </div>
                                <div className="px-6 py-4 bg-muted/30 dark:bg-zinc-900/40 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <p className="text-[13px] text-muted-foreground">Veuillez utiliser 32 caractères maximum.</p>
                                    <button
                                        type="button"
                                        onClick={handleUpdateProfile}
                                        disabled={isLoading}
                                        className="bg-foreground text-background hover:bg-foreground/90 dark:bg-white dark:text-black dark:hover:bg-gray-200 px-5 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
                                    >
                                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                        Sauvegarder
                                    </button>
                                </div>
                            </div>

                            {/* Email Section */}
                            <div className="border border-border/60 rounded-2xl overflow-hidden bg-card/30 dark:bg-zinc-900/20 backdrop-blur-sm">
                                <div className="p-6 sm:p-8">
                                    <h3 className="text-lg font-medium text-foreground mb-1">Adresse Email</h3>
                                    <p className="text-sm text-muted-foreground mb-6">Cette adresse est rattachée à votre compte. Elle ne peut être modifiée.</p>
                                    <InputEvent
                                        label="Adresse email"
                                        type="email"
                                        disabled
                                        value={formData.email}
                                        className="max-w-md w-full bg-muted/40 text-muted-foreground border-transparent opacity-80 cursor-not-allowed"
                                    />
                                </div>
                                <div className="px-6 py-4 bg-muted/30 dark:bg-zinc-900/40 border-t border-border/60 flex items-center">
                                    <p className="text-[13px] text-muted-foreground flex items-center gap-2">
                                        <Shield size={14} className="text-premium-gold" />
                                        Votre email est vérifié et sécurisé.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="security"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                        >
                            {/* Password Section */}
                            <div className="border border-border/60 rounded-2xl overflow-hidden bg-card/30 dark:bg-zinc-900/20 backdrop-blur-sm">
                                <div className="p-4 sm:p-8">
                                    <h3 className="text-lg font-medium text-foreground mb-1">Mot de passe</h3>
                                    <p className="text-sm text-muted-foreground mb-8">Assurez-vous que votre compte utilise un mot de passe long et aléatoire.</p>

                                    <div className="space-y-2 max-w-md">
                                        <InputEvent
                                            label="Mot de passe actuel"
                                            type="password"
                                            value={formData.current_password}
                                            onChange={(e) => handleInputChange('current_password', e.target.value)}
                                            error={errors.current_password?.[0]}
                                            className="w-full bg-background border-border/60 text-foreground placeholder:text-foreground/20"
                                            placeholder="••••••••"
                                        />

                                        {/* <div className="w-full h-px bg-border/40 my-4" /> */}

                                        <InputEvent
                                            label="Nouveau mot de passe"
                                            type="password"
                                            value={formData.new_password}
                                            onChange={(e) => handleInputChange('new_password', e.target.value)}
                                            error={errors.new_password?.[0]}
                                            className="w-full bg-background border-border/60 text-foreground placeholder:text-foreground/20"
                                            placeholder="8 caractères minimum"
                                        />

                                        <InputEvent
                                            label="Confirmer le mot de passe"
                                            type="password"
                                            value={formData.confirm_password}
                                            onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                                            error={errors.confirm_password?.[0] || errors.new_password_confirmation?.[0]}
                                            className="w-full bg-background border-border/60 text-foreground placeholder:text-foreground/20"
                                            placeholder="Confirmation"
                                        />
                                    </div>
                                </div>
                                <div className="px-4 py-4 bg-muted/30 dark:bg-zinc-900/40 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <p className="text-[13px] text-muted-foreground">Une fois modifié, vous resterez connecté.</p>
                                    <button
                                        type="button"
                                        onClick={handleChangePassword}
                                        disabled={isLoading}
                                        className="bg-foreground text-background hover:bg-foreground/90 dark:bg-white dark:text-black dark:hover:bg-gray-200 px-5 py-2 rounded-lg text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto"
                                    >
                                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                                        Actualiser le mot de passe
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Logout Section */}
                <div className="border border-rose-500/20 rounded-2xl overflow-hidden bg-rose-50/30 dark:bg-rose-500/5 backdrop-blur-sm mt-12">
                    <div className="p-4 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div>
                            <h3 className="text-lg font-medium text-rose-600 dark:text-rose-500 mb-1">Se déconnecter</h3>
                            <p className="text-sm text-rose-600/70 dark:text-rose-400/80">Mettez fin à votre session sur cet appareil en toute sécurité.</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-rose-100 hover:bg-rose-200 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-500 border border-transparent dark:border-rose-500/20 px-6 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] whitespace-nowrap flex items-center justify-center gap-2 w-full sm:w-auto"
                        >
                            <LogOut size={16} />
                            Déconnexion
                        </button>
                    </div>
                </div>
            </div>

            <NotificationModal
                isOpen={isLogoutModalOpen}
                title="Déconnexion"
                message="Souhaitez-vous fermer votre session ? Vos changements non sauvegardés seront perdus."
                type="warning"
                onConfirm={confirmLogout}
                onClose={() => setIsLogoutModalOpen(false)}
                showCancel={true}
            />
        </div>
    );
};

export default ProfilePage;
