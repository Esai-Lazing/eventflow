import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, CheckCircle2, XCircle, Clock, Share2, Plus, X,
    MessageCircle, ArrowUpRight, Search, LayoutDashboard, Settings,
    Music, MessageSquare, Heart, ExternalLink, Copy, Bell,
    UserX, AlertTriangle, Info, Trash2, Pause, Play,
    LayoutTemplate
} from 'lucide-react';
import { Button, Input, cn } from '../components/ui/Base';
import { eventService, guestService, tableService, dashboardService } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { notify } from '../lib/notify';

// Pre-factored components
import { Sidebar, MobileNav, MobileHeader } from '../components/dashboard/Navigation';
import { StatGrid } from '../components/dashboard/StatCards';
import { RecentResponses } from '../components/dashboard/RecentResponses';
import { EventStatusCard } from '../components/dashboard/EventStatusCard';
import { GuestList } from '../components/dashboard/GuestList';
import { SeatingManager } from '../components/dashboard/SeatingManager';
import { NotificationModal } from '../components/ui/NotificationModal';
import { WhatsAppBroadcasterModal } from '../components/ui/WhatsAppBroadcasterModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import InteractionsTab from '../components/dashboard/InteractionsTab';
import MusicTab from '../components/dashboard/MusicTab';

const GlobalAudioPlayer = ({ playingSong, stopPlay, togglePlay }) => {
    if (!playingSong) return null;

    return (
        <div className="fixed bottom-24 right-4 lg:bottom-10 lg:right-10 z-[100]">
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className="flex items-center gap-4 bg-zinc-950 border border-zinc-800 p-3 pr-4 rounded-[2rem] shadow-2xl shadow-black/50 backdrop-blur-xl group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-primary/20 blur-[30px] rounded-full pointer-events-none" />
                <div className="relative z-10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1.2rem] bg-white/10 flex items-center justify-center border border-white/10 relative overflow-hidden shrink-0">
                        {/* Audio Wave Visualizer */}
                        <div className="absolute inset-0 flex items-end justify-center gap-[3px] pb-3">
                            {[0.8, 1.2, 0.9, 1.3].map((duration, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ height: ["20%", "80%", "20%"] }}
                                    transition={{ duration: duration, repeat: Infinity, ease: "easeInOut" }}
                                    className="w-[3px] bg-primary rounded-sm"
                                    style={{ originY: 1 }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col pr-2 min-w-[120px] max-w-[200px]">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-0.5">En lecture</p>
                        <h4 className="text-[13px] font-bold text-white truncate">{playingSong.title}</h4>
                    </div>
                    <div className="flex items-center gap-2 pl-3 border-l border-white/10">
                        <button
                            onClick={() => togglePlay(playingSong)}
                            className="w-10 h-10 rounded-[1rem] bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all border border-white/5"
                        >
                            <Pause size={18} fill="currentColor" />
                        </button>
                        <button
                            onClick={stopPlay}
                            className="w-10 h-10 rounded-[1rem] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const capitalizeName = (name) => {
    if (!name) return '';
    return name
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, logout, loading: authLoading } = useAuth();

    // Strict security check: Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            navigate('/', { state: { from: location.pathname } });
        }
    }, [isAuthenticated, authLoading, navigate, location.pathname]);

    const [activeTab, setActiveTab] = useState('overview');
    const [guests, setGuests] = useState([]);
    const [realTables, setRealTables] = useState([]);
    const [events, setEvents] = useState([]);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterTable, setFilterTable] = useState('all');
    const [copiedId, setCopiedId] = useState(null);

    // Global Audio State
    const [playingSong, setPlayingSong] = useState(null);
    const audioRef = useRef(null);

    const togglePlay = (song) => {
        if (playingSong?.id === song.id) {
            audioRef.current?.pause();
            setPlayingSong(null);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            audioRef.current = new Audio(song.url);
            audioRef.current.crossOrigin = "anonymous";
            audioRef.current.play();
            audioRef.current.onended = () => setPlayingSong(null);
            setPlayingSong(song);
        }
    };

    const stopPlay = () => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        setPlayingSong(null);
    };

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, []);

    // Modals state
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [editingGuest, setEditingGuest] = useState(null);
    const [guestForm, setGuestForm] = useState({ name: '', guest_type: '', guest_count: 1, table_number: '', table_id: '', seat_number: '' });

    const [isTableModalOpen, setIsTableModalOpen] = useState(false);
    const [tableForm, setTableForm] = useState({ name: '', capacity: 8 });

    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [settingsForm, setSettingsForm] = useState({ guest_limit: 50 });

    const [interactionCount, setInteractionCount] = useState(0);
    const [staffToken, setStaffToken] = useState('');
    const interactionCountRef = useRef(0);
    const [hasNewInteractions, setHasNewInteractions] = useState(false);

    const [selectedTableId, setSelectedTableId] = useState(null);
    const [notification, setNotification] = useState({
        isOpen: false, title: '', message: '', type: 'info', onConfirm: null, showCancel: false
    });

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
        // Only trigger initial fetch once when authenticated
        if (isAuthenticated && loading) {
            fetchData();
        }
    }, [location.state, isAuthenticated, loading]);

    const showNotify = (title, message, type = 'info', onConfirm = null, showCancel = false) => {
        setNotification({ isOpen: true, title, message, type, onConfirm, showCancel });
    };

    const isFetchingRef = useRef(false);

    const fetchData = async (isPoll = false) => {
        if (isFetchingRef.current) return;

        // Prevent polling if we don't have an event selected yet
        if (isPoll && !selectedEvent?.slug) return;

        isFetchingRef.current = true;

        if (!isPoll) setLoading(true);
        try {
            // Get all data in one single request
            const response = await dashboardService.getData(selectedEvent?.slug);
            const { events: newEvents, selectedEvent: newSelectedEvent, guests: newGuests, tables: newTables } = response.data;

            setEvents(newEvents);
            setSelectedEvent(newSelectedEvent);
            setRealTables(newTables);

            // Interaction detection logic
            const currentInteractions = newGuests.reduce((acc, g) => {
                return acc + (g.music_suggestions ? 1 : 0) + (g.guestbook_message ? 1 : 0);
            }, 0);

            if (isPoll && interactionCountRef.current > 0 && currentInteractions > interactionCountRef.current) {
                setHasNewInteractions(true);

                if (activeTab !== 'interactions') {
                    notify.info("Nouvelle interaction !", "Un invité vient de participer au livre d'or ou à la playlist.", MessageSquare);
                }
            }

            setGuests(newGuests);
            setInteractionCount(currentInteractions);
            // Update ref ONLY after checking (or on initial load)
            interactionCountRef.current = currentInteractions;
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            if (err.response?.status === 401) {
                logout();
            }
        } finally {
            isFetchingRef.current = false;
            if (!isPoll) setLoading(false);
            if (selectedEvent?.staff_token) {
                setStaffToken(selectedEvent.staff_token);
            }
        }
    };

    // Polling for new interactions every 15 seconds
    useEffect(() => {
        // Only poll if window is focused and we have a slug
        const interval = setInterval(() => {
            if (selectedEvent?.slug && !document.hidden) {
                fetchData(true);
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [activeTab, selectedEvent?.slug]);

    // Handle interaction badge reset
    useEffect(() => {
        if (activeTab === 'interactions') {
            setHasNewInteractions(false);
        }
    }, [activeTab]);

    // Reset selected table when switching events to prevent "Table not found" errors
    useEffect(() => {
        setSelectedTableId(null);
    }, [selectedEvent?.id]);

    const handleAddGuest = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        const formBeforeSubmit = { ...guestForm, name: capitalizeName(guestForm.name) };
        const isEditing = !!editingGuest;
        const tempId = `temp-${Date.now()}`;

        // Optimistic Update
        if (!isEditing) {
            const optimisticGuest = {
                ...formBeforeSubmit,
                id: tempId,
                status: 'pending',
                isOptimistic: true,
                created_at: new Date().toISOString()
            };
            setGuests(prev => [optimisticGuest, ...prev]);
            setIsGuestModalOpen(false);
            setGuestForm({ name: '', guest_type: '', table_number: '', table_id: '', seat_number: '' });
        } else {
            setIsSubmitting(true);
        }

        try {
            const payload = { ...formBeforeSubmit };
            delete payload._couple;
            if (!payload.table_id) payload.table_id = null;
            if (!payload.seat_number) payload.seat_number = null;
            if (!payload.guest_type) payload.guest_type = null;

            if (isEditing) {
                const res = await guestService.update(editingGuest.id, payload);
                setGuests(prev => prev.map(g => g.id === editingGuest.id ? res.data : g));
                notify.success("Succès", "Modifié avec succès");
                setIsGuestModalOpen(false);
                setEditingGuest(null);
                setGuestForm({ name: '', guest_type: '', guest_count: 1, table_number: '', table_id: '', seat_number: '', _couple: { first: '', second: '', last: '' } });
            } else {
                const res = await guestService.add(selectedEvent.slug, payload);
                // Replace optimistic guest with real data
                setGuests(prev => prev.map(g => g.id === tempId ? res.data : g));
                notify.success("Succès", `${payload.name} ajouté !`);
            }
        } catch (err) {
            console.error('Error saving guest:', err);

            // Revert optimistic update if adding
            if (!isEditing) {
                setGuests(prev => prev.filter(g => g.id !== tempId));
                setGuestForm(formBeforeSubmit); // Restore form data
                setIsGuestModalOpen(true); // Reopen modal so user doesn't lose work
            }

            const errorData = err.response?.data;
            if (err.response?.status === 422) {
                if (errorData?.errors) {
                    const firstErrorField = Object.keys(errorData.errors)[0];
                    const firstErrorMessage = errorData.errors[firstErrorField][0];
                    notify.error("Fiche invalide", firstErrorMessage);
                } else {
                    notify.error("Action impossible", errorData?.message || "Données invalides.");
                }
            } else {
                notify.error("Erreur", errorData?.message || "Une erreur est survenue.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGuest = async (id) => {
        showNotify(
            "Confirmation",
            "Voulez-vous vraiment supprimer cet invité ?",
            "error",
            async () => {
                try {
                    await guestService.delete(id);
                    setGuests(guests.filter(g => g.id !== id));
                    notify.success("Succès", "Invité supprimé avec succès.");
                } catch (err) {
                    console.error('Error deleting guest:', err);
                }
            },
            true
        );
    };

    const handleUpdateTable = async (id, data) => {
        try {
            const res = await tableService.update(id, data);
            setRealTables(realTables.map(t => t.id === id ? res.data : t));
        } catch (err) {
            console.error('Error updating table:', err);
            const errorData = err.response?.data;
            if (err.response?.status === 422 && errorData?.errors) {
                const firstErrorField = Object.keys(errorData.errors)[0];
                const firstErrorMessage = errorData.errors[firstErrorField][0];
                notify.error("Modification impossible", firstErrorMessage);
            } else {
                notify.error("Mise à jour impossible", errorData?.message || "Erreur réseau");
            }
        }
    };

    const handleCreateTable = (defaultData) => {
        let i = 1;
        let newName = `Table ${i}`;
        while (realTables.some(t => t.name === newName)) {
            i++;
            newName = `Table ${i}`;
        }

        setTableForm({
            name: defaultData?.name || newName,
            capacity: defaultData?.capacity || 10
        });
        setIsTableModalOpen(true);
    };

    const handleSubmitTable = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await tableService.add(selectedEvent.slug, tableForm);
            setRealTables([...realTables, res.data]);
            setIsTableModalOpen(false);
            notify.success("Table créée", `${res.data.name} est prête.`);
        } catch (err) {
            console.error('Error creating table:', err);
            const errorData = err.response?.data;
            if (err.response?.status === 422) {
                const firstErrorMessage = errorData.errors ? Object.values(errorData.errors)[0][0] : errorData.message;
                notify.error("Création impossible", firstErrorMessage);
            } else {
                notify.error("Création impossible", errorData?.message || "Erreur réseau");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteTable = async (id, name) => {
        showNotify(
            "Suppression",
            `Voulez-vous vraiment supprimer la table "${name}" ainsi que tous les placements associés ?`,
            "error",
            async () => {
                try {
                    await tableService.delete(id);
                    setRealTables(realTables.filter(t => t.id !== id));
                    setGuests(guests.map(g => g.table_id === id ? { ...g, table_id: null } : g));
                    notify.success("Table supprimée", `${name} a été retirée de la salle.`);
                } catch (err) {
                    console.error('Error deleting table:', err);
                    notify.error("Erreur", "Impossible de supprimer la table.");
                }
            },
            true
        );
    };

    const handleAssignGuestToTable = async (guestId, tableId) => {
        // Optimistic UI update for immediate response during drag and drop
        const previousGuests = [...guests];

        const guestName = previousGuests.find(g => String(g.id) === String(guestId))?.name || "L'invité";
        const tableName = tableId ? realTables.find(t => String(t.id) === String(tableId))?.name || 'la table' : null;

        setGuests(guests.map(g => String(g.id) === String(guestId) ? { ...g, table_id: tableId } : g));

        try {
            await guestService.update(guestId, { table_id: tableId });
            notify.success(tableId ? "Placement réussi" : "Invité retiré", tableId ? `${guestName} a été assigné à ${tableName}.` : `${guestName} est de retour dans la liste libre.`);
        } catch (err) {
            console.error('Error assigning guest:', err);
            const status = err.response?.status;
            const errorData = err.response?.data;
            const message = errorData?.message;
            const errors = errorData?.errors;

            console.error('Error assigning guest:', { status, message, errors, guestId, tableId });
            setGuests(previousGuests); // revert on failure

            if (status === 422) {
                const lowerMsg = (message || '').toLowerCase();
                const allErrorsText = errors ? JSON.stringify(errors).toLowerCase() : '';

                const isSeatError = lowerMsg.includes('siège') || lowerMsg.includes('occupé') || allErrorsText.includes('seat');
                const isInvalidTable = lowerMsg.includes('selected table id is invalid') || allErrorsText.includes('selected table id is invalid');

                notify.error(
                    isInvalidTable ? "Table introuvable" : isSeatError ? "Place déjà prise" : "Capacité atteinte",
                    isInvalidTable
                        ? "La table sélectionnée semble invalide ou a été supprimée."
                        : (errors ? Object.values(errors)[0][0] : (message || `Impossible d'ajouter ${guestName} ici.`))
                );
            } else if (status === 403) {
                const isSent = message?.toLowerCase().includes('envoyée');
                const isResponse = message?.toLowerCase().includes('répondu');
                notify.info(
                    isResponse ? "Réponse déjà enregistrée" : isSent ? "Invitation déjà envoyée" : "Action bloquée",
                    message || `${guestName} est déjà verrouillé.`
                );
            } else {
                notify.error("Erreur système", "Un problème est survenu.");
            }
        }
    };

    const handleMarkAsSent = async (guestId) => {
        try {
            const guest = guests.find(g => g.id === guestId);
            if (!guest) return;

            // Only update if not already marked to avoid redundant API calls
            if (guest.invitation_sent) return;

            const res = await guestService.update(guestId, { invitation_sent: true });
            setGuests(guests.map(g => g.id === guestId ? { ...g, invitation_sent: true } : g));
        } catch (err) {
            console.error('Error marking as sent:', err);
            // If backend doesn't support the field yet, still update local state for UX
            setGuests(guests.map(g => g.id === guestId ? { ...g, invitation_sent: true } : g));
        }
    };

    const handleAddElement = async (type) => {
        const newElement = {
            id: `el-${Date.now()}`,
            type,
            x: 50,
            y: 50
        };
        const updatedElements = [...(selectedEvent.customization?.room_elements || []), newElement];
        const updatedCustomization = { ...selectedEvent.customization, room_elements: updatedElements };

        try {
            const res = await eventService.update(selectedEvent.slug, { customization: updatedCustomization });
            setSelectedEvent(res.data);
        } catch (err) {
            console.error('Error adding element:', err);
        }
    };

    const handleUpdateElement = async (id, data) => {
        const updatedElements = selectedEvent.customization?.room_elements?.map(el =>
            el.id === id ? { ...el, ...data } : el
        );
        const updatedCustomization = { ...selectedEvent.customization, room_elements: updatedElements };

        try {
            const res = await eventService.update(selectedEvent.slug, { customization: updatedCustomization });
            setSelectedEvent(res.data);
        } catch (err) {
            console.error('Error updating element:', err);
        }
    };

    const handleDeleteElement = async (id) => {
        const updatedElements = selectedEvent.customization?.room_elements?.filter(el => el.id !== id);
        const updatedCustomization = { ...selectedEvent.customization, room_elements: updatedElements };

        try {
            const res = await eventService.update(selectedEvent.slug, { customization: updatedCustomization });
            setSelectedEvent(res.data);
        } catch (err) {
            console.error('Error deleting element:', err);
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        try {
            const res = await eventService.update(selectedEvent.slug, settingsForm);
            setSelectedEvent(res.data);
            setIsSettingsModalOpen(false);
        } catch (err) {
            console.error('Error updating settings:', err);
        }
    };

    const handleRefreshStaffToken = async () => {
        try {
            const res = await eventService.refreshStaffToken(selectedEvent.slug);
            setStaffToken(res.data.staff_token);
            setSelectedEvent({ ...selectedEvent, staff_token: res.data.staff_token });
            notify.success("Succès", "Nouveau code staff généré.");
        } catch (error) {
            notify.error("Erreur", "Impossible de générer le code.");
        }
    };

    const stats = useMemo(() => {
        const total = guests.reduce((acc, g) => acc + (parseInt(g.guest_count) || 1), 0);
        const confirmed = guests.filter(g => g.status === 'confirmed').reduce((acc, g) => acc + (parseInt(g.guest_count) || 1), 0);
        const declined = guests.filter(g => g.status === 'declined').reduce((acc, g) => acc + (parseInt(g.guest_count) || 1), 0);
        const pending = guests.filter(g => g.status === 'pending').reduce((acc, g) => acc + (parseInt(g.guest_count) || 1), 0);

        // Count unique invitations (rows) for other metrics if needed
        const invitationCount = guests.length;
        const sent = guests.filter(g => g.invitation_sent).length;

        const rate = total > 0 ? Math.round((confirmed / total) * 100) : 0;
        const limit = selectedEvent?.guest_limit || 50;
        const capacity_rate = Math.round((total / limit) * 100);

        return {
            total, confirmed, declined, pending, sent, rate, limit, capacity_rate,
            invitationCount,
            confirmedIcon: CheckCircle2,
            declinedIcon: XCircle,
            pendingIcon: Clock,
            totalIcon: Users
        };
    }, [guests, selectedEvent]);

    const filteredGuests = useMemo(() => {
        return guests.filter(g => {
            const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (g.guest_type && g.guest_type.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesStatus = filterStatus === 'all' || g.status === filterStatus;

            let matchesTable = true;
            if (filterTable !== 'all') {
                if (filterTable === 'none') {
                    matchesTable = !g.table_id;
                } else {
                    matchesTable = g.table_id?.toString() === filterTable;
                }
            }
            return matchesSearch && matchesStatus && matchesTable;
        });
    }, [guests, searchQuery, filterStatus, filterTable]);

    const copyInviteLink = async (guest) => {
        if (!guest.table_id && (!guest.table || !guest.table.name)) {
            notify.error("Action requise", "Cet invité n'est pas encore assigné à une table. Veuillez le placer avant de copier son invitation.");
            return;
        }
        const link = `${window.location.origin}/invite/${selectedEvent.slug}?token=${guest.token}`;

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(link);
                setCopiedId(guest.id);
                setTimeout(() => setCopiedId(null), 2000);

                // Track as sent when link is copied to ensure consistency
                if (!guest.invitation_sent) {
                    handleMarkAsSent(guest.id);
                }

                notify.success("Lien Copié", <span>L'invitation pour <span className="text-foreground font-bold">{guest.name}</span> est prête.</span>);

            } else {
                throw new Error('Clipboard API unavailable');
            }
        } catch (err) {
            // Fallback content... (rest remains similar but I'll update it too)
            const textArea = document.createElement("textarea");
            textArea.value = link;
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    setCopiedId(guest.id);
                    setTimeout(() => setCopiedId(null), 2000);
                    toast.success("Lien copié (fallback)");
                }
            } catch (copyErr) {
                console.error('Erreur lors de la copie de secours :', copyErr);
            }
            document.body.removeChild(textArea);
        }
    };

    const getPremiumWhatsAppLink = (guest) => {
        const invitationLink = `${window.location.origin}/invite/${selectedEvent.slug}?token=${guest.token}`;

        // Logic to extract family name or use a couple-friendly greeting
        let greetingName = guest.name;
        if (guest.guest_count >= 2) {
            const names = guest.name.trim().split(' ');
            const lastName = names[names.length - 1];

            if (guest.guest_count === 2) {
                greetingName = `M. & Mme ${lastName}`;
            } else {
                greetingName = `La Famille ${lastName}`;
            }
        }

        const bride = selectedEvent.customization?.bride;
        const groom = selectedEvent.customization?.groom;
        const hostNames = (bride && groom) ? `${bride} & ${groom}` : selectedEvent.title;

        const message = `✨ *INVITATION DE MARIAGE* ✨\n\nBonjour *${greetingName}*,\n\nNous avons l'immense joie de vous convier à la célébration de notre union : *${hostNames}*.\n\nVotre présence parmi nous pour ce moment d'exception nous honorerait profondément. Votre invitation personnelle ainsi que votre *Pass d'accès QR Code* sont disponibles via le lien suivant :\n\n👉 ${invitationLink}\n\n_Avec toute notre affection, nous avons hâte de vous retrouver._`;
        return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    };

    const handleCopyText = async (text, label = "Contenu") => {
        try {
            await navigator.clipboard.writeText(text);
            notify.success("Copié !", `${label} copié dans le presse-papier.`);
        } catch (err) {
            notify.error("Erreur", "Impossible de copier le texte.");
        }
    };

    if (loading || authLoading || !selectedEvent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-7 h-7 border-2 border-[#c09050] border-t-transparent rounded-full"
                    />
                    <p className="text-muted-foreground text-[12px] font-medium">Chargement...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#c09050]/10 selection:text-[#c09050] transition-colors duration-300">
            <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                eventTitle={selectedEvent.title}
                hasNewInteractions={hasNewInteractions}
                onPreview={() => window.open(`/invite/${selectedEvent.slug}`, '_blank')}
            />

            <main className="lg:ml-72 min-h-screen flex flex-col relative">
                <MobileHeader
                    eventTitle={selectedEvent.title}
                    onTabChange={setActiveTab}
                    hasNewInteractions={hasNewInteractions}
                />

                <div className="flex-1 p-4 lg:p-12 max-w-7xl mx-auto w-full space-y-10 pb-25">
                    {/* Header Section — Modern Glassmorphism */}
                    <div className="relative flex items-end md:items-end justify-between">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-2"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-[2px] bg-primary/30 rounded-full" />
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                                    {activeTab === 'overview' && "Tableau de bord"}
                                    {activeTab === 'guests' && "Gestion"}
                                    {activeTab === 'interactions' && "Feedback"}
                                    {activeTab === 'music' && "Invitation"}
                                    {activeTab === 'tables' && "Gestion des tables"}
                                </span>
                            </div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tighter leading-tight">
                                {activeTab === 'overview' && "Vue d'ensemble"}
                                {activeTab === 'guests' && "Liste des Invités"}
                                {activeTab === 'interactions' && "Interactions"}
                                {activeTab === 'music' && "Gestion Musicale"}
                                {activeTab === 'tables' && "Salles & Disposition"}
                            </h2>
                        </motion.div>

                        <div className="flex items-center gap-3 self-end md:self-center mb-1">
                            {guests.some(g => !g.invitation_sent) && (
                                <button
                                    onClick={() => setIsWhatsAppModalOpen(true)}
                                    className="group relative h-12 w-12 md:w-auto md:h-12 md:px-6 bg-primary text-primary-foreground rounded-2xl text-[13px] font-bold transition-all flex items-center justify-center md:justify-start gap-3 overflow-hidden shadow-xl shadow-primary/20 active:scale-95"
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                    <MessageCircle size={18} className="relative z-10" />
                                    <span className="relative z-10 hidden md:block">Diffusion WhatsApp</span>
                                </button>
                            )}

                            <button
                                onClick={() => setIsSettingsModalOpen(true)}
                                className="w-12 h-12 bg-card/50 backdrop-blur-md border border-border text-muted-foreground hover:text-primary rounded-2xl flex items-center justify-center transition-all hover:border-primary/30 hover:shadow-lg active:scale-90"
                            >
                                <Settings size={20} />
                            </button>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === 'overview' && (
                            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-12">
                                <StatGrid stats={stats} />
                                <div className="bento-grid rounded-none p-0 bg-transparent grid-cols-1 lg:grid-cols-2">
                                    <RecentResponses guests={guests} onSeeAll={() => setActiveTab('guests')} />
                                    <EventStatusCard
                                        event={selectedEvent}
                                        showWhatsAppButton={guests.some(g => !g.invitation_sent)}
                                        onWhatsAppBroadcaster={() => setIsWhatsAppModalOpen(true)}
                                        onShare={() => {
                                            const link = `${window.location.origin}/invite/${selectedEvent.slug}`;
                                            navigator.clipboard.writeText(link);
                                            notify.success("Lien Universel Copié", "Le lien direct de l'événement est prêt à être partagé.");
                                        }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'guests' && (
                            <motion.div key="guests" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                                <GuestList
                                    guests={filteredGuests}
                                    tables={realTables}
                                    eventSlug={selectedEvent.slug}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    filterStatus={filterStatus}
                                    setFilterStatus={setFilterStatus}
                                    filterTable={filterTable}
                                    setFilterTable={setFilterTable}
                                    onEdit={g => {
                                        let _couple = { first: '', second: '', last: '' };
                                        if (g.guest_count === 2) {
                                            const parts = (g.name || '').split(' ');
                                            const last = parts.length > 0 ? parts.pop() : '';
                                            const rest = parts.join(' ');
                                            const splitBy = rest.includes(' & ') ? ' & ' : rest.includes(' et ') ? ' et ' : null;
                                            if (splitBy) {
                                                const firsts = rest.split(splitBy);
                                                _couple = { first: firsts[0].trim(), second: firsts[1].trim(), last };
                                            } else {
                                                _couple = { first: rest, second: '', last };
                                            }
                                        }
                                        setEditingGuest(g);
                                        setGuestForm({ ...g, _couple });
                                        setIsGuestModalOpen(true);
                                    }}
                                    onDelete={handleDeleteGuest}
                                    onCopyLink={copyInviteLink}
                                    onShareWhatsApp={g => {
                                        if (!g.table_id && (!g.table || !g.table.name)) {
                                            notify.error("Action requise", "Cet invité n'est pas encore assigné à une table. Veuillez le placer avant d'envoyer son invitation.");
                                            return;
                                        }
                                        window.open(getPremiumWhatsAppLink(g), '_blank');
                                        handleMarkAsSent(g.id);
                                    }}
                                    copiedId={copiedId}
                                    onAddGuest={() => { setEditingGuest(null); setGuestForm({ name: '', guest_type: '', guest_count: 1, table_number: '', table_id: '', seat_number: '', _couple: { first: '', second: '', last: '' } }); setIsGuestModalOpen(true); }}
                                    onClearFilters={() => {
                                        setSearchQuery('');
                                        setFilterStatus('all');
                                        setFilterTable('all');
                                        setFilterSent('all');
                                    }}
                                />
                            </motion.div>
                        )}

                        {activeTab === 'tables' && (
                            <motion.div key="tables" initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.99 }}>
                                <SeatingManager
                                    tables={realTables}
                                    allGuests={guests}
                                    unplacedGuests={guests.filter(g => !g.table_id)}
                                    onUpdateTable={handleUpdateTable}
                                    onCreateTable={handleCreateTable}
                                    onDeleteTable={handleDeleteTable}
                                    selectedTableId={selectedTableId}
                                    onSelectTable={setSelectedTableId}
                                    onAssignGuest={handleAssignGuestToTable}
                                    onEditGuest={g => { setEditingGuest(g); setGuestForm(g); setIsGuestModalOpen(true); }}
                                    elements={selectedEvent.customization?.room_elements || []}
                                    onAddElement={handleAddElement}
                                    onUpdateElement={handleUpdateElement}
                                    onDeleteElement={handleDeleteElement}
                                />
                            </motion.div>
                        )}

                        {activeTab === 'interactions' && (
                            <InteractionsTab
                                guests={guests}
                                handleCopyText={handleCopyText}
                            />
                        )}

                        {activeTab === 'music' && (
                            <MusicTab
                                event={selectedEvent}
                                onUpdate={(updatedEvent) => setSelectedEvent(updatedEvent)}
                                playingSong={playingSong}
                                togglePlay={togglePlay}
                            />
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <MobileNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onAddGuest={() => setIsGuestModalOpen(true)}
                hasNewInteractions={hasNewInteractions}
            />

            {/* Modals — Glassmorphism + Inner Rounded */}
            <AnimatePresence>
                {isGuestModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsGuestModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-card w-full max-w-lg max-h-[calc(100vh-40px)] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative z-20 border border-border" data-lenis-prevent>
                            <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 text-primary p-3 rounded-2xl shrink-0 flex items-center justify-center border border-primary/20 shadow-sm">
                                        {editingGuest ? <Users size={22} strokeWidth={2.5} /> : <Plus size={22} strokeWidth={2.5} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold text-foreground tracking-tight truncate">{editingGuest ? "Modifier l'invité" : "Nouvel invité"}</h3>
                                        <p className="text-[12px] text-muted-foreground font-medium mt-0.5 opacity-80">{editingGuest ? 'Édition des détails' : 'Ajouter à votre liste'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsGuestModalOpen(false)} className="w-10 h-10 hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleAddGuest} className="p-4 sm:p-6 lg:p-8 space-y-3 bg-card overflow-y-auto custom-scrollbar">
                                <div className="space-y-3">
                                    {guestForm.guest_count?.toString() === '2' ? (
                                        <div className="space-y-4 p-2 bg-muted/20 rounded-2xl border border-border/50">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input label="Prénom 1" required type="text" value={guestForm._couple?.first || ''} onChange={e => {
                                                    const val = capitalizeName(e.target.value);
                                                    const updated = { ...(guestForm._couple || { first: '', second: '', last: '' }), first: val };
                                                    setGuestForm({ ...guestForm, _couple: updated, name: `${updated.first} & ${updated.second} ${updated.last}`.trim() });
                                                }} placeholder="Ex: Jean" className="focus:border-primary/50" />
                                                <Input label="Prénom 2" required type="text" value={guestForm._couple?.second || ''} onChange={e => {
                                                    const val = capitalizeName(e.target.value);
                                                    const updated = { ...(guestForm._couple || { first: '', second: '', last: '' }), second: val };
                                                    setGuestForm({ ...guestForm, _couple: updated, name: `${updated.first} & ${updated.second} ${updated.last}`.trim() });
                                                }} placeholder="Ex: Marie" className="focus:border-primary/50" />
                                            </div>
                                            <Input label="Nom de famille" required type="text" value={guestForm._couple?.last || ''} onChange={e => {
                                                const val = capitalizeName(e.target.value);
                                                const updated = { ...(guestForm._couple || { first: '', second: '', last: '' }), last: val };
                                                setGuestForm({ ...guestForm, _couple: updated, name: `${updated.first} & ${updated.second} ${updated.last}`.trim() });
                                            }} placeholder="Ex: Dupont" className="focus:border-primary/50" />
                                        </div>
                                    ) : (
                                        <Input label="Nom Complet" required type="text" value={guestForm.name || ''} onChange={e => setGuestForm({ ...guestForm, name: capitalizeName(e.target.value) })} placeholder="Ex: Jean Dupont" className="focus:border-primary/50" />
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 space-y-3 gap-x-6">
                                        <div>
                                            <label className="text-sm font-normal text-foreground/70 ml-1">Type d'invité</label>
                                            <Select
                                                value={guestForm.guest_type || 'none'}
                                                onValueChange={value => setGuestForm({ ...guestForm, guest_type: value === 'none' ? '' : value })}
                                            >
                                                <SelectTrigger className="w-full px-4 py-3.5 h-auto bg-transparent border border-foreground/20 rounded-lg outline-none font-medium text-foreground text-sm shadow-none focus:border-primary/50 transition-all">
                                                    <SelectValue placeholder="Choisir le type..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card rounded-xl border border-border shadow-2xl p-1">
                                                    <SelectItem value="none" className="text-muted-foreground font-medium focus:bg-muted rounded-lg cursor-pointer">Non spécifié</SelectItem>
                                                    {['Famille', 'Ami', 'Connaissance', 'Autre'].map(type => (
                                                        <SelectItem key={type} value={type} className="font-semibold text-foreground focus:bg-primary/5 focus:text-primary rounded-lg cursor-pointer">
                                                            {type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <label className="text-sm font-normal text-foreground/70 ml-1">Nombre de personnes</label>
                                            <Select
                                                value={guestForm.guest_count?.toString() || '1'}
                                                onValueChange={value => setGuestForm({ ...guestForm, guest_count: parseInt(value) })}
                                            >
                                                <SelectTrigger className="w-full px-4 py-3.5 h-auto bg-transparent border border-foreground/20 rounded-lg outline-none font-medium text-foreground text-sm shadow-none focus:border-primary/50 transition-all">
                                                    <SelectValue placeholder="Nombre..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card rounded-xl border border-border shadow-2xl p-1">
                                                    <SelectItem value="1" className="font-semibold text-foreground focus:bg-primary/5 focus:text-primary rounded-lg cursor-pointer">Individuel (1)</SelectItem>
                                                    <SelectItem value="2" className="font-semibold text-foreground focus:bg-primary/5 focus:text-primary rounded-lg cursor-pointer">Couple (2)</SelectItem>
                                                    {[3, 4, 5, 6, 8, 10].map(n => (
                                                        <SelectItem key={n} value={n.toString()} className="font-semibold text-foreground focus:bg-primary/5 focus:text-primary rounded-lg cursor-pointer">
                                                            Groupe ({n})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 space-y-3 gap-x-6">
                                        <div>
                                            <label className="text-sm font-normal text-foreground/70 ml-1">Table</label>
                                            <Select
                                                value={guestForm.table_id?.toString() || 'none'}
                                                disabled={editingGuest && (editingGuest.invitation_sent || editingGuest.status !== 'pending')}
                                                onValueChange={value => {
                                                    if (value === 'none') {
                                                        setGuestForm({ ...guestForm, table_id: null, table_number: '' });
                                                        return;
                                                    }
                                                    const table = realTables.find(t => t.id === parseInt(value));
                                                    setGuestForm({ ...guestForm, table_id: value, table_number: table ? table.name : '' });
                                                }}
                                            >
                                                <SelectTrigger className="w-full px-4 py-3.5 h-auto bg-transparent border border-foreground/20 rounded-lg outline-none font-medium text-foreground text-sm shadow-none focus:border-primary/50 transition-all">
                                                    <SelectValue placeholder="Choisir..." />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card rounded-xl border border-border shadow-2xl p-1">
                                                    <SelectItem value="none" className="text-muted-foreground font-medium focus:bg-muted rounded-lg cursor-pointer">Libre</SelectItem>
                                                    {realTables.map(table => (
                                                        <SelectItem key={table.id} value={table.id.toString()} className="font-semibold text-foreground focus:bg-primary/5 focus:text-primary rounded-lg cursor-pointer">
                                                            {table.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Input
                                            label="Siège #"
                                            type="number"
                                            value={guestForm.seat_number || ''}
                                            disabled={editingGuest && (editingGuest.invitation_sent || editingGuest.status !== 'pending')}
                                            onChange={e => setGuestForm({ ...guestForm, seat_number: e.target.value })}
                                            placeholder="Ex: 5"
                                            className="focus:border-primary/50"
                                        />
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="h-11 w-full rounded-lg text-sm font-bold bg-primary! text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                                                <span>Enregistrement...</span>
                                            </div>
                                        ) : (
                                            editingGuest ? "Mettre à jour" : "Ajouter l'invité"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isTableModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsTableModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-card w-full max-w-md max-h-[calc(100vh-40px)] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative z-20 border border-border" data-lenis-prevent>
                            <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 text-primary p-3 rounded-2xl shrink-0 flex items-center justify-center border border-primary/20 shadow-sm">
                                        <LayoutTemplate size={22} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold text-foreground tracking-tight truncate">Nouvelle Table</h3>
                                        <p className="text-[12px] text-muted-foreground font-medium mt-0.5 opacity-80">Configuration spatiale</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsTableModalOpen(false)} className="w-10 h-10 hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmitTable} className="p-4 sm:p-6 lg:p-8 space-y-3 bg-card overflow-y-auto custom-scrollbar">
                                <div className="space-y-5">
                                    <Input label="Nom de la table" required type="text" value={tableForm.name || ''} onChange={e => setTableForm({ ...tableForm, name: e.target.value })} placeholder="Ex: VIP 1" className="focus:border-primary/50" />
                                    <Input label="Capacité (personnes)" required type="number" value={tableForm.capacity || ''} onChange={e => setTableForm({ ...tableForm, capacity: e.target.value })} placeholder="Ex: 10" className="focus:border-primary/50" />
                                </div>
                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="h-14 w-full rounded-2xl text-[13px] font-bold uppercase tracking-widest bg-primary text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center gap-2">
                                                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                                                <span>Création...</span>
                                            </div>
                                        ) : (
                                            "Créer la table"
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isSettingsModalOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSettingsModalOpen(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-card w-full max-w-lg max-h-[calc(100vh-40px)] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col relative z-20 border border-border" data-lenis-prevent>
                            <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 text-primary p-3 rounded-2xl shrink-0 flex items-center justify-center border border-primary/20 shadow-sm">
                                        <Settings size={22} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-bold text-foreground tracking-tight truncate">Paramètres</h3>
                                        <p className="text-[12px] text-muted-foreground font-medium mt-0.5 opacity-80">Configuration globale</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsSettingsModalOpen(false)} className="w-10 h-10 hover:bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleUpdateSettings} className="p-4 sm:p-6 lg:p-8 space-y-3 bg-card overflow-y-auto custom-scrollbar">
                                <div className="space-y-3">
                                    <Input label="Limite globale d'invités" required type="number" value={settingsForm.guest_limit || ''} onChange={e => setSettingsForm({ ...settingsForm, guest_limit: e.target.value })} placeholder="Ex: 100" className="focus:border-primary/50" />
                                    <div className="p-5 bg-muted/30 rounded-2xl border border-border flex gap-4 items-start shadow-inner">
                                        <div className="w-6 h-6 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        </div>
                                        <p className="text-[13px] text-muted-foreground leading-relaxed font-medium">
                                            Définissez la capacité maximale d'invités acceptée pour cet événement. Les statistiques du tableau de bord s'ajusteront automatiquement.
                                        </p>
                                    </div>

                                    <div className="pt-4 space-y-4 border-t border-border mt-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Mode Staff (Check-in)</h4>
                                            <button
                                                type="button"
                                                onClick={handleRefreshStaffToken}
                                                className="text-[10px] font-bold text-primary hover:underline"
                                            >
                                                {staffToken ? "Régénérer le code" : "Générer un code"}
                                            </button>
                                        </div>

                                        {staffToken ? (
                                            <div className="p-4 bg-muted rounded-2xl border border-border space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Code d'accès actuel</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(staffToken);
                                                            toast.success("Code copié !");
                                                        }}
                                                        className="text-zinc-400 hover:text-white transition-colors"
                                                    >
                                                        <Copy size={14} />
                                                    </button>
                                                </div>
                                                <p className="text-xl font-mono font-bold text-[#c09050] tracking-wider break-all">{staffToken}</p>

                                                <div className="pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const setupLink = `${window.location.origin}/check-in/setup?staff_token=${staffToken}`;
                                                            navigator.clipboard.writeText(setupLink);
                                                            toast.success("Lien de configuration copié !", {
                                                                description: "Envoyez ce lien à votre staff pour configurer leur téléphone."
                                                            });
                                                        }}
                                                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-white uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
                                                    >
                                                        <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                                        Copier le lien automatique
                                                    </button>
                                                </div>

                                                <p className="text-[11px] text-zinc-500 leading-tight italic">
                                                    Partagez ce code avec votre personnel de réception. Ils pourront scanner les QR codes sans accéder à votre compte personnel.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-4 bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-center">
                                                <p className="text-xs text-stone-400">Aucun code staff actif.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <Button type="submit" className="h-14 w-full rounded-2xl text-[12px] font-bold uppercase tracking-widest bg-[#18181b] hover:bg-zinc-800 text-[#c09050] border-none shadow-xl shadow-black/10 transition-all hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]">
                                        Mettre à jour
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <NotificationModal
                {...notification}
                onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
            />

            <WhatsAppBroadcasterModal
                isOpen={isWhatsAppModalOpen}
                onClose={() => setIsWhatsAppModalOpen(false)}
                guests={guests}
                event={selectedEvent}
                onMarkAsSent={handleMarkAsSent}
            />

            <AnimatePresence>
                {playingSong && (
                    <GlobalAudioPlayer
                        playingSong={playingSong}
                        stopPlay={stopPlay}
                        togglePlay={togglePlay}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;
