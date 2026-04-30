import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Plus, Trash2, Play, Pause, Loader2, X, Star } from 'lucide-react';
import { Button, cn } from '../ui/Base';
import { eventService } from '../../services/api';
import { toast } from 'sonner';
import { SwitchEvent } from '../ui/SwitchEvent';

const PlayingVisual = ({ className }) => (
    <div className={cn("flex items-end gap-[3px] h-4", className)}>
        {[0.8, 1.2, 0.9, 1.3].map((duration, i) => (
            <motion.div
                key={i}
                animate={{ height: ["30%", "100%", "30%"] }}
                transition={{ duration: duration, repeat: Infinity, ease: "easeInOut" }}
                className="w-[3px] bg-current rounded-sm"
                style={{ originY: 1 }}
            />
        ))}
    </div>
);

const MusicTab = ({ event, onUpdate, playingSong, togglePlay }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadTitle, setUploadTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);

    const songs = event.customization?.songs || [];
    const activeSong = songs.find(s => s.is_active);
    const otherSongs = songs.filter(s => !s.is_active);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            if (!uploadTitle) {
                setUploadTitle(file.name.split('.')[0]);
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !uploadTitle) {
            toast.error("Veuillez sélectionner un fichier et donner un titre.");
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('music', selectedFile);
        formData.append('title', uploadTitle);

        try {
            const res = await eventService.uploadMusic(event.slug, formData);
            onUpdate(res.data);
            setSelectedFile(null);
            setUploadTitle('');
            setIsUploadModalOpen(false);
            toast.success("Musique ajoutée avec succès !");
        } catch (err) {
            if (err.response?.data?.errors) {
                const messages = Object.values(err.response.data.errors).flat().join(' ');
                toast.error(`Erreur : ${messages}`);
            } else {
                toast.error(err.response?.data?.message || "Erreur lors de l'envoi du fichier.");
            }
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (songId) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cette chanson ?")) return;

        try {
            const res = await eventService.deleteMusic(event.slug, songId);
            onUpdate(res.data);
            toast.success("Chanson supprimée.");
            if (playingSong?.id === songId) {
                togglePlay(playingSong);
            }
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors de la suppression.");
        }
    };

    const handleSetActive = async (songId) => {
        const updatedSongs = songs.map(s => ({
            ...s,
            is_active: s.id === songId
        }));
        const updatedCustomization = { ...event.customization, songs: updatedSongs };

        try {
            const res = await eventService.update(event.slug, { customization: updatedCustomization });
            onUpdate(res.data);
            toast.success("Musique d'invitation mise à jour !");
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors de la mise à jour.");
        }
    };

    const handleToggleMusic = async (enabled) => {
        const updatedCustomization = {
            ...event.customization,
            music_enabled: enabled
        };

        try {
            const res = await eventService.update(event.slug, { customization: updatedCustomization });
            onUpdate(res.data);
            toast.success(enabled ? "Musique d'invitation activée." : "Musique d'invitation désactivée.");
            if (!enabled && playingSong) stopPlay();
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors de la mise à jour.");
        }
    };

    const handleDisableMusic = async () => {
        const updatedSongs = songs.map(s => ({
            ...s,
            is_active: false
        }));
        const updatedCustomization = { ...event.customization, songs: updatedSongs };

        try {
            const res = await eventService.update(event.slug, { customization: updatedCustomization });
            onUpdate(res.data);
            toast.success("Musique d'invitation décochée.");
            if (playingSong) stopPlay();
        } catch (err) {
            console.error(err);
            toast.error("Erreur lors de la désactivation.");
        }
    };

    const musicEnabled = event.customization?.music_enabled !== false;

    return (
        <div className="space-y-4 pb-10">
            {/* Upload Modal */}
            <AnimatePresence>
                {isUploadModalOpen && (
                    <div className="fixed inset-0 z-10 flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsUploadModalOpen(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-card rounded-[2rem] shadow-2xl border border-border p-8 overflow-hidden"
                        >
                            <button
                                onClick={() => setIsUploadModalOpen(false)}
                                className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 bg-primary/10 text-primary rounded-[1.2rem] flex items-center justify-center border border-primary/20 shadow-inner">
                                    <Music size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-foreground">Ajouter une musique</h3>
                                    <p className="text-[13px] text-muted-foreground font-medium mt-1">Format MP3, M4A ou WAV (Max 10Mo)</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Titre de la chanson</label>
                                    <input
                                        type="text"
                                        value={uploadTitle}
                                        onChange={(e) => setUploadTitle(e.target.value)}
                                        placeholder="Ex: Entrée des mariés"
                                        className="w-full h-12 px-5 bg-muted/50 border border-border rounded-2xl outline-none focus:border-primary focus:bg-background transition-all text-[13px] font-medium text-foreground"
                                    />
                                </div>
                                <div className="space-y-2 relative">
                                    <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest ml-1">Fichier Audio</label>
                                    <label className="flex items-center justify-center w-full h-24 px-5 bg-muted/50 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:border-primary/50 transition-colors group">
                                        <div className="flex flex-col items-center gap-2">
                                            {selectedFile ? (
                                                <div className="flex flex-col items-center">
                                                    <Music size={24} className="text-primary mb-1" />
                                                    <span className="text-[12px] font-bold text-foreground text-center px-4 truncate max-w-xs">{selectedFile.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">Cliquez pour changer</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Plus size={24} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                                    <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">Sélectionner un fichier</span>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="audio/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>

                            <div className="mt-8">
                                <Button
                                    onClick={handleUpload}
                                    disabled={isUploading || !selectedFile}
                                    className="w-full h-12 rounded-[1.2rem] bg-foreground text-background font-bold text-[13px] tracking-wide transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 group shadow-md"
                                >
                                    {isUploading ? <Loader2 className="animate-spin mr-2 text-muted-foreground" size={18} /> : <Plus className="mr-2 text-muted-foreground group-hover:text-background transition-colors" size={18} />}
                                    {isUploading ? "Envoi en cours..." : "Ajouter à la bibliothèque"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header & Library Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 bg-card lg:rounded-[1rem] rounded-[1.5rem] shadow-sm border border-border p-2">
                <div className="flex items-center gap-3 ">
                    <div className="w-10 h-10 rounded-[1rem] bg-background border border-border flex items-center justify-center shadow-inner">
                        <Music className="text-primary" size={18} />
                    </div>
                    <div>
                        <h2 className="text-[14px] font-extrabold text-foreground leading-tight">Ma Bibliothèque Musicale</h2>
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">
                            {songs.length} titre{songs.length > 1 ? 's' : ''} disponible{songs.length > 1 ? 's' : ''}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:items-center gap-6 lg:px-6">
                    <div className="flex items-center gap-3">
                        <span className={cn("text-[13px] font-bold transition-colors", musicEnabled ? "text-primary" : "text-muted-foreground")}>
                            Musique de l'invitation "{musicEnabled ? "Activée" : "Désactivée"}"
                        </span>
                        <SwitchEvent
                            checked={musicEnabled}
                            onCheckedChange={handleToggleMusic}
                        />
                    </div>
                    <div className="w-px h-6 bg-border hidden sm:block" />
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="w-full lg:w-auto h-12 lg:px-6 px-2 bg-foreground rounded-[1rem] flex items-center justify-center gap-2.5 text-background shadow-sm transition-colors hover:bg-foreground/90 active:scale-95 group shrink-0"
                    >
                        <Plus size={16} className="text-muted-foreground group-hover:text-background transition-colors" />
                        <span className="text-[13px] font-medium tracking-wide">Nouveau titre</span>
                    </button>
                </div>
            </div>

            {songs.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card rounded-[2rem] border border-border shadow-sm min-h-[400px]"
                >
                    <div className="w-24 h-24 bg-muted/50 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner border border-border/50 rotate-3">
                        <Music className="text-muted-foreground" size={40} />
                    </div>
                    <h3 className="text-xl font-extrabold text-foreground mb-2">
                        Aucune musique disponible
                    </h3>
                    <p className="text-[13px] font-medium text-muted-foreground max-w-sm mb-8 leading-relaxed">
                        Créez une atmosphère unique en ajoutant une musique de fond à votre page d'invitation.
                    </p>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="h-12 px-8 bg-foreground text-background rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl shadow-foreground/10 transition-transform hover:scale-105 active:scale-95 group"
                    >
                        <Plus size={18} className="text-muted-foreground group-hover:text-background transition-colors" />
                        <span className="text-[13px] font-bold tracking-wide">Ajouter ma première musique</span>
                    </button>
                </motion.div>
            ) : (
                <div className="space-y-8">
                    {/* Active Song Banner */}
                    {activeSong && musicEnabled ? (
                        <div>
                            <div className="flex items-center gap-2 mb-3 pl-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-foreground" />
                                <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Musique de l'invitation</h3>
                            </div>
                            <div className="bg-foreground text-background border border-border rounded-[1.8rem] p-5 shadow-lg relative overflow-hidden">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                                    <div className="flex items-center gap-5">
                                        <button
                                            onClick={() => togglePlay(activeSong)}
                                            className="w-14 h-14 rounded-2xl bg-background/10 flex items-center justify-center border border-background/20 hover:bg-background/20 transition-all shrink-0 text-background"
                                        >
                                            {playingSong?.id === activeSong.id ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                                        </button>
                                        <div className="flex flex-col min-w-0">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <h4 className="text-lg font-bold text-background leading-tight truncate">{activeSong.title}</h4>
                                                {playingSong?.id === activeSong.id && <PlayingVisual className="text-background shrink-0" />}
                                            </div>
                                            <p className="text-[12px] font-medium text-background/60 mt-1">
                                                Actuellement en lecture sur l'invitation
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                                        <button
                                            onClick={handleDisableMusic}
                                            className="h-12 px-6 rounded-[1.2rem] flex items-center justify-center gap-2 bg-background/10 border border-background/20 text-background hover:bg-background/20 transition-all font-bold text-[11px] uppercase tracking-widest"
                                        >
                                            <Music size={16} className="opacity-50" />
                                            Décocher
                                        </button>
                                        <button
                                            onClick={() => handleDelete(activeSong.id)}
                                            className="w-12 h-12 rounded-[1.2rem] flex items-center justify-center bg-background/5 border border-background/10 text-background/50 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shrink-0"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-muted/30 border border-dashed border-border rounded-[1.8rem] p-8 flex flex-col items-center justify-center text-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                                <Music size={24} className="opacity-30" />
                            </div>
                            <div className="max-w-xs">
                                <h4 className="text-[15px] font-extrabold text-foreground tracking-tight">
                                    {!musicEnabled ? "Musique d'invitation désactivée" : "Aucune musique active"}
                                </h4>
                                <p className="text-[12px] font-medium text-muted-foreground mt-1.5 leading-relaxed">
                                    {!musicEnabled
                                        ? "L'invitation restera totalement silencieuse à l'ouverture."
                                        : "Choisissez une musique dans votre bibliothèque pour l'activer sur l'invitation."}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Other Songs List */}
                    {otherSongs.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3 pl-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                                <h3 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">Bibliothèque</h3>
                            </div>
                            <div className="space-y-1">
                                {otherSongs.map((song, index) => {
                                    const isPlaying = playingSong?.id === song.id;

                                    return (
                                        <div
                                            key={song.id}
                                            className={cn(
                                                'bg-card group hover:bg-muted/50 border border-transparent hover:border-border/50 relative shadow-sm lg:px-6 lg:py-2 px-5 py-4 cursor-default rounded-lg transition-all duration-300',
                                                index === otherSongs.length - 1 ? 'lg:rounded-b-[1.8rem] rounded-b-[1.8rem]' : '',
                                                index === 0 ? 'rounded-t-[1.8rem]' : ''
                                            )}
                                        >
                                            {/* DESKTOP */}
                                            <div className='hidden lg:flex items-center justify-between'>
                                                {/* Info & Play */}
                                                <div className="flex items-center gap-4 min-w-0 pr-4">
                                                    <button
                                                        onClick={() => togglePlay(song)}
                                                        className={cn(
                                                            "w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all shrink-0",
                                                            isPlaying
                                                                ? "bg-foreground text-background shadow-md"
                                                                : "bg-background border border-border text-foreground group-hover:bg-muted-foreground/10"
                                                        )}
                                                    >
                                                        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                                                    </button>
                                                    <div className="flex flex-col min-w-0">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <span className="text-[14px] font-bold text-foreground leading-tight truncate">{song.title}</span>
                                                            {isPlaying && <PlayingVisual className="text-foreground shrink-0" />}
                                                        </div>
                                                        <span className="text-[12px] font-medium text-muted-foreground mt-0.5 truncate">Piste Audio</span>
                                                    </div>
                                                </div>

                                                {/* Options (visible on hover) */}
                                                <div className="flex items-center gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100 shrink-0">
                                                    <button
                                                        onClick={() => handleSetActive(song.id)}
                                                        className="h-10 px-5 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-colors flex items-center border border-border bg-background text-foreground hover:bg-foreground hover:text-background shadow-sm"
                                                    >
                                                        Utiliser
                                                    </button>
                                                    <button onClick={() => handleDelete(song.id)} className="w-10 h-10 flex items-center justify-center rounded-xl shadow-sm border border-border bg-background text-muted-foreground hover:text-rose-500 hover:border-rose-500 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* MOBILE */}
                                            <div className='lg:hidden flex flex-col gap-4'>
                                                <div className='flex items-center justify-between'>
                                                    <div className="flex items-center gap-4 min-w-0 pr-2">
                                                        <button
                                                            onClick={() => togglePlay(song)}
                                                            className={cn(
                                                                "w-12 h-12 rounded-[1rem] flex items-center justify-center transition-all shrink-0",
                                                                isPlaying
                                                                    ? "bg-foreground text-background shadow-sm"
                                                                    : "bg-background border border-border text-foreground"
                                                            )}
                                                        >
                                                            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
                                                        </button>
                                                        <div className="flex flex-col min-w-0">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <span className="text-[14px] font-bold text-foreground leading-tight truncate">{song.title}</span>
                                                                {isPlaying && <PlayingVisual className="text-foreground shrink-0" />}
                                                            </div>
                                                            <span className="text-[12px] font-medium text-muted-foreground truncate">Piste Audio</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className='flex items-center justify-end gap-2 pt-2 border-t border-border/50'>
                                                    <button
                                                        onClick={() => handleSetActive(song.id)}
                                                        className="px-5 py-2.5 rounded-xl border border-border shadow-sm bg-background text-foreground font-bold text-[11px] uppercase tracking-wider transition-colors"
                                                    >
                                                        Utiliser
                                                    </button>
                                                    <button onClick={() => handleDelete(song.id)} className="p-2.5 rounded-xl border border-border shadow-sm bg-background text-rose-500 hover:text-rose-600 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MusicTab;
