import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Users, Table as TableIcon, Eye, Plus,
    Settings, ChevronRight, LogOut, User, Menu, X,
    Leaf, Music, Bell, Search, Calendar, MessageSquare, Sun, Moon
} from 'lucide-react';
import { cn } from '../ui/Base';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { authService } from '../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationModal } from '../ui/NotificationModal';

// ─── Constants ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
    { id: 'overview', label: "Tableau de Bord", icon: LayoutDashboard },
    { id: 'guests', label: "Liste des Invités", icon: Users },
    { id: 'interactions', label: "Interactions", icon: MessageSquare },
    { id: 'music', label: "Musique", icon: Music },
    { id: 'tables', label: "Plan de Salle", icon: TableIcon },
];

// ─── Shared Components ────────────────────────────────────────────────────────
const UserAvatar = ({ name, size = 'md', className }) => {
    const initials = name
        ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : '??';

    const sizes = {
        sm: 'w-8 h-8 text-[10px]',
        md: 'w-10 h-10 text-[11px]',
        lg: 'w-12 h-12 text-[12px]',
    };

    return (
        <div className={cn(
            "rounded-full bg-secondary border border-border text-foreground font-bold flex items-center justify-center shrink-0",
            sizes[size],
            className
        )}>
            {initials}
        </div>
    );
};

// ─── Desktop Sidebar ──────────────────────────────────────────────────────────
export const Sidebar = ({ activeTab, onTabChange, eventTitle, onPreview, hasNewInteractions }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await authService.logout();
        } catch (_) { }
        logout();
        navigate('/');
    };

    return (
        <>
            <aside className="fixed left-0 top-0 bottom-0 w-72 hidden lg:flex flex-col z-40 p-2 bg-background">
                <div className="flex-1 bg-card border border-border rounded-[1.8rem] flex flex-col shadow-sm relative overflow-hidden transition-colors duration-300">

                    {/* Brand */}
                    <div className="px-8 pt-8 pb-10 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Leaf size={20} className="text-primary-foreground" strokeWidth={2} />
                        </div>
                        <h1 className="text-lg font-bold text-foreground tracking-tight">
                            Event<span className="text-primary">Flow</span>
                        </h1>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 space-y-1">
                        <p className="px-4 mb-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Navigation</p>

                        <button
                            onClick={() => navigate('/create/wedding')}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-muted-foreground hover:text-foreground hover:bg-muted group"
                        >
                            <Calendar size={18} className="text-muted-foreground group-hover:text-foreground" />
                            <span className="font-medium text-sm">Mon Événement</span>
                        </button>

                        <div className="h-px bg-border my-6 mx-4" />

                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onTabChange(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group",
                                    activeTab === item.id
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <item.icon size={18} strokeWidth={activeTab === item.id ? 2.5 : 2} className={cn(
                                    activeTab === item.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                                <span className="font-medium text-sm">{item.label}</span>
                                {item.id === 'interactions' && hasNewInteractions && (
                                    <div className="absolute right-4 w-1.5 h-1.5 bg-rose-500 rounded-full" />
                                )}
                            </button>
                        ))}
                    </nav>

                    {/* Quick Preview */}
                    <div className="p-4 mt-auto">
                        <button
                            onClick={onPreview}
                            className="w-full flex items-center justify-between px-5 py-4 bg-muted/50 border border-border rounded-2xl group hover:border-primary/30 transition-all"
                        >
                            <div className="text-left">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Invitation</p>
                                <p className="text-xs font-bold text-foreground truncate max-w-[120px]">{eventTitle}</p>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                                <Eye size={16} />
                            </div>
                        </button>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border bg-muted/20">
                        <div className="flex items-center gap-3 p-2 rounded-2xl">
                            <button
                                onClick={() => navigate('/profile')}
                                className="flex-1 flex items-center gap-3 text-left min-w-0"
                            >
                                <UserAvatar name={user?.name} size="md" />
                                <div className="truncate">
                                    <p className="text-xs font-bold text-foreground truncate">{user?.name}</p>
                                    <p className="text-[10px] text-muted-foreground font-medium truncate uppercase tracking-wider">Admin</p>
                                </div>
                            </button>
                            <button
                                onClick={() => setIsLogoutConfirmOpen(true)}
                                className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>

                        {/* Theme Toggle Button */}
                        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2">Apparence</span>
                            <button
                                onClick={toggleTheme}
                                className="w-10 h-10 rounded-xl bg-muted text-muted-foreground hover:text-primary transition-all flex items-center justify-center border border-border"
                            >
                                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            <NotificationModal
                isOpen={isLogoutConfirmOpen}
                title="Déconnexion"
                message="Souhaitez-vous vraiment quitter votre espace ?"
                type="warning"
                onConfirm={handleLogout}
                onClose={() => setIsLogoutConfirmOpen(false)}
                showCancel={true}
            />
        </>
    );
};

// ─── Mobile Navigation (Premium Floating Bar) ─────────────────────────────
export const MobileNav = ({ activeTab, onTabChange, onAddGuest, hasNewInteractions }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // We add Profile for symmetry (3 items on each side of the central button)
    const itemsWithProfile = [
        ...NAV_ITEMS,
        { id: 'profile', label: "Profil", icon: User }
    ];

    return (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-sm z-50 lg:hidden">
            <div className="relative h-16 bg-zinc-900/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-[2rem] border border-white/10 flex items-center px-2">

                {/* Left Side (3 items) */}
                <div className="flex-1 flex justify-around items-center h-full">
                    {itemsWithProfile.slice(0, 3).map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                                "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all relative group",
                                activeTab === item.id ? "text-primary bg-primary/10 shadow-[inset_0_0_10px_rgba(var(--primary-rgb),0.1)]" : "text-zinc-500 active:scale-90"
                            )}
                        >
                            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            {item.id === 'interactions' && hasNewInteractions && (
                                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full ring-2 ring-zinc-900 animate-pulse" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Central Gap for FAB */}
                <div className="w-8 shrink-0" />

                {/* Right Side (3 items) */}
                <div className="flex-1 flex justify-around items-center h-full">
                    {itemsWithProfile.slice(3, 6).map((item) => (
                        <button
                            key={item.id}
                            onClick={() => item.id === 'profile' ? navigate('/profile') : onTabChange(item.id)}
                            className={cn(
                                "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all relative group",
                                activeTab === item.id ? "text-primary bg-primary/10 shadow-[inset_0_0_10px_rgba(var(--primary-rgb),0.1)]" : "text-zinc-500 active:scale-90"
                            )}
                        >
                            {item.id === 'profile' ? (
                                <UserAvatar name={user?.name} size="sm" className={cn("transition-transform group-hover:scale-110", activeTab === 'profile' && "ring-2 ring-primary")} />
                            ) : (
                                <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            )}
                        </button>
                    ))}
                </div>

                {/* Floating Action Button (FAB) - Absolutely Centered */}
                <div className="absolute left-1/2 -translate-x-1/2 -top-5">
                    <button
                        onClick={onAddGuest}
                        className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center active:scale-90 transition-all group"
                    >
                        <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>
            </div>
        </nav>
    );
};

// ─── Mobile Header ───────────────────────────────────────────────────────────
export const MobileHeader = ({ eventTitle, onTabChange, hasNewInteractions }) => {
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    return (
        <header className="lg:hidden sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between transition-colors duration-300">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                    <Leaf size={20} className="text-primary-foreground" />
                </div>
                <div>
                    <h1 className="text-base font-bold text-foreground tracking-tight leading-none">EventFlow</h1>
                    <button onClick={() => navigate('/create/wedding')} className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[120px]">{eventTitle}</button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={toggleTheme}
                    className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400"
                >
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                </button>
                <button
                    onClick={() => onTabChange('interactions')}
                    className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 relative"
                >
                    <Bell size={18} className={hasNewInteractions ? "text-rose-500" : ""} />
                    {hasNewInteractions && (
                        <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-rose-500 rounded-full" />
                    )}
                </button>
            </div>
        </header>
    );
};
