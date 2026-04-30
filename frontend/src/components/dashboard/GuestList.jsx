import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle, Edit2, Trash2, Copy, Check,
    Search, Plus, ChevronLeft, ChevronRight, Loader2,
    Users, MoreVertical, ExternalLink,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { cn } from '../ui/Base';

/**
 * StatusBadge Component
 */
const StatusBadge = ({ status, compact = false }) => {
    const configs = {
        confirmed: { label: 'Confirmé', bg: 'bg-emerald-50 dark:bg-emerald-500/10', dot: 'bg-emerald-500', text: 'text-zinc-800 dark:text-emerald-400' },
        declined: { label: 'Décliné', bg: 'bg-rose-50 dark:bg-rose-500/10', dot: 'bg-rose-500', text: 'text-zinc-800 dark:text-rose-400' },
        pending: { label: 'En attente', bg: 'bg-[#f5f1ea] dark:bg-primary/10', dot: 'bg-[#c09050]', text: 'text-zinc-800 dark:text-primary' }
    };
    const config = configs[status] || configs.pending;

    if (compact) {
        return (
            <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg", config.bg)}>
                <div className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                <span className={cn("text-[10px] font-bold uppercase tracking-tight", config.text)}>{config.label}</span>
            </div>
        );
    }

    return (
        <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full", config.bg)}>
            <div className={cn("w-2 h-2 rounded-full", config.dot)} />
            <span className={cn("text-[11px] font-semibold", config.text)}>{config.label}</span>
        </div>
    );
};

export const GuestList = ({
    guests,
    tables = [],
    onEdit,
    onDelete,
    onCopyLink,
    onShareWhatsApp,
    copiedId,
    searchQuery,
    setSearchQuery,
    onAddGuest,
    filterStatus,
    setFilterStatus,
    filterTable,
    setFilterTable,
    eventSlug
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuDirection, setMenuDirection] = useState('down');
    const itemsPerPage = 8;

    const getTableName = (guest) => {
        if (guest.table && guest.table.name) return guest.table.name;
        if (guest.table_id) {
            const table = tables.find(t => t.id === guest.table_id);
            return table ? table.name : '—';
        }
        return '—';
    };

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 300);
        return () => clearTimeout(timer);
    }, [searchQuery, filterStatus, filterTable, currentPage]);

    const paginatedGuests = guests.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(guests.length / itemsPerPage);

    // Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: {
            opacity: 0,
            scale: 0.8,
            y: 30
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.4,
                ease: "linear"
            }
        }
    };

    return (
        <div className="space-y-4 pb-10">
            {/* 1. FILTER BAR (Minimalist) */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-4">
                {/* Unified Search & Filters */}
                <div className="flex flex-col lg:flex-row bg-card lg:rounded-[1.2rem] rounded-[1.5rem] shadow-sm border border-border p-1 flex-1 w-full lg:w-auto">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            placeholder="Rechercher un invité..."
                            className="w-full pl-10 pr-4 h-11 bg-transparent text-[13px] font-medium text-foreground placeholder:text-muted-foreground outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Separator Desktop */}
                    <div className="hidden lg:block w-px h-5 bg-border my-auto mx-1" />
                    {/* Separator Mobile */}
                    <div className="lg:hidden h-px w-full bg-border my-1" />

                    <Select value={filterTable} onValueChange={setFilterTable}>
                        <SelectTrigger className="w-full lg:w-44 h-11 border-none shadow-none bg-transparent hover:bg-muted/50 rounded-xl text-[13px] font-medium text-muted-foreground focus:ring-0">
                            <SelectValue placeholder="Toutes les tables" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-border rounded-2xl shadow-xl p-1">
                            <SelectItem value="all" className="rounded-xl text-[13px] font-medium cursor-pointer">Toutes les tables</SelectItem>
                            {tables.map(table => (
                                <SelectItem key={table.id} value={table.id.toString()} className="rounded-xl text-[13px] font-medium cursor-pointer">{table.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Separator Desktop */}
                    <div className="hidden lg:block w-px h-5 bg-border my-auto mx-1" />
                    {/* Separator Mobile */}
                    <div className="lg:hidden h-px w-full bg-border my-1" />

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full lg:w-48 h-11 border-none shadow-none bg-transparent hover:bg-muted/50 rounded-xl text-[13px] font-medium text-muted-foreground focus:ring-0">
                            <SelectValue placeholder="Tous les statuts" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border border-border rounded-2xl shadow-xl p-1">
                            <SelectItem value="all" className="rounded-xl text-[13px] font-medium cursor-pointer">Tous les statuts</SelectItem>
                            <SelectItem value="pending" className="rounded-xl text-[13px] font-medium cursor-pointer">En attente</SelectItem>
                            <SelectItem value="confirmed" className="rounded-xl text-[13px] font-medium cursor-pointer">Confirmés</SelectItem>
                            <SelectItem value="declined" className="rounded-xl text-[13px] font-medium cursor-pointer">Déclinés</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Add Button */}
                <button
                    onClick={onAddGuest}
                    className="w-full lg:w-auto h-13 px-6 bg-foreground rounded-[1.2rem] flex items-center justify-center gap-2.5 text-background shadow-sm transition-colors hover:bg-foreground/90 active:scale-95 group shrink-0"
                >
                    <Plus size={16} className="text-muted-foreground group-hover:text-background transition-colors" />
                    <span className="text-[13px] font-medium tracking-wide">Nouveau</span>
                </button>
            </div>
            {/* 2. STATS INFO */}
            <div className="flex items-center gap-2 px-8 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                    TOTAL DES INVITÉS : <span className="text-primary font-black">{guests.length} {guests.length > 1 ? 'INVITÉS' : 'INVITÉ'}</span>
                </p>
            </div>

            {/* 4. GUEST LIST ROWS */}
            <div className="space-y-1">
                <AnimatePresence mode="wait">
                    <div className='rounded-4xl relative min-h-[500px]'>
                        {/* 3. HEADER CONTAINER (Desktop) */}
                        <div className="hidden lg:grid grid-cols-[1.2fr_160px_160px_190px] bg-card rounded-t-[1.8rem] rounded-b-lg mb-1 px-9 py-5 shadow-md border-b border-border/50">
                            <div className="text-[13px] font-bold text-foreground px-6">Informations Invité</div>
                            <div className="text-[13px] font-bold text-foreground">Statut Actuel</div>
                            <div className="text-[13px] font-bold text-foreground">Table</div>
                            <div className="text-[13px] font-bold text-foreground text-right pr-12">Options</div>
                        </div>

                        {isLoading ? (
                            <div key="loader" className="py-20 flex justify-center">
                                <Loader2 className="animate-spin text-primary" size={32} />
                            </div>
                        ) : paginatedGuests.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card rounded-[1.8rem] rounded-t-lg border border-border shadow-sm min-h-[400px]"
                            >
                                <div className="w-20 h-20 bg-primary rounded-[1.5rem] flex items-center justify-center mb-6 rotate-6">
                                    <Users className="text-foreground" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-foreground mb-2">
                                    {searchQuery || filterStatus !== 'all' || filterTable !== 'all'
                                        ? "Aucun invité trouvé"
                                        : "Votre liste d'invités est vide"}
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-sm mb-8 leading-relaxed">
                                    {searchQuery || filterStatus !== 'all' || filterTable !== 'all'
                                        ? "Essayez d'ajuster vos filtres ou votre recherche pour trouver ce que vous cherchez."
                                        : "Commencez à ajouter des invités pour construire votre liste et gérer les présences."}
                                </p>
                                {searchQuery || filterStatus !== 'all' || filterTable !== 'all' ? (
                                    <button
                                        onClick={() => { setSearchQuery(''); setFilterStatus('all'); setFilterTable('all'); }}
                                        className="text-[13px] font-bold text-primary hover:underline px-6 py-2.5 bg-primary/10 rounded-xl transition-colors"
                                    >
                                        Réinitialiser les filtres
                                    </button>
                                ) : (
                                    <button
                                        onClick={onAddGuest}
                                        className="h-11 px-6 bg-foreground text-background rounded-[1.2rem] flex items-center justify-center gap-2.5 shadow-md transition-transform hover:scale-105 active:scale-95 group"
                                    >
                                        <Plus size={16} className="text-muted-foreground group-hover:text-background transition-colors" />
                                        <span className="text-[13px] font-medium tracking-wide">Ajouter le premier invité</span>
                                    </button>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key={`${currentPage}-${searchQuery}-${filterStatus}-${filterTable}`} // KEY CRUCIALE : Force le re-stagger
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className='space-y-1'
                                style={{ perspective: 1000 }}
                            >
                                {paginatedGuests.map((guest, index) => (
                                    <motion.div
                                        key={guest.id}
                                        variants={itemVariants}
                                        className={cn(
                                            'bg-card group hover:bg-primary/5 border border-transparent hover:border-primary/50 relative shadow-sm lg:px-9 lg:py-2 px-5 py-4 cursor-default rounded-lg transition-all duration-300',
                                            index === paginatedGuests.length - 1 ? 'lg:rounded-b-[1.8rem] rounded-b-3xl' : '',
                                            index === 0 && paginatedGuests.length > 0 ? 'rounded-t-3xl lg:rounded-t-lg' : ''
                                        )}
                                    >
                                        {/* DESKTOP */}
                                        <div className='hidden lg:grid grid-cols-[1.2fr_160px_160px_190px] items-center'>
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 bg-white dark:bg-white border border-border rounded-2xl p-2.5 flex items-center justify-center shadow-inner shrink-0">
                                                    <QRCodeCanvas
                                                        value={`${window.location.origin}/invite/${eventSlug || guest.event?.slug || 'event'}?token=${guest.token}`}
                                                        size={44}
                                                        level="L"
                                                        fgColor="#000000"
                                                        bgColor="#ffffff"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-extrabold text-foreground leading-tight">{guest.name}</span>
                                                    <span className="text-[13px] font-semibold text-primary">{guest.guest_type || 'Invité'}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <StatusBadge status={guest.status} />
                                            </div>
                                            <div>
                                                <span className="text-[13px] font-bold text-foreground/90">{getTableName(guest)}</span>
                                            </div>
                                            <div className="flex shrink-0 items-center justify-end gap-2.5">
                                                <button onClick={() => onCopyLink(guest)} className={cn("p-3 rounded-2xl shadow-sm border border-border/50 transition-colors", copiedId === guest.id ? "bg-emerald-500 text-white border-emerald-500" : "bg-card text-primary hover:bg-muted")}>
                                                    {copiedId === guest.id ? <Check size={18} /> : <Copy size={18} />}
                                                </button>
                                                <button onClick={() => onShareWhatsApp(guest)} className="p-3 rounded-2xl shadow-sm border border-border/50 bg-card text-emerald-600 hover:bg-muted transition-colors">
                                                    <MessageCircle size={18} />
                                                </button>
                                                <button onClick={() => onEdit(guest)} className="p-3 rounded-2xl shadow-sm border border-border/50 bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => onDelete(guest.id)} className="p-3 rounded-2xl shadow-sm border border-border/50 bg-card text-rose-500 hover:text-rose-600 hover:bg-muted transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* MOBILE */}
                                        <div className='lg:hidden flex flex-col gap-3 py-1'>
                                            <div className='flex items-center justify-between gap-3'>
                                                <div className="flex items-center gap-3 overflow-hidden">

                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[14px] font-extrabold text-foreground leading-tight truncate">
                                                            {guest.name}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[11px] font-medium text-primary/80 uppercase tracking-wider">{guest.guest_type || 'Invité'}</span>
                                                            <span className="text-[10px] text-muted-foreground/60">•</span>
                                                            <span className="text-[11px] font-medium text-muted-foreground truncate">{getTableName(guest)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                    <StatusBadge status={guest.status} compact />
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (openMenuId === guest.id) {
                                                                    setOpenMenuId(null);
                                                                } else {
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    const spaceBelow = window.innerHeight - rect.bottom;
                                                                    const dropdownHeight = 240; // Approx height
                                                                    setMenuDirection(spaceBelow < dropdownHeight ? 'up' : 'down');
                                                                    setOpenMenuId(guest.id);
                                                                }
                                                            }}
                                                            className={cn(
                                                                "p-2 rounded-lg transition-colors",
                                                                openMenuId === guest.id ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
                                                            )}
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>

                                                        {/* CUSTOM DROPDOWN */}
                                                        <AnimatePresence>
                                                            {openMenuId === guest.id && (
                                                                <>
                                                                    <div
                                                                        className="fixed inset-0 z-10"
                                                                        onClick={() => setOpenMenuId(null)}
                                                                    />
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.95, y: menuDirection === 'up' ? 10 : -10 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.95, y: menuDirection === 'up' ? 10 : -10 }}
                                                                        style={{ transformOrigin: menuDirection === 'up' ? 'bottom right' : 'top right' }}
                                                                        className={cn(
                                                                            "absolute right-0 w-48 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden py-1",
                                                                            menuDirection === 'up' ? "bottom-12" : "top-12"
                                                                        )}
                                                                    >
                                                                        {(() => {
                                                                            const isNotAssigned = !guest.table_id && (!guest.table || !guest.table.name);
                                                                            return (
                                                                                <>
                                                                                    <button
                                                                                        onClick={() => { onCopyLink(guest); setOpenMenuId(null); }}
                                                                                        className={cn(
                                                                                            "w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium transition-colors",
                                                                                            isNotAssigned ? "text-muted-foreground/40" : "text-foreground hover:bg-muted"
                                                                                        )}
                                                                                    >
                                                                                        {copiedId === guest.id ? (
                                                                                            <Check size={16} className="text-emerald-500" />
                                                                                        ) : (
                                                                                            <Copy size={16} className={cn(isNotAssigned ? "opacity-40" : "text-muted-foreground")} />
                                                                                        )}
                                                                                        {copiedId === guest.id ? 'Copié !' : 'Copier le lien'}
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            if (isNotAssigned) {
                                                                                                toast.error("Action requise", { description: "Veuillez d'abord assigner une table à cet invité." });
                                                                                                return;
                                                                                            }
                                                                                            if (!guest.token) {
                                                                                                toast.error("Lien indisponible", { description: "Le jeton d'accès de cet invité est manquant." });
                                                                                                return;
                                                                                            }
                                                                                            const url = `/invite/${eventSlug || guest.event?.slug}?token=${guest.token}`;
                                                                                            window.open(url, '_blank');
                                                                                            setOpenMenuId(null);
                                                                                        }}
                                                                                        className={cn(
                                                                                            "w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium transition-colors",
                                                                                            isNotAssigned ? "text-muted-foreground/40" : "text-foreground hover:bg-muted"
                                                                                        )}
                                                                                    >
                                                                                        <ExternalLink size={16} className={cn(isNotAssigned ? "opacity-40" : "text-muted-foreground")} />
                                                                                        Voir l'invitation
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => { onShareWhatsApp(guest); setOpenMenuId(null); }}
                                                                                        className={cn(
                                                                                            "w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium transition-colors",
                                                                                            isNotAssigned ? "text-muted-foreground/40" : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                                                                        )}
                                                                                    >
                                                                                        <MessageCircle size={16} className={cn(isNotAssigned ? "opacity-40" : "")} />
                                                                                        WhatsApp
                                                                                    </button>
                                                                                </>
                                                                            );
                                                                        })()}
                                                                        <div className="h-px bg-border/50 mx-2" />
                                                                        <button
                                                                            onClick={() => { onEdit(guest); setOpenMenuId(null); }}
                                                                            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-foreground hover:bg-muted transition-colors"
                                                                        >
                                                                            <Edit2 size={16} className="text-muted-foreground" />
                                                                            Modifier
                                                                        </button>
                                                                        <button
                                                                            onClick={() => { onDelete(guest.id); setOpenMenuId(null); }}
                                                                            className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                            Supprimer
                                                                        </button>
                                                                    </motion.div>
                                                                </>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </AnimatePresence>
            </div>

            {/* 5. PAGINATION */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-10 pb-10">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:hover:bg-card"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={cn(
                                    "w-9 h-9 rounded-xl font-bold text-xs transition-all",
                                    currentPage === page ? "bg-foreground text-background shadow-md" : "bg-card text-muted-foreground border border-border hover:bg-muted hover:text-foreground"
                                )}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-card border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:hover:bg-card"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );
};
