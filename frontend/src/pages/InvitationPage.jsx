import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Lottie from 'lottie-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { MapPin, Calendar, Clock, Heart, Music, MessageCircle, Gift, Share2, Camera, ChevronRight, ChevronLeft, X, Send, CreditCard, Landmark, Quote, Undo2, Frown, HeartCrack, Plus, Trash2, Link as LinkIcon, PenLine, User, Archive, CalendarCheck, QrCode, Users, Ticket, DownloadIcon, Volume2, VolumeX, Sparkles, Flower2, Leaf, Sprout } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn, Button } from '../components/ui/Base';
import { TextareaEvent } from '../components/ui/TextareaEvent';
import heroDecorationImg1 from '../assets/decorations/hero/hero-flower-8.png';
import heroDecorationImg2 from '../assets/decorations/hero/hero-flower-1.png';
import HeroWedding from './themes/components/HeroWedding';

import { guestService, eventService } from '../services/api';
import { toast } from 'sonner';
import { notify } from '../lib/notify';
import invitationMusic from '../assets/music/invitation-music.m4a';

// Import decorations to have stable mapping
const decorationFiles = import.meta.glob('/src/assets/decorations/intro/*.{png,jpg,jpeg,avif,webp}', { eager: true });
const decorationMap = {};
Object.entries(decorationFiles).forEach(([path, module]) => {
    const fileName = path.split('/').pop().split('.')[0];
    decorationMap[fileName] = module.default;
});

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards, EffectCoverflow, Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-cards';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/autoplay';

const MusicModal = ({ isOpen, onClose, onSuccess, token, initialData }) => {
    const [suggestions, setSuggestions] = useState([{ artist: '', title: '' }]);
    const [videoUrl, setVideoUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize with existing data only when modal opens
    useEffect(() => {
        if (isOpen) {
            if (initialData?.songs && initialData.songs.length > 0) {
                const parsed = initialData.songs.map(song => {
                    const parts = song.split(' - ');
                    if (parts.length >= 2) {
                        return { artist: parts[0], title: parts.slice(1).join(' - ') };
                    }
                    return { artist: '', title: song };
                });
                setSuggestions(parsed);
            } else {
                setSuggestions([{ artist: '', title: '' }]);
            }
            setVideoUrl(initialData?.link || '');
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        let finalSongs = suggestions
            .filter(s => s.title.trim() !== '' || s.artist.trim() !== '')
            .map(s => {
                if (s.artist.trim() && s.title.trim()) return `${s.artist.trim()} - ${s.title.trim()}`;
                return s.artist.trim() || s.title.trim();
            });

        // Auto-detect title from link if songs are empty
        if (finalSongs.length === 0 && videoUrl.trim()) {
            try {
                const url = new URL(videoUrl.trim());
                if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
                    finalSongs = ["Musique YouTube"];
                } else if (url.hostname.includes('spotify.com')) {
                    finalSongs = ["Titre Spotify"];
                } else if (url.hostname.includes('apple.com')) {
                    finalSongs = ["Apple Music"];
                } else if (url.hostname.includes('deezer.com')) {
                    finalSongs = ["Deezer Track"];
                } else if (url.hostname.includes('tiktok.com')) {
                    finalSongs = ["Son TikTok"];
                } else {
                    finalSongs = ["Lien partagé"];
                }
            } catch (e) {
                // Not a valid URL, fallback to error
                notify.error("Oups !", "Le lien n'est pas valide.");
                return;
            }
        }

        if (finalSongs.length === 0) {
            notify.error("Oups !", "Veuillez remplir au moins un champ.");
            return;
        }

        setIsSubmitting(true);
        try {
            await guestService.suggestMusic(token, {
                songs: finalSongs,
                link: videoUrl
            });
            notify.success("Merci !", "Vos suggestions musicales ont été envoyées.");

            // Clear fields on success
            setSuggestions([{ artist: '', title: '' }]);
            setVideoUrl('');

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error(err);
            notify.error("Erreur", "Impossible d'envoyer vos suggestions. Veuillez réessayer.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const addSuggestion = () => {
        if (suggestions.length < 2) {
            setSuggestions([...suggestions, { artist: '', title: '' }]);
        }
    };
    const removeSuggestion = (index) => {
        const newSuggestions = suggestions.filter((_, i) => i !== index);
        setSuggestions(newSuggestions.length > 0 ? newSuggestions : [{ artist: '', title: '' }]);
    };

    const updateSuggestion = (index, field, value) => {
        const newSuggestions = [...suggestions];
        newSuggestions[index] = { ...newSuggestions[index], [field]: value };
        setSuggestions(newSuggestions);
    };

    // Auto-detect title from link using OEmbed (Noembed service)
    useEffect(() => {
        const fetchTitle = async () => {
            if (videoUrl.trim() && suggestions.every(s => s.title.trim() === '' && s.artist.trim() === '')) {
                try {
                    const response = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(videoUrl.trim())}`);
                    const data = await response.json();
                    if (data && data.title) {
                        // Try to parse "Artist - Title" from OEmbed title if possible
                        const parts = data.title.split(' - ');
                        if (parts.length >= 2) {
                            setSuggestions([{ artist: parts[0], title: parts.slice(1).join(' - ') }]);
                        } else {
                            setSuggestions([{ artist: '', title: data.title }]);
                        }
                    }
                } catch (e) {
                    // Fail silently, user can still type manually
                }
            }
        };
        const timer = setTimeout(fetchTitle, 800); // Small debounce
        return () => clearTimeout(timer);
    }, [videoUrl]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-4xl p-8 md:p-10 shadow-3xl overflow-hidden max-h-[90vh] flex flex-col"
                    data-lenis-prevent
                >
                    {/* Background accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none" style={{ backgroundColor: 'var(--primary)', borderRadius: '0 0 0 100%' }}></div>

                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-800 transition-colors bg-stone-50 rounded-full z-10"><X size={20} /></button>

                    <div className="text-center mb-8 shrink-0">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl rotate-3 transition-transform hover:rotate-6" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                            <Music size={28} />
                        </div>
                        <h3 className="text-2xl font-serif" style={{ fontFamily: 'var(--font-main)', color: 'var(--primary)' }}>Suggérer une musique</h3>
                        <p className="text-stone-500 text-sm mt-2">Partagez les morceaux qui vous font vibrer</p>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar -mr-2">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <label className="text-[10px] uppercase tracking-widest text-stone-400 font-medium">Vos chansons préférées</label>
                                <span className="text-[10px] text-stone-300 font-medium px-2 py-0.5 bg-stone-50 rounded-full">{suggestions.filter(s => s.title.trim() !== '' || s.artist.trim() !== '').length} ajoutée(s)</span>
                            </div>

                            <div className="space-y-4">
                                <AnimatePresence mode="popLayout">
                                    {suggestions.map((s, idx) => (
                                        <motion.div
                                            key={idx}
                                            layout
                                            initial={{ opacity: 0, x: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: 10, scale: 0.95 }}
                                            className="space-y-3 p-5 bg-stone-50/50 rounded-3xl border border-stone-100 relative group"
                                        >
                                            <div className="flex gap-4">
                                                <div className="flex-1 space-y-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold ml-1">Artiste / Groupe</label>
                                                        <input
                                                            className="w-full px-5 py-3.5 border border-stone-200 rounded-2xl outline-none focus:ring-1 focus:ring-stone-200/90 text-sm transition-all placeholder:text-stone-300 bg-white"
                                                            placeholder="Ex: Coldplay"
                                                            value={s.artist}
                                                            onChange={(e) => updateSuggestion(idx, 'artist', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold ml-1">Titre de la chanson</label>
                                                        <input
                                                            className="w-full px-5 py-3.5 border border-stone-200 rounded-2xl outline-none focus:ring-1 focus:ring-stone-200/90 text-sm transition-all placeholder:text-stone-300 bg-white"
                                                            placeholder="Ex: A Sky Full of Stars"
                                                            value={s.title}
                                                            onChange={(e) => updateSuggestion(idx, 'title', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                {suggestions.length > 1 && (
                                                    <button
                                                        onClick={() => removeSuggestion(idx)}
                                                        className="h-10 w-10 text-stone-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-full flex items-center justify-center shrink-0 mt-6"
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {suggestions.length < 2 && (
                                <button
                                    onClick={addSuggestion}
                                    className="w-full py-4 border-2 border-dashed border-stone-100 rounded-2xl text-stone-400 hover:text-stone-600 hover:border-stone-200 hover:bg-stone-50/50 transition-all flex items-center justify-center gap-2 text-sm font-medium group"
                                >
                                    <div className="p-1 rounded-full bg-stone-100 group-hover:bg-white transition-colors">
                                        <Plus size={14} />
                                    </div>
                                    {initialData?.songs?.length > 0 ? "Compléter avec un 2ème titre" : "Ajouter une autre suggestion"}
                                </button>
                            )}
                            {suggestions.length >= 2 && (
                                <p className="text-[10px] text-center text-stone-300 font-medium italic">Limite maximum de 2 titres atteinte</p>
                            )}
                        </div>

                        <div className="space-y-4 pt-2 border-t border-stone-100">
                            <label className="text-[10px] uppercase tracking-widest text-stone-400 font-medium px-2">Lien (YouTube, Spotify, Apple Music...)</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-stone-100 text-stone-400 group-focus-within:bg-white group-focus-within:text-amber-500 transition-all shadow-sm">
                                    <LinkIcon size={18} />
                                </div>
                                <input
                                    className="w-full pl-16 pr-5 py-4 border border-stone-300 rounded-2xl outline-none focus:ring-1 focus:ring-stone-200/90 text-base transition-all placeholder:text-stone-300 group-hover:bg-white group-hover:border-stone-200"
                                    placeholder="Coller le lien ici..."
                                    value={videoUrl}
                                    onChange={(e) => setVideoUrl(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 mt-4">
                            <p className="text-[11px] text-stone-400 text-center leading-relaxed">
                                <span className="font-bold text-stone-500 block mb-1">Note :</span>
                                Merci de faire des choix respectueux. Toutes les suggestions seront examinées avant d'être ajoutées à la playlist officielle de l'événement.
                            </p>
                        </div>
                    </div>

                    <div className="pt-8 shrink-0">
                        <Button
                            className="w-full h-16 rounded-2xl text-lg font-semibold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
                            style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send size={20} className="mr-3" />
                                    {initialData?.songs?.length > 0 ? "Mettre à jour mes choix" : "Envoyer la suggestion"}
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const GuestbookModal = ({ isOpen, onClose, onSuccess, token, initialData }) => {
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize with existing data only when modal opens
    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
            setMessage(initialData?.message || '');
        }
    }, [isOpen]); // Only depend on isOpen to avoid resetting while typing

    const handleSubmit = async () => {
        if (!message.trim()) {
            notify.error("Message requis", "Veuillez écrire un petit mot avant d'envoyer.");
            return;
        }

        setIsSubmitting(true);
        try {
            await guestService.postGuestbook(token, {
                name: name.trim() || initialData?.name || "Anonyme",
                message: message
            });
            notify.success("Merci !", "Votre message a été ajouté au Livre d'Or.");

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error(err);
            notify.error("Erreur", "Impossible de publier votre message. Veuillez réessayer.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-white rounded-4xl p-4 md:p-6 shadow-3xl overflow-hidden flex flex-col"
                    data-lenis-prevent
                >
                    {/* Background accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none" style={{ backgroundColor: 'var(--secondary)', borderRadius: '0 0 0 100%' }}></div>

                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-800 transition-colors bg-stone-50 rounded-full z-10"><X size={20} /></button>

                    <div className="text-center mb-6 shrink-0 pt-4">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl -rotate-3 transition-transform hover:rotate-0" style={{ backgroundColor: 'var(--secondary)', color: 'white' }}>
                            <MessageCircle size={28} />
                        </div>
                        <h3 className="text-2xl font-serif" style={{ fontFamily: 'var(--font-main)', color: 'var(--secondary)' }}>
                            {initialData?.message ? "Modifier votre mot" : "Livre d'Or"}
                        </h3>
                        <p className="text-stone-500 text-sm mt-2">Laissez un souvenir aux mariés</p>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar -mr-2">
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-stone-400 font-medium px-2">Votre Nom</label>
                            <input
                                className="w-full px-5 py-4 border border-stone-300 rounded-2xl outline-none focus:ring-1 focus:ring-stone-200/90 text-base transition-all placeholder:text-stone-300 hover:border-stone-200"
                                placeholder="Votre nom (optionnel)..."
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-stone-400 font-medium px-2">Votre Message</label>
                            <TextareaEvent
                                className="w-full px-5 py-4 border border-stone-300 rounded-2xl outline-none focus:ring-1 focus:ring-stone-200/90 text-base transition-all placeholder:text-stone-300 hover:border-stone-200 min-h-[140px]"
                                placeholder="Écrivez votre message ici..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="pt-6 shrink-0">
                        <Button
                            className="w-full h-16 rounded-2xl text-lg font-semibold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center"
                            style={{ backgroundColor: 'var(--secondary)', color: 'white' }}
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><Send size={20} className="mr-3" /> {initialData?.message ? "Mettre à jour" : "Publier mon message"}</>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const CelebrationLottie = ({ isOpen }) => {
    const [animationData, setAnimationData] = useState(null);

    useEffect(() => {
        if (isOpen) {
            // Animation de cœurs et paillettes
            fetch('https://lottie.host/7906d4e1-2283-4a37-b769-d3e921d72379/c1LIno8w8h.json')
                .then(res => res.json())
                .then(data => setAnimationData(data))
                .catch(err => console.error("Lottie loading failed", err));
        }
    }, [isOpen]);

    if (!isOpen || !animationData) return null;

    return (
        <div className="fixed inset-0 z-1000 pointer-events-none flex items-center justify-center">
            <div className="w-full h-full max-w-4xl max-h-4xl">
                <Lottie
                    animationData={animationData}
                    loop={false}
                    onComplete={() => { }} // On pourrait fermer ici mais on gère par le parent
                />
            </div>
        </div>
    );
};

const DonationModal = ({ isOpen, onClose, data }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-md bg-white rounded-4xl p-4 shadow-3xl space-y-8 overflow-hidden max-h-[90vh] flex flex-col"
                data-lenis-prevent
            >
                {/* Decorative element */}
                <div className="absolute -bottom-8 -left-8 w-32 h-32 opacity-10 blur-2xl" style={{ backgroundColor: 'var(--secondary)' }}></div>

                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-800 transition-colors bg-stone-50 rounded-full">
                    <X size={20} />
                </button>

                <div className=' flex-1 overflow-y-auto pr-2 custom-scrollbar -mr-2'>
                    <div className="text-center space-y-4 mb-4">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl" style={{ color: 'var(--primary)', backgroundColor: 'var(--bg-soft)' }}>
                            <Gift size={36} />
                        </div>
                        <h3 className="text-3xl font-serif" style={{ fontFamily: 'var(--font-main)', color: 'var(--primary)' }}>{data?.title || 'Cadeaux & Intentions'}</h3>
                        <p className="text-stone-500 leading-relaxed text-sm">{data?.description}</p>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {data?.items?.map((item, idx) => (
                            <div key={idx} className="p-6 border border-stone-100 rounded-3xl bg-stone-50/50 space-y-3">
                                <div className="flex items-center gap-3 text-stone-800 font-bold mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm" style={{ color: 'var(--primary)' }}>
                                        {idx === 0 ? <Landmark size={20} /> : <Archive size={20} />}
                                    </div>
                                    <span>{item.title}</span>
                                </div>
                                <p className="text-stone-500 text-sm leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 text-center">
                        <p className="text-[10px] text-stone-400 uppercase tracking-[0.3em] font-bold italic">"Votre présence est notre plus beau cadeau"</p>
                    </div>
                </div>

            </motion.div>
        </div>
    );
};

const CelebrationHearts = () => {
    // Différentes formes de cœurs pour l'effet "paillettes"
    const heartPaths = [
        "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z", // Classique
        "M12 21.5l-1.45-1.32C5.4 15.36 2 12.27 2 8.5 2 5.41 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.41 22 8.5c0 3.77-3.4 6.86-8.55 11.53L12 21.5z", // Un peu plus allongé
        "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" // Répété pour la variété de taille
    ];

    return (
        <div className="fixed inset-0 pointer-events-none z-1000 overflow-hidden">
            {[...Array(25)].map((_, i) => {
                const color = i % 3 === 0 ? 'var(--primary)' : i % 3 === 1 ? 'var(--secondary)' : '#ff4d4d';
                const size = Math.random() * 30 + 15;
                const path = heartPaths[Math.floor(Math.random() * heartPaths.length)];

                return (
                    <motion.div
                        key={i}
                        initial={{
                            y: '110vh',
                            x: `${Math.random() * 100}vw`,
                            opacity: 0,
                            scale: 0,
                            rotate: Math.random() * 360
                        }}
                        animate={{
                            y: '-10vh',
                            x: `${(Math.random() * 100)}vw`,
                            rotate: Math.random() * 720,
                            opacity: [0, 1, 1, 0],
                            scale: [0, 1, 1, 0.5]
                        }}
                        transition={{
                            duration: 4 + Math.random() * 4,
                            ease: "easeOut",
                            delay: Math.random() * 2
                        }}
                        className="absolute"
                        style={{ width: size, height: size }}
                    >
                        <svg viewBox="0 0 24 24" width="100%" height="100%">
                            <path
                                d={path}
                                fill={color}
                                className="drop-shadow-sm"
                            />
                        </svg>
                    </motion.div>
                );
            })}
        </div>
    );
};

const SadRain = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-1000 overflow-hidden">
            {[...Array(20)].map((_, i) => {
                const Icon = i % 2 === 0 ? HeartCrack : Frown;
                const size = Math.random() * 20 + 20;
                const color = i % 2 === 0 ? 'var(--secondary)' : '#94a3b8'; // Mélange couleur secondaire et un bleu gris doux

                return (
                    <motion.div
                        key={i}
                        initial={{
                            y: '-10vh',
                            x: `${Math.random() * 100}vw`,
                            opacity: 0,
                            rotate: 0
                        }}
                        animate={{
                            y: '110vh',
                            rotate: i % 2 === 0 ? 30 : -30,
                            opacity: [0, 1, 1, 0]
                        }}
                        transition={{
                            duration: 5 + Math.random() * 3,
                            ease: "linear",
                            delay: Math.random() * 2
                        }}
                        className="absolute"
                        style={{ color: color }}
                    >
                        <Icon size={size} strokeWidth={1.5} fill={i % 3 === 0 ? "currentColor" : "none"} className="opacity-60" />
                    </motion.div>
                );
            })}
        </div>
    );
};

const InvitationPage = () => {
    const { slug } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
    const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
    const [isGuestbookModalOpen, setIsGuestbookModalOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); // No customization modal here
    const [rsvpStatus, setRsvpStatus] = useState(null); // null, 'confirmed', 'declined'
    const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);
    const [direction, setDirection] = useState(0); // -1 for left, 1 for right
    const [scrolled, setScrolled] = useState(false);
    const [isCelebrating, setIsCelebrating] = useState(false);
    const [isOpened, setIsOpened] = useState(false);

    // Variantes pour l'effet de cascade (stagged reveal)
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                duration: 0.8,
                ease: "easeOut"
            }
        }
    };

    const itemVariants = {
        hidden: {
            opacity: 0,
            y: 60,
            scale: 0.9,
            filter: 'blur(10px)'
        },
        show: {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
            transition: {
                duration: 1.4,
                ease: [0.16, 1, 0.3, 1]
            }
        }
    };

    // Auth & Data states
    const [guest, setGuest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const triggerCelebration = () => {
        setIsCelebrating(true);
        setTimeout(() => setIsCelebrating(false), 4000);
    };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 100);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const [activeSection, setActiveSection] = useState('accueil');
    const [showSparkles, setShowSparkles] = useState(false);

    useEffect(() => {
        if (isOpened) {
            setShowSparkles(true);
            const timer = setTimeout(() => setShowSparkles(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpened]);
    const isManualScroll = useRef(false);

    const [isDownloading, setIsDownloading] = useState(false);
    const audioRef = useRef(null);
    const [isMuted, setIsMuted] = useState(false);

    // Background Music Logic
    useEffect(() => {
        if (isOpened && !audioRef.current) {
            // Stop if music is globally disabled
            if (!musicEnabled) return;

            const songs = eventData?.songs || eventData?.customization?.songs || [];
            const activeSong = songs.find(s => s.is_active);

            // If library has songs but none are active, and music is enabled, 
            // it means we should play the default music OR if the user picks one.
            // Wait, if library has songs but none is active, we should probably still play default if they didn't disable it globally?
            // Actually, usually picking one song replaces the default.
            // If they have songs but none is active, let's play the default.

            const musicSource = activeSong ? activeSong.url : invitationMusic;

            const audio = new Audio(musicSource);
            audio.crossOrigin = "anonymous";
            audio.loop = true;
            audio.volume = 0;
            audioRef.current = audio;

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    const targetVolume = 0.4;
                    const duration = 4000;
                    const steps = 40;
                    const interval = duration / steps;
                    const increment = targetVolume / steps;

                    let currentStep = 0;
                    const fadeInterval = setInterval(() => {
                        currentStep++;
                        if (audioRef.current) {
                            audioRef.current.volume = Math.min(increment * currentStep, targetVolume);
                        }
                        if (currentStep >= steps) clearInterval(fadeInterval);
                    }, interval);
                }).catch(err => console.log("Playback interaction required", err));
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [isOpened]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    const downloadQRCode = () => {
        setIsDownloading(true);
        const svg = document.querySelector('#rsvp-qr-code svg');
        if (!svg) {
            setIsDownloading(false);
            return;
        }

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            // High quality scaling
            const scale = 4;
            canvas.width = (img.width + 80) * scale;
            canvas.height = (img.height + 120) * scale;
            ctx.scale(scale, scale);

            // Background with rounded corners (simulated)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale);

            // Draw QR Code
            ctx.drawImage(img, 40, 40);

            // Add Text
            let displayName = formattedName.toUpperCase();

            ctx.fillStyle = '#1c1917'; // stone-900
            ctx.font = 'bold 16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(displayName, (img.width + 80) / 2, img.height + 70);

            ctx.font = '12px Inter, sans-serif';
            ctx.fillStyle = '#78716c'; // stone-500
            ctx.fillText('INVITATION DIGITALE', (img.width + 80) / 2, img.height + 95);

            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `Pass-Invitation-${guestName.replace(/\s+/g, '-')}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
            setIsDownloading(false);
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    // Get real guest data from state
    const getTableInfo = () => {
        if (!guest) {
            return {
                tableName: "Table non assignée",
                seat: "N/A",
                others: []
            };
        }

        // Use the joined table name if table_id is set, otherwise fallback to the old table_number
        const tableName = guest.table ? guest.table.name : (guest.table_number || "Général");
        const seat = guest.seat_number ? `Place ${guest.seat_number}` : "Place libre";

        return {
            tableName,
            seat,
            others: guest.table?.guests?.filter(g => g.id !== guest.id).map(g => {
                const names = g.name.trim().split(' ');
                const lastName = names[names.length - 1];

                if (g.guest_count === 2) {
                    return `Couple ${lastName}`;
                }
                if (g.guest_count > 2) {
                    return `Famille ${lastName}`;
                }

                if (names.length > 1) {
                    return `${names[0]} ${lastName[0]}.`;
                }
                return g.name;
            }) || []
        };
    };

    const navItems = [
        { label: 'Accueil', href: '#accueil', icon: Heart },
        { label: 'Intro', href: '#intro', icon: Quote },
        { label: 'Cérémonies', href: '#ceremonies', icon: MapPin },
        { label: 'Programme', href: '#programme', icon: Calendar },
        { label: 'RSVP', href: '#rsvp', icon: Send },
        { label: 'Personnaliser', href: '#personnaliser', icon: Music },
        { label: 'Galerie', href: '#galerie', icon: Camera },
        { label: 'Liste', href: '#liste', icon: Gift }
    ];

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            // On cherche la section la plus visible à l'écran
            entries.forEach(entry => {
                if (entry.isIntersecting && !isManualScroll.current) {
                    // On ne change que si la section est suffisamment visible
                    if (entry.intersectionRatio >= 0.2) {
                        setActiveSection(entry.target.id);
                    }
                }
            });
        }, {
            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
            rootMargin: '-15% 0px -15% 0px'
        });

        navItems.forEach(item => {
            const el = document.getElementById(item.href.replace('#', ''));
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [navItems]);

    const [showAnimation, setShowAnimation] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [eventData, setEventData] = useState(null);
    const musicEnabled = (eventData?.music_enabled ?? eventData?.customization?.music_enabled) !== false;
    const [notification, setNotification] = useState({
        isOpen: false, title: '', message: '', type: 'info', onConfirm: null, showCancel: false
    });

    useEffect(() => {
        fetchData();
    }, [slug, token]);

    useEffect(() => {
        if (token && isOpened) {
            checkNotifications();
            // Demander la permission pour les notifs navigateur
            if ("Notification" in window && Notification.permission === "default") {
                Notification.requestPermission();
            }
        }
    }, [token, isOpened]);

    const checkNotifications = async () => {
        try {
            const res = await guestService.getNotifications(token);
            if (res.data && res.data.length > 0) {
                res.data.forEach(notif => {
                    // 1. Notification Native du navigateur (si permise)
                    if ("Notification" in window && Notification.permission === "granted") {
                        new Notification(notif.title, {
                            body: notif.message,
                            icon: '/favicon.ico'
                        });
                    }

                    // 2. Notification In-App (Toast)
                    toast.info(notif.title, {
                        description: notif.message,
                        duration: 10000,
                    });
                });
            }
        } catch (err) {
            console.error("Erreur lors de la récupération des notifications", err);
        }
    };

    const fetchData = async () => {
        try {
            if (token) {
                const guestRes = await guestService.get(token);
                setGuest(guestRes.data);

                if (guestRes.data.event && guestRes.data.event.customization) {
                    setEventData(guestRes.data.event.customization);
                } else if (guestRes.data.event) {
                    setEventData({ ...guestRes.data.event });
                }

                setRsvpStatus(guestRes.data.status === 'pending' ? null : guestRes.data.status);
            } else if (slug) {
                const eventRes = await eventService.get(slug);
                if (eventRes.data.customization) {
                    setEventData(eventRes.data.customization);
                } else {
                    setEventData(eventRes.data);
                }
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'L\'invitation est introuvable ou a expiré.');
        } finally {
            setLoading(false);
        }
    };

    const refreshData = async () => {
        if (token) {
            try {
                const guestRes = await guestService.get(token);
                setGuest(guestRes.data);
            } catch (err) {
                console.error("Could not refresh guest data", err);
            }
        }
    };

    useEffect(() => {
        if (eventData) {
            // Priority: eventData.hosts > (bride & groom) > Default
            let coupleNames = eventData.hosts;
            if (!coupleNames) {
                const bride = eventData.bride || 'Mariée';
                const groom = eventData.groom || 'Marié';
                coupleNames = `${bride} & ${groom}`;
            }

            // Final Title Priority: Guest Name > Couple Names
            const title = guest?.name
                ? `Invitation de ${guest.name} | Eventflow`
                : `Invitation de ${coupleNames} | Eventflow`;

            document.title = title;

            // Update Meta Tags dynamically for social sharing (WhatsApp/FB)
            const updateMeta = (property, content, attr = 'property') => {
                if (!content) return;
                let meta = document.querySelector(`meta[${attr}="${property}"]`);
                if (!meta) {
                    meta = document.createElement('meta');
                    meta.setAttribute(attr, property);
                    document.head.appendChild(meta);
                }
                meta.setAttribute('content', content);
            };

            // On force le JPG et l'URL absolue pour le partage social
            const socialImage = (eventData.couplePhoto || "").replace('.webp', '.jpg');
            const absoluteSocialImage = socialImage.startsWith('http') 
                ? socialImage 
                : `${window.location.origin}${socialImage}`;

            updateMeta('og:title', title);
            updateMeta('og:image', absoluteSocialImage);
            updateMeta('og:description', eventData.intro?.text || "Nous sommes ravis de vous inviter à célébrer notre union.");
            updateMeta('twitter:title', title, 'name');
            updateMeta('twitter:image', absoluteSocialImage, 'name');
        }
    }, [eventData, guest]);

    const handleRSVP = async (status) => {
        try {
            let targetStatus;
            if (status === 'yes') targetStatus = 'confirmed';
            else if (status === 'no') targetStatus = 'declined';
            else targetStatus = 'pending';

            if (token) {
                const targetSlug = slug || (guest?.event?.slug);
                if (targetSlug) {
                    await eventService.rsvp(targetSlug, {
                        guest_token: token,
                        guest_name: guestName,
                        response: targetStatus,
                        message: ''
                    });
                }
            }

            setRsvpStatus(targetStatus === 'pending' ? null : targetStatus);

            if (targetStatus === 'pending') {
                toast.success("Statut réinitialisé", {
                    description: "Vous pouvez maintenant modifier votre réponse."
                });
                return;
            }

            setShowAnimation(true);
            if (targetStatus === 'confirmed') {
                triggerCelebration();
                setTimeout(() => setShowAnimation(false), 6000);
            } else {
                setTimeout(() => setShowAnimation(false), 5000);
            }
        } catch (err) {
            console.error("Could not send RSVP", err);
            toast.error("Oups !", {
                description: "Une erreur est survenue lors de l'enregistrement de votre réponse. Veuillez réessayer.",
            });
        }
    };

    useEffect(() => {
        const calculateTimeLeft = () => {
            if (!eventData?.date) return;
            const difference = +new Date(eventData.date) - +new Date();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            }
        };
        const timer = setInterval(calculateTimeLeft, 1000);
        calculateTimeLeft();
        return () => clearInterval(timer);
    }, [eventData?.date]);

    useEffect(() => {
        const families = {
            'Script': ['Great Vibes', 'Dancing Script', 'Alex Brush', 'Pinyon Script', 'Parisienne', 'Rochester', 'Allura', 'Sacramento', 'Arizonia', 'Tangerine', 'Mrs Saint Delafield'],
            'Serif': ['Playfair Display', 'Cinzel', 'Cormorant Garamond', 'Bodoni Moda', 'EB Garamond', 'Spectral', 'Playfair'],
            'Sans': ['Outfit', 'Montserrat', 'Quicksand', 'Josefin Sans', 'Tenor Sans']
        };
        const fontList = Object.values(families).flat().map(f => `family=${f.replace(/ /g, '+')}`).join('&');
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?${fontList}&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => {
            if (document.head.contains(link)) document.head.removeChild(link);
        };
    }, []);

    const themeStyles = {
        '--primary': eventData?.palette?.colors[0] || '#7a404a',
        '--secondary': eventData?.palette?.colors[1] || '#a67c85',
        '--bg-soft': eventData?.palette?.colors[2] || '#fff9fa',
        '--font-main': `"${eventData?.selectedFont}", serif`
    };

    const guestName = guest ? guest.name : 'Aperçu Invité';
    const formattedName = (() => {
        if (!guest) return guestName;
        const names = guestName.trim().split(' ');
        const lastName = names[names.length - 1];

        if (guest.guest_count === 2) {
            return `M. & Mme ${lastName}`;
        }
        if (guest.guest_count > 2) {
            return `Famille ${lastName}`;
        }
        return guestName;
    })();

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center font-serif">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative"
                >
                    <div className="w-24 h-24 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin" />
                    <Heart className="absolute inset-0 m-auto text-stone-300 animate-pulse" size={24} />
                </motion.div>
                <p className="mt-8 text-stone-400 font-medium tracking-widest uppercase text-[10px]">Chargement de votre invitation...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mb-6 font-serif">
                    <X size={32} />
                </div>
                <h1 className="text-2xl font-serif text-stone-800 mb-2">Oups !</h1>
                <p className="text-stone-500 font-medium max-w-xs">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="mt-8 rounded-2xl">Réessayer</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-50 overflow-x-hidden selection:bg-amber-100" style={themeStyles}>
            {/* Global Page Decorations (REMOVED: Moved to Intro section) */}

            <AnimatePresence mode="wait">
                {!isOpened ? (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0, y: -100 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="fixed inset-0 z-500 bg-white flex flex-col items-center justify-center px-8 overflow-hidden"
                    >
                        {/* Decorative Background Elements - Same as Intro selection */}
                        {eventData?.decoration && eventData.decoration !== 'none' && decorationMap[eventData.decoration] && (
                            <>
                                <motion.img
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 0.4, scale: 1 }}
                                    transition={{ duration: 1.5, delay: 0.2 }}
                                    src={decorationMap[eventData.decoration]}
                                    className="absolute bottom-10 left-0 w-[100px] md:w-[300px] pointer-events-none"
                                />
                                <motion.img
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 0.4, scale: 1 }}
                                    transition={{ duration: 1.5, delay: 0.4 }}
                                    src={decorationMap[eventData.decoration]}
                                    className="absolute bottom-10 right-0 w-[100px] md:w-[300px] pointer-events-none scale-x-[-1]"
                                />
                            </>
                        )}

                        {/* Content */}
                        <div className="text-center space-y-12 relative z-10 max-w-2xl">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1, delay: 0.6 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-center gap-4 mb-2">
                                    <div className="h-px w-8 bg-stone-200" />
                                    <Heart className="text-stone-300" size={16} fill="currentColor" />
                                    <div className="h-px w-8 bg-stone-200" />
                                </div>
                                <p className="text-stone-400 font-medium tracking-[0.3em] uppercase text-[10px]">
                                    {guest?.guest_count === 2 ? "Invitation de Couple Spéciale Pour" :
                                        guest?.guest_count > 2 ? "Invitation Familiale Spéciale Pour" :
                                            "Invitation Spéciale Pour"}
                                </p>
                            </motion.div>

                            <motion.h1
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 1.2, delay: 0.8 }}
                                className="text-5xl md:text-8xl font-serif tracking-tight"
                                style={{ color: 'var(--primary)', fontFamily: 'var(--font-main)' }}
                            >
                                {formattedName}
                            </motion.h1>

                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 1, delay: 1 }}
                                className="pt-8"
                            >
                                <button
                                    onClick={() => setIsOpened(true)}
                                    className="group relative px-12 py-5 rounded-full overflow-hidden transition-all duration-500 active:scale-95"
                                    style={{ backgroundColor: 'var(--primary)' }}
                                >
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    <div className="flex items-center gap-3 text-white font-bold text-sm relative z-10">
                                        <span>Ouvrir l'Invitation</span>
                                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </button>
                                <p className="mt-6 text-stone-800 font-serif italic text-sm">Cliquez pour découvrir les détails de l'événement</p>
                            </motion.div>
                        </div>

                        {/* Particle Decorative Dots */}
                        <div className="absolute inset-0 pointer-events-none">
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
                                    transition={{ duration: 4 + i, repeat: Infinity, delay: i }}
                                    className="absolute w-2 h-2 rounded-full bg-stone-100"
                                    style={{
                                        top: `${Math.random() * 100}%`,
                                        left: `${Math.random() * 100}%`
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="relative"
                    >
                        {/* 1. Staggered Navigation */}
                        {/* Sparkles effect on open */}
                        <AnimatePresence>
                            {showSparkles && (
                                <div className="fixed inset-0 z-1000 pointer-events-none">
                                    {[...Array(50)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{
                                                top: '50%',
                                                left: '50%',
                                                opacity: 1,
                                                scale: 0,
                                                rotate: 0
                                            }}
                                            animate={{
                                                top: `${Math.random() * 100}%`,
                                                left: `${Math.random() * 100}%`,
                                                opacity: 0,
                                                scale: Math.random() * 1.5 + 0.5,
                                                rotate: 360
                                            }}
                                            transition={{
                                                duration: Math.random() * 2 + 1,
                                                ease: "easeOut"
                                            }}
                                            className="absolute"
                                            style={{ color: 'var(--primary)' }}
                                        >
                                            <Sparkles size={Math.random() * 15 + 5} fill="currentColor" />
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Premium Smart Navigation Desktop only (Left Side) */}
                        <motion.nav
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: scrolled ? 1 : 0 }}
                            className={cn(
                                "fixed left-4 md:left-8 top-1/2 -translate-y-1/2 z-100 hidden md:block transition-opacity duration-300",
                                !scrolled && "pointer-events-none"
                            )}
                        >
                            <div className="bg-stone-900/30 backdrop-blur-2xl border border-white/10 p-2 rounded-3xl shadow-2xl flex flex-col gap-1 relative">
                                {navItems.map((item) => {
                                    const isActive = activeSection === item.href.replace('#', '');
                                    return (
                                        <a
                                            key={item.href}
                                            href={item.href}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const targetId = item.href.replace('#', '');
                                                isManualScroll.current = true;
                                                setActiveSection(targetId);

                                                const element = document.getElementById(targetId);
                                                if (element) {
                                                    element.scrollIntoView({ behavior: 'smooth' });
                                                }

                                                setTimeout(() => {
                                                    isManualScroll.current = false;
                                                }, 1000);
                                            }}
                                            className={cn(
                                                "relative z-10 flex items-center px-4 py-3.5 rounded-2xl transition-all duration-500 group",
                                                isActive ? "text-white" : "text-white/40 hover:text-white/70"
                                            )}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="nav-active-bg"
                                                    className="absolute inset-0 bg-white/10 border border-white/20 rounded-2xl -z-10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                />
                                            )}
                                            <item.icon size={20} className={cn("shrink-0 transition-transform duration-500", isActive && "scale-110")} />
                                            <span className="text-[13px] font-medium hidden lg:block overflow-hidden max-w-0 group-hover:max-w-[150px] group-hover:ml-3 transition-all duration-700 ease-in-out whitespace-nowrap">
                                                {item.label}
                                            </span>
                                        </a>
                                    );
                                })}
                            </div>
                        </motion.nav>

                        {/* Floating Audio Toggle */}
                        {musicEnabled && (
                            <motion.button
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsMuted(!isMuted)}
                                className="fixed bottom-6 right-6 z-100 w-14 h-14 bg-stone-900/40 backdrop-blur-xl rounded-full flex items-center justify-center text-white shadow-2xl transition-all hover:bg-stone-900/60"
                            >
                                {/* Dynamic Pulse Visual */}
                                {!isMuted && isOpened && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ scale: 1, opacity: 0.5 }}
                                                animate={{ scale: 1.8, opacity: 0 }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    delay: i * 0.6,
                                                    ease: "easeOut"
                                                }}
                                                className="absolute inset-0 bg-white/30 rounded-full"
                                            />
                                        ))}
                                    </div>
                                )}
                                <motion.div
                                    animate={isMuted ? { scale: [1, 0.8, 1] } : { scale: [1, 1.1, 1] }}
                                    transition={{ duration: 0.3 }}
                                    className="relative z-10"
                                >
                                    {isMuted ? (
                                        <VolumeX size={22} className="text-white/80" />
                                    ) : (
                                        <div className="flex items-center gap-[3px] h-5 px-1">
                                            {[0.8, 1.2, 0.9, 1.4, 1.0].map((duration, i) => (
                                                <motion.div
                                                    key={i}
                                                    animate={{
                                                        height: ["30%", "100%", "30%"]
                                                    }}
                                                    transition={{
                                                        duration: duration,
                                                        repeat: Infinity,
                                                        ease: "easeInOut"
                                                    }}
                                                    className="w-[2px] bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            </motion.button>
                        )}

                        <DonationModal isOpen={isDonationModalOpen} onClose={() => setIsDonationModalOpen(false)} data={eventData.gifts} />

                        <CelebrationLottie isOpen={isCelebrating} />

                        <AnimatePresence>
                            {/* On garde CelebrationHearts pour un effet de fond continu si besoin, ou on peut le combiner */}
                            {showAnimation && rsvpStatus === 'confirmed' && (
                                <>
                                    <CelebrationHearts />
                                </>
                            )}
                            {showAnimation && rsvpStatus === 'declined' && <SadRain />}
                        </AnimatePresence>

                        {/* 2. Staggered Hero */}
                        <motion.div variants={itemVariants}>
                            <HeroWedding data={eventData} />
                        </motion.div>

                        {/* 3. Staggered Separator */}
                        {/* Wave Separator with Hearts */}
                        <div className="relative h-32 md:h-48 -mt-24 md:-mt-32 z-20 pointer-events-none">
                            <div className="absolute inset-0 overflow-hidden">
                                <svg
                                    viewBox="0 0 1440 320"
                                    className="absolute bottom-0 w-full h-full scale-x-110"
                                    preserveAspectRatio="none"
                                >
                                    <defs>
                                        <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.03" />
                                            <stop offset="50%" stopColor="var(--secondary)" stopOpacity="0.08" />
                                            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.03" />
                                        </linearGradient>
                                        <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.05" />
                                            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.1" />
                                            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.05" />
                                        </linearGradient>
                                    </defs>

                                    {/* Layer 1: Soft Background Wave */}
                                    <motion.path
                                        initial={{ x: -10 }}
                                        animate={{ x: [-10, 10, -10] }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                                        d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,218.7C960,235,1056,213,1152,192C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                                        fill="url(#wave-gradient-1)"
                                    />

                                    {/* Layer 2: Middle Accent Wave */}
                                    <motion.path
                                        initial={{ x: 10 }}
                                        animate={{ x: [10, -10, 10] }}
                                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                                        d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,229.3C960,213,1056,171,1152,138.7C1248,107,1344,85,1392,74.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                                        fill="url(#wave-gradient-2)"
                                    />

                                    {/* Layer 3: Main Solid Wave with subtle shadow */}
                                    <path
                                        d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                                        fill="var(--bg-soft)"
                                        style={{ filter: 'drop-shadow(0px -5px 10px rgba(0,0,0,0.02))' }}
                                    />

                                    {/* Decorative Line on top of the wave */}
                                    <path
                                        d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160"
                                        fill="none"
                                        stroke="var(--primary)"
                                        strokeWidth="0.5"
                                        strokeOpacity="0.1"
                                    />
                                </svg>
                            </div>

                            {/* Floating Hearts Divider */}
                            <div className="absolute inset-0 flex items-center justify-center gap-6 md:gap-12 px-4 overflow-hidden">
                                {[...Array(7)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: 0, opacity: 0 }}
                                        whileInView={{ y: [-12, 12, -12], opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
                                        transition={{
                                            duration: 4 + (i % 4),
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: i * 0.2
                                        }}
                                        className="text-primary"
                                    >
                                        <div className="relative">
                                            <Heart
                                                size={16 + (i % 4) * 5}
                                                fill={i % 2 === 0 ? "currentColor" : "none"}
                                                strokeWidth={1}
                                                className="drop-shadow-md opacity-60"
                                            />
                                            {i % 3 === 0 && (
                                                <motion.div
                                                    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="absolute inset-0 bg-secondary rounded-full blur-md -z-10"
                                                />
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Staggered Introduction */}
                        {/* Introduction & Countdown */}
                        <section id='intro' className="py-24 md:py-32 px-4 relative overflow-hidden" style={{ backgroundColor: 'var(--bg-soft)' }}>

                            {/* Intro Decoration: Bottom corners (left original, right flipped) */}
                            {eventData?.decoration && eventData.decoration !== 'none' && decorationMap[eventData.decoration] && (
                                <>
                                    <motion.img
                                        src={decorationMap[eventData.decoration]}
                                        alt="fleur decorative"
                                        className="absolute top-0 lg:bottom-0 left-0 w-[270px] md:w-[380px] z-0 opacity-300 pointer-events-none transition-all duration-1000"
                                        initial={{ opacity: 0, x: -50, y: 50 }}
                                        whileInView={{ opacity: 0.3, x: 0, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                    <motion.img
                                        src={decorationMap[eventData.decoration]}
                                        alt="fleur decorative"
                                        className="hidden md:block absolute top-0 lg:bottom-0 right-0 w-[270px] md:w-[380px] z-0 opacity-300 pointer-events-none scale-x-[-1] transition-all duration-1000"
                                        initial={{ opacity: 0, x: 50, y: 50 }}
                                        whileInView={{ opacity: 0.3, x: 0, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                    />
                                </>
                            )}

                            {/* Subtle background decoration */}
                            {/* <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/30 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" /> */}

                            <div className="max-w-4xl mx-auto space-y-20 relative z-10">
                                <div className="text-center space-y-6">
                                    <motion.span
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        className="font-bold tracking-[0.4em] uppercase text-xs"
                                        style={{ color: 'var(--primary)' }}
                                    >
                                        Compte à rebours
                                    </motion.span>
                                    <h2 className="text-4xl md:text-6xl font-serif" style={{ fontFamily: 'var(--font-main)', color: 'var(--primary)' }}>
                                        {eventData.intro?.title}
                                    </h2>
                                    <div className="w-16 h-px bg-stone-300 mx-auto" />
                                    <p className="text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto italic font-serif">
                                        {eventData.intro?.text}
                                    </p>
                                </div>

                                {/* Premium Countdown Timer */}
                                <div className="grid grid-cols-2 md:grid-cols-4 max-w-2xl mx-auto">
                                    {[
                                        { label: 'Jours', value: timeLeft.days },
                                        { label: 'Heures', value: timeLeft.hours },
                                        { label: 'Minutes', value: timeLeft.minutes },
                                        { label: 'Secondes', value: timeLeft.seconds }
                                    ].map((unit, idx) => (
                                        <motion.div
                                            key={unit.label}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.1 * idx }}
                                            className="relative group border-r even:border-r-0 md:even:border-r md:last:border-0!"
                                            style={{ borderColor: 'var(--secondary)', opacity: 0.4 }}
                                        >
                                            <div className="flex flex-col items-center pb-10">
                                                <motion.span
                                                    key={unit.value}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="text-3xl md:text-5xl font-serif"
                                                    style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--primary)' }}
                                                >
                                                    {unit.value.toString().padStart(2, '0')}
                                                </motion.span>
                                                <div className="w-6 h-px my-4" style={{ backgroundColor: 'var(--secondary)', opacity: 0.3 }} />
                                                <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-stone-700">
                                                    {unit.label}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Wave Separator: Intro -> Ceremonies */}
                        <div className="relative h-32 md:h-48 -mt-24 md:-mt-32 z-20 pointer-events-none">
                            <div className="absolute inset-0 overflow-hidden">
                                <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full scale-x-110" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="grad-intro-ceremony" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.05" />
                                            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.05" />
                                        </linearGradient>
                                    </defs>
                                    <path d="M0,160L60,170.7C120,181,240,203,360,192C480,181,600,139,720,133.3C840,128,960,160,1080,170.7C1200,181,1320,171,1380,165.3L1440,160L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" fill="url(#grad-intro-ceremony)" />
                                    <motion.path
                                        animate={{ x: [0, 20, 0] }}
                                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                                        d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,218.7C840,235,960,245,1080,229.3C1200,213,1320,171,1380,149.3L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
                                        fill="white" opacity="0.4"
                                    />
                                    <path d="M0,288L60,272C120,256,240,224,360,197.3C480,171,600,149,720,165.3C840,181,960,235,1080,250.7C1200,267,1320,245,1380,234.7L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" fill="white" />
                                </svg>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center gap-12 opacity-30">
                                {[Array(5)].map((_, i) => (
                                    <motion.div key={i} animate={{ y: [0, -10, 0] }} transition={{ duration: 3 + i, repeat: Infinity }}>
                                        <Heart size={20 + i * 4} className="text-primary" />
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* 5. Staggered Ceremonies */}
                        <section id="ceremonies" className="py-32 px-4 bg-white relative">
                            <div className="max-w-6xl mx-auto space-y-24">
                                <div className="text-center space-y-4">
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        className="font-bold tracking-[0.4em] uppercase text-xs"
                                        style={{ color: 'var(--primary)' }}
                                    >
                                        Le Programme
                                    </motion.span>
                                    <h2 className="text-5xl md:text-6xl font-serif" style={{ fontFamily: 'var(--font-main)', color: 'var(--primary)' }}>
                                        Les Cérémonies
                                    </h2>
                                </div>

                                {/* Ceremonies Cards */}
                                <div className="grid md:grid-cols-2 gap-12">
                                    {eventData.ceremonies.map((ceremony, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.2 }}
                                            className="group relative bg-white rounded-4xl overflow-hidden border border-stone-100 transition-all duration-700 hover:shadow-2xl hover:shadow-stone-200/50"
                                        >
                                            {/* Image Container */}
                                            <div className='p-2 md:p-4 h-64 md:h-80'>
                                                <div className="relative h-full w-full overflow-hidden rounded-4xl">
                                                    <img
                                                        src={ceremony.image || (idx === 0
                                                            ? "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1000"
                                                            : "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000")}
                                                        alt={ceremony.title}
                                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-linear-to-t from-stone-900/60 via-transparent to-transparent opacity-60" />

                                                    {/* Time Badge */}
                                                    <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
                                                        <Clock size={14} style={{ color: 'var(--primary)' }} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-800">{ceremony.time}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-4 md:p-6 space-y-6">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-2">
                                                        <span className="font-bold tracking-[0.2em] uppercase text-[10px]" style={{ color: 'var(--primary)' }}>Cérémonie 0{idx + 1}</span>
                                                        <h3 className="text-3xl font-serif text-stone-800" style={{ fontFamily: 'var(--font-main)' }}>
                                                            {ceremony.title}
                                                        </h3>
                                                    </div>
                                                </div>

                                                <p className="text-stone-600 leading-relaxed font-serif italic text-lg opacity-80 overflow-hidden line-clamp-3">
                                                    {ceremony.description}
                                                </p>

                                                <div className="flex flex-col gap-6">
                                                    <div className="flex items-start gap-3 border-y border-stone-100 py-6 text-stone-500">
                                                        <div className="p-3 rounded-lg shrink-0" style={{ backgroundColor: 'var(--bg-soft)', color: 'var(--primary)' }}>
                                                            <MapPin size={18} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-xs text-stone-400 uppercase tracking-widest">Lieu & Adresse</p>
                                                            <div className="space-y-0.5">
                                                                <p className="text-base font-bold text-stone-800 leading-tight my-2">{ceremony.venue}</p>
                                                                <p className="text-sm font-medium text-stone-500 leading-snug">{ceremony.address}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {ceremony.mapUrl && (
                                                        <Button
                                                            variant="ghost"
                                                            className="w-full lg:w-fit mx-auto justify-between items-center px-4 h-14 rounded-full text-white hover:scale-[1.05] transition-all group/btn"
                                                            style={{ backgroundColor: 'var(--primary)' }}
                                                            onClick={() => window.open(ceremony.mapUrl, '_blank')}
                                                        >
                                                            <span className="text-[15px] font-medium">Voir l'adresse</span>
                                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover/btn:translate-x-1 transition-transform" style={{ color: 'var(--primary)' }}>
                                                                <ChevronRight size={16} />
                                                            </div>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Wave Separator with Hearts */}
                        <div className="relative h-32 md:h-48 -mt-24 md:-mt-32 z-20 pointer-events-none">
                            <div className="absolute inset-0 overflow-hidden">
                                <svg
                                    viewBox="0 0 1440 320"
                                    className="absolute bottom-0 w-full h-full scale-x-110"
                                    preserveAspectRatio="none"
                                >
                                    <defs>
                                        <linearGradient id="wave-gradient-1" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.03" />
                                            <stop offset="50%" stopColor="var(--secondary)" stopOpacity="0.08" />
                                            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.03" />
                                        </linearGradient>
                                        <linearGradient id="wave-gradient-2" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="var(--secondary)" stopOpacity="0.05" />
                                            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.1" />
                                            <stop offset="100%" stopColor="var(--secondary)" stopOpacity="0.05" />
                                        </linearGradient>
                                    </defs>

                                    {/* Layer 1: Soft Background Wave */}
                                    <motion.path
                                        initial={{ x: -10 }}
                                        animate={{ x: [-10, 10, -10] }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                                        d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,218.7C960,235,1056,213,1152,192C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                                        fill="url(#wave-gradient-1)"
                                    />

                                    {/* Layer 2: Middle Accent Wave */}
                                    <motion.path
                                        initial={{ x: 10 }}
                                        animate={{ x: [10, -10, 10] }}
                                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                                        d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,229.3C960,213,1056,171,1152,138.7C1248,107,1344,85,1392,74.7L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                                        fill="url(#wave-gradient-2)"
                                    />

                                    {/* Layer 3: Main Solid Wave with subtle shadow */}
                                    <path
                                        d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                                        fill="white"
                                        style={{ filter: 'drop-shadow(0px -5px 10px rgba(0,0,0,0.02))' }}
                                    />

                                    {/* Decorative Line on top of the wave */}
                                    <path
                                        d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160"
                                        fill="none"
                                        stroke="var(--bg-soft)"
                                        strokeWidth="0.5"
                                        strokeOpacity="0.1"
                                    />
                                </svg>
                            </div>

                            {/* Floating Hearts Divider */}
                            <div className="absolute inset-0 flex items-center justify-center gap-6 md:gap-12 px-4 overflow-hidden">
                                {[...Array(7)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ y: 0, opacity: 0 }}
                                        whileInView={{ y: [-12, 12, -12], opacity: [0.3, 0.7, 0.3], scale: [0.9, 1.1, 0.9] }}
                                        transition={{
                                            duration: 4 + (i % 4),
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: i * 0.2
                                        }}
                                        className="text-primary"
                                    >
                                        <div className="relative">
                                            <Heart
                                                size={16 + (i % 4) * 5}
                                                fill={i % 2 === 0 ? "currentColor" : "none"}
                                                strokeWidth={1}
                                                className="drop-shadow-md opacity-60"
                                            />
                                            {i % 3 === 0 && (
                                                <motion.div
                                                    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className="absolute inset-0 bg-secondary rounded-full blur-md -z-10"
                                                />
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* 6. Staggered Timeline */}
                        <section id="programme" className="py-10 px-4 relative overflow-hidden bg-white">
                            <div className="max-w-5xl mx-auto relative">
                                <div className="text-center mb-32 space-y-4 relative z-10">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        className="flex justify-center mb-6"
                                    >
                                        <div className="relative">
                                            <CalendarCheck className="w-12 h-12" style={{ color: 'var(--primary)' }} fill="var(--bg-soft)" />
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute inset-0"
                                            >
                                                <Heart className="w-12 h-12 blur-sm opacity-50" style={{ color: 'var(--primary)' }} />
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                    <h2 className="text-5xl md:text-8xl font-serif" style={{ fontFamily: 'var(--font-main)', color: 'var(--primary)' }}>
                                        Le Déroulement de notre Mariage
                                    </h2>
                                    <p className="text-stone-400 font-serif italic text-lg max-w-2xl mx-auto">Pour vous donner un aperçu de ce à quoi ressemblera le grand jours, voici un bref aperçu de ce à quoi vous pouvez vous attendre lors de notre Mariage.</p>
                                </div>

                                <div className="relative min-h-[800px] py-12">
                                    {/* The Living Vine - More Organic Trunk with Leaves */}
                                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-16 pointer-events-none">
                                        <svg width="64" height="100%" viewBox="0 0 64 1000" preserveAspectRatio="none" className="h-full">
                                            {/* Glow effect path */}
                                            <motion.path
                                                d="M32 0 C45 200, 19 400, 32 600 C45 800, 19 1000, 32 1200"
                                                stroke="var(--primary)"
                                                strokeWidth="12"
                                                strokeOpacity="0.03"
                                                fill="none"
                                                filter="blur(10px)"
                                            />
                                            {/* Main Vine Path */}
                                            <motion.path
                                                d="M32 0 C45 200, 19 400, 32 600 C45 800, 19 1000, 32 1200"
                                                stroke="var(--secondary)"
                                                strokeWidth="2.5"
                                                fill="none"
                                                strokeLinecap="round"
                                                strokeDasharray="5 5"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                whileInView={{ pathLength: 1, opacity: 0.4 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 4, ease: "easeInOut" }}
                                            />
                                            <motion.path
                                                d="M32 0 C45 200, 19 400, 32 600 C45 800, 19 1000, 32 1200"
                                                stroke="var(--primary)"
                                                strokeWidth="1"
                                                fill="none"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                whileInView={{ pathLength: 1, opacity: 0.15 }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 3, ease: "easeInOut" }}
                                            />

                                            {/* Random Leaves on Vine */}
                                            {[...Array(12)].map((_, i) => {
                                                const isLeftLeaf = i % 2 === 0;
                                                const yPos = i * 100 + 80;
                                                const xPos = 32 + (Math.sin(i * 1.5) * 4);
                                                return (
                                                    <motion.g
                                                        key={i}
                                                        initial={{ scale: 0, opacity: 0, rotate: isLeftLeaf ? -45 : 45 }}
                                                        whileInView={{ scale: 1, opacity: 0.4, rotate: isLeftLeaf ? -20 : 20 }}
                                                        viewport={{ once: true }}
                                                        transition={{ delay: i * 0.2 + 1 }}
                                                        style={{ originX: "32px", originY: `${yPos}px` }}
                                                    >
                                                        <path
                                                            d={isLeftLeaf
                                                                ? `M${xPos} ${yPos} Q${xPos - 15} ${yPos - 10} ${xPos - 20} ${yPos} T${xPos} ${yPos}`
                                                                : `M${xPos} ${yPos} Q${xPos + 15} ${yPos - 10} ${xPos + 20} ${yPos} T${xPos} ${yPos}`
                                                            }
                                                            fill="var(--primary)"
                                                        />
                                                    </motion.g>
                                                );
                                            })}
                                        </svg>
                                    </div>

                                    <div className="space-y-4 md:space-y-0 relative">
                                        {eventData.program.map((item, idx) => {
                                            const isLeft = idx % 2 === 0;
                                            return (
                                                <div key={idx} className={`flex items-center justify-between w-full relative mb-8 md:mb-16 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>

                                                    {/* Event Card / Flower Leaf */}
                                                    <motion.div
                                                        initial={{ opacity: 0, x: isLeft ? -100 : 100, y: 50 }}
                                                        whileInView={{ opacity: 1, x: 0, y: 0 }}
                                                        viewport={{ once: true, margin: "-20px" }}
                                                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: idx * 0.15 }}
                                                        className={`relative w-[46%] md:w-[42%] group z-20`}
                                                    >
                                                        <div className={`
                                                            relative p-4 md:p-8
                                                            bg-white border border-stone-200/50
                                                            transition-all duration-1000
                                                            hover:shadow-[0_25px_60px_-10px_rgba(0,0,0,0.08)]
                                                            hover:-translate-y-3
                                                            group-hover:border-stone-300
                                                            ${isLeft
                                                                ? 'rounded-[3rem_1rem_3.5rem_3rem]'
                                                                : 'rounded-[1rem_3rem_3.5rem_3.5rem]'
                                                            }
                                                        `}
                                                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(20px)' }}
                                                        >
                                                            {/* Interactive Hearts */}
                                                            <Heart
                                                                className={`absolute -top-6 ${isLeft ? '-right-4' : '-left-4'} w-10 h-10 md:w-14 md:h-14 transition-all duration-1000 opacity-20 group-hover:opacity-100 group-hover:-translate-y-2 group-hover:rotate-12`}
                                                                style={{ color: 'var(--primary)' }}
                                                                fill="currentColor"
                                                            />

                                                            <div className="relative space-y-4 md:space-y-6">
                                                                <div className="flex items-center gap-2 md:gap-4">
                                                                    <div
                                                                        className="px-3 py-1 md:px-4 md:py-1.5 rounded-full text-xs md:text-base font-serif italic relative border"
                                                                        style={{
                                                                            color: 'var(--primary)',
                                                                            borderColor: 'var(--secondary)',
                                                                            backgroundColor: 'white'
                                                                        }}
                                                                    >
                                                                        {item.time}
                                                                        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-secondary animate-pulse" />
                                                                    </div>
                                                                    <div className="h-px w-4 md:w-8 bg-secondary opacity-30" />
                                                                </div>

                                                                <div className="space-y-2 md:space-y-3">
                                                                    <h4 className="text-base md:text-2xl font-serif text-stone-800 leading-tight tracking-tight">
                                                                        {item.title}
                                                                    </h4>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Organic Stem Connection */}
                                                        <div className={`absolute top-1/2 -translate-y-1/2 w-32 md:w-40 h-24 pointer-events-none flex items-center ${isLeft ? 'left-full' : 'right-full justify-end'}`}>
                                                            <svg width="160" height="96" viewBox="0 0 160 96" className={isLeft ? "" : "scale-x-[-1]"}>
                                                                <motion.path
                                                                    d="M0 48 C40 48, 80 20, 140 48"
                                                                    stroke="var(--secondary)"
                                                                    strokeWidth="2.5"
                                                                    fill="none"
                                                                    strokeLinecap="round"
                                                                    strokeDasharray="4 4"
                                                                    initial={{ pathLength: 0 }}
                                                                    whileInView={{ pathLength: 1 }}
                                                                    viewport={{ once: true }}
                                                                    transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
                                                                />

                                                                {/* Glowing Connection Point */}
                                                                <motion.g
                                                                    initial={{ scale: 0, opacity: 0 }}
                                                                    whileInView={{ scale: 1, opacity: 1 }}
                                                                    viewport={{ once: true }}
                                                                    transition={{ type: "spring", stiffness: 100, delay: 2 }}
                                                                >
                                                                    <circle cx="140" cy="48" r="8" fill="var(--bg-soft)" stroke="var(--primary)" strokeWidth="1" strokeOpacity="0.2" />
                                                                    <g transform="translate(128, 36)">
                                                                        <Heart
                                                                            size={24}
                                                                            style={{ color: 'var(--primary)' }}
                                                                            fill="currentColor"
                                                                        />
                                                                    </g>
                                                                </motion.g>
                                                            </svg>
                                                        </div>
                                                    </motion.div>

                                                    {/* Buffer for Desktop Layout */}
                                                    <div className="hidden md:block md:w-[45%]" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {[...Array(15)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute opacity-10"
                                        style={{
                                            left: `${Math.random() * 100}%`,
                                            top: `${Math.random() * 100}%`
                                        }}
                                        animate={{
                                            y: [0, -150, 0],
                                            x: [0, Math.random() * 50 - 25, 0],
                                            rotate: [0, 360],
                                            scale: [0.8, 1.2, 0.8],
                                            opacity: [0.05, 0.15, 0.05]
                                        }}
                                        transition={{
                                            duration: 15 + Math.random() * 20,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    >
                                        <Heart
                                            size={Math.random() * 20 + 10}
                                            style={{ color: Math.random() > 0.5 ? 'var(--primary)' : 'var(--secondary)' }}
                                            fill="currentColor"
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* Premium Wave Separator: Timeline -> RSVP */}
                        <div className="relative h-32 md:h-48 -mt-24 md:-mt-32 z-20 pointer-events-none">
                            <div className="absolute inset-0 overflow-hidden">
                                <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full scale-x-110" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="grad-rsvp" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0" />
                                            <stop offset="100%" stopColor="var(--primary)" stopOpacity="1" />
                                        </linearGradient>
                                    </defs>
                                    <motion.path
                                        animate={{ y: [0, 5, 0] }}
                                        transition={{ duration: 8, repeat: Infinity }}
                                        d="M0,192L48,213.3C96,235,192,277,288,266.7C384,256,480,192,576,181.3C672,171,768,213,864,224C960,235,1056,213,1152,181.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L0,320Z"
                                        fill="var(--primary)" opacity="0.2"
                                    />
                                    <path d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L0,320Z" fill="var(--primary)" />
                                </svg>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center gap-8 opacity-40">
                                {[...Array(4)].map((_, i) => (
                                    <motion.div key={i} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 4, delay: i * 0.5, repeat: Infinity }}>
                                        <Heart size={24} className="text-white" fill="white" />
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* RSVP */}
                        <section id="rsvp" className="py-24 px-4 text-white text-center transition-all duration-1000 overflow-hidden relative" style={{ backgroundColor: 'var(--primary)' }}>
                            <div className="max-w-2xl mx-auto space-y-8 relative z-10">
                                <motion.span
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="font-bold tracking-[0.5em] uppercase text-[10px] block"
                                >
                                    {rsvpStatus === 'confirmed' ? "C'est génial !" : rsvpStatus === 'declined' ? "Oh non..." : "Serais-je des vôtres ?"}
                                </motion.span>
                                <h2 className="text-4xl md:text-7xl font-serif" style={{ fontFamily: 'var(--font-main)' }}>
                                    {rsvpStatus === 'confirmed' ? "Votre Invitation Digitale" : rsvpStatus === 'declined' ? "Vous allez nous manquer" : (eventData.rsvp?.title || "Confirmer ma présence")}
                                </h2>

                                <AnimatePresence mode="wait">
                                    {!rsvpStatus || rsvpStatus === 'pending' ? (
                                        <motion.div
                                            key="buttons"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, y: -20 }}
                                            className="space-y-8"
                                        >
                                            <p className="text-white/80 text-xl font-serif font-light italic relative px-6 max-w-2xl mx-auto leading-relaxed">
                                                <Quote size={24} className='absolute left-0 -top-4 opacity-30 text-white' />
                                                {eventData.rsvp?.text}
                                            </p>

                                            <div className="max-w-xl mx-auto pt-4">
                                                <div className="flex flex-col sm:flex-row w-full items-center justify-center gap-6">
                                                    <Button
                                                        onClick={() => handleRSVP('yes')}
                                                        className="bg-white text-stone-900 hover:bg-white hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full px-10 h-14 rounded-full border-none flex items-center justify-center gap-3 font-bold shadow-[0_10px_30px_rgba(255,255,255,0.2)] transition-all duration-300"
                                                    >
                                                        <Heart size={20} className="text-secondary" fill="currentColor" />
                                                        Oui, je serai présent
                                                    </Button>
                                                    <Button
                                                        onClick={() => handleRSVP('no')}
                                                        variant="outline"
                                                        className="border-white/20 text-white hover:bg-white/10 hover:border-white/40 w-full px-10 h-14 rounded-full backdrop-blur-sm transition-all duration-300"
                                                    >
                                                        Non, je ne pourrai pas
                                                    </Button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : rsvpStatus === 'confirmed' ? (
                                        <motion.div
                                            key="invitation-pass"
                                            initial="hidden"
                                            animate="visible"
                                            variants={{
                                                hidden: { opacity: 0, scale: 0.9, y: 60, rotateX: 15 },
                                                visible: {
                                                    opacity: 1,
                                                    scale: 1,
                                                    y: 0,
                                                    rotateX: 0,
                                                    transition: {
                                                        type: "spring",
                                                        stiffness: 80,
                                                        damping: 15,
                                                        mass: 1,
                                                        staggerChildren: 0.15,
                                                        delayChildren: 0.4
                                                    }
                                                }
                                            }}
                                            className="w-full mx-auto perspective-distant"
                                        >
                                            <motion.div
                                                className="relative group/pass"
                                            >
                                                {/* Pass Header */}
                                                <motion.div
                                                    variants={{
                                                        hidden: { opacity: 0, y: -50 },
                                                        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                                                    }}
                                                    className="text-white relative w-full"
                                                    style={{ backgroundColor: 'var(--primary)' }}
                                                >
                                                    {/* Decorative Elements */}
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
                                                    <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-black/5 rounded-full pointer-events-none" />

                                                    <div className="relative z-10 p-8">
                                                        <h3 className="text-4xl font-medium uppercase text-center mb-1">{formattedName}</h3>
                                                        <div className="flex items-center justify-center gap-3 opacity-60">
                                                            <div className="h-px w-12 bg-white" />
                                                            <p className="text-[10px] text-center uppercase tracking-[0.4em] font-bold">Pass Invitation</p>
                                                            <div className="h-px w-12 bg-white" />
                                                        </div>
                                                    </div>
                                                </motion.div>

                                                {/* Pass Body */}
                                                <div className="p-8 pb-10 space-y-8 relative">
                                                    {/* Perforation visual illusion */}
                                                    <div className="absolute -left-4 top-[-16px] w-8 h-8 rounded-full shadow-[inset_-4px_0_8px_rgba(0,0,0,0.05)]" style={{ backgroundColor: 'var(--primary)' }} />
                                                    <div className="absolute -right-4 top-[-16px] w-8 h-8 rounded-full shadow-[inset_4px_0_8px_rgba(0,0,0,0.05)]" style={{ backgroundColor: 'var(--primary)' }} />

                                                    {/* QR Code Section */}
                                                    <motion.div
                                                        variants={{
                                                            hidden: { opacity: 0, scale: 0.5, rotate: -15 },
                                                            visible: { opacity: 1, scale: 1, rotate: 0, transition: { type: "spring", damping: 12 } }
                                                        }}
                                                        className="flex flex-col items-center gap-8"
                                                    >
                                                        <div id="rsvp-qr-code" className="p-5 bg-white rounded-[2.5rem] border border-stone-100 group/qr relative">
                                                            <div className="absolute -inset-2 bg-linear-to-tr from-(--primary)/10 to-transparent blur-xl opacity-0 group-hover/qr:opacity-100 transition-opacity" />
                                                            <div className="relative p-2 bg-white rounded-2xl">
                                                                <QRCodeSVG
                                                                    value={`${window.location.origin}/check-in/${guest.token}`}
                                                                    size={160}
                                                                    level="H"
                                                                    includeMargin={false}
                                                                    fgColor="var(--primary)"
                                                                />
                                                            </div>
                                                            <Button
                                                                onClick={downloadQRCode}
                                                                disabled={isDownloading}
                                                                className="absolute -bottom-6 -right-6 bg-stone-900 w-14 h-14 p-0! text-white hover:bg-stone-800 rounded-full flex items-center justify-center transition-all active:scale-[0.98]"
                                                            >
                                                                {isDownloading ? (
                                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                ) : (
                                                                    <DownloadIcon size={18} />
                                                                )}
                                                            </Button>
                                                        </div>

                                                        <div className="w-full space-y-4">
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                                                                    <QrCode size={14} className="text-primary" />
                                                                    <span>Scanner à la réception</span>
                                                                </div>
                                                                <p className="text-[9px] text-stone-300 italic">(Réservé au staff pour validation)</p>
                                                            </div>
                                                        </div>
                                                    </motion.div>

                                                    {/* Info Divider */}
                                                    <motion.div
                                                        variants={{
                                                            hidden: { opacity: 0, scale: 0.5 },
                                                            visible: { opacity: 1, scale: 1 }
                                                        }}
                                                        className="flex items-center justify-center gap-4"
                                                    >
                                                        <Heart size={20} className="text-stone-200" fill="currentColor" />
                                                    </motion.div>

                                                    {/* Table Info Section */}
                                                    <motion.div
                                                        variants={{
                                                            hidden: { opacity: 0, y: 20 },
                                                            visible: { opacity: 1, y: 0 }
                                                        }}
                                                        className="flex flex-col items-center gap-4 py-2"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-px w-10 bg-stone-100/10" />
                                                            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400">Votre Table</span>
                                                            <div className="h-px w-10 bg-stone-100/10" />
                                                        </div>

                                                        <div className="relative">
                                                            {/* Decorative Floating Hearts */}
                                                            <motion.div
                                                                animate={{ y: [0, -5, 0], rotate: [0, 10, 0], opacity: [0.4, 0.8, 0.4] }}
                                                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                                                className="absolute -top-4 -left-6 text-primary"
                                                            >
                                                                <Heart size={16} fill="currentColor" />
                                                            </motion.div>
                                                            <motion.div
                                                                animate={{ y: [0, 5, 0], rotate: [0, -10, 0], opacity: [0.3, 0.6, 0.3] }}
                                                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                                                                className="absolute -bottom-2 -right-8 text-secondary"
                                                            >
                                                                <Heart size={12} fill="currentColor" />
                                                            </motion.div>

                                                            <div className="px-10 py-6 bg-white/5 backdrop-blur-xl rounded-[2.5rem] border border-white/20 shadow-2xl text-center group transition-all hover:bg-white/10 hover:border-white/30">
                                                                <div className="mb-4 flex justify-center">
                                                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                                                        <Users size={18} className="text-white/80" />
                                                                    </div>
                                                                </div>
                                                                <h3 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-wide" style={{ fontFamily: 'var(--font-main)' }}>
                                                                    {getTableInfo().tableName}
                                                                </h3>
                                                                <div className="mt-3 flex items-center justify-center gap-3">
                                                                    <div className="h-px w-4 bg-white/20" />
                                                                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">
                                                                        {getTableInfo().seat}
                                                                    </p>
                                                                    <div className="h-px w-4 bg-white/20" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>

                                                    {/* Colleagues Section */}
                                                    {getTableInfo().others.length > 0 && (
                                                        <div className="space-y-6 pt-4">
                                                            <motion.div
                                                                variants={{
                                                                    hidden: { opacity: 0 },
                                                                    visible: { opacity: 1 }
                                                                }}
                                                                className="flex items-center justify-center gap-3"
                                                            >
                                                                <div className="h-px w-10 bg-stone-100/10" />
                                                                <div className="flex items-center gap-2">
                                                                    <Users size={14} className="text-white/40" />
                                                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400">À vos côtés</span>
                                                                </div>
                                                                <div className="h-px w-10 bg-stone-100/10" />
                                                            </motion.div>

                                                            <div className="flex flex-wrap items-center justify-center gap-3 px-2">
                                                                {getTableInfo().others.map((name, i) => (
                                                                    <motion.div
                                                                        key={i}
                                                                        variants={{
                                                                            hidden: { opacity: 0, scale: 0.8, x: -10 },
                                                                            visible: { opacity: 1, scale: 1, x: 0 }
                                                                        }}
                                                                        whileHover={{ scale: 1.05, y: -2 }}
                                                                        className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full flex items-center gap-2 transition-all hover:bg-white/15 hover:border-white/20 shadow-sm"
                                                                    >
                                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--primary)' }} />
                                                                        <span className="text-[11px] font-medium text-white/90">
                                                                            {name}
                                                                        </span>
                                                                    </motion.div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Footer decoration */}
                                                <motion.div
                                                    variants={{
                                                        hidden: { scaleX: 0 },
                                                        visible: { scaleX: 1, transition: { duration: 1 } }
                                                    }}
                                                    className="h-2 w-full opacity-10 origin-left"
                                                    style={{ backgroundColor: 'var(--primary)', backgroundImage: 'radial-gradient(circle, white 1px, transparent 0)', backgroundSize: '8px 8px' }}
                                                />
                                            </motion.div>

                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handleRSVP('pending')}
                                                className="mt-12 flex items-center gap-3 mx-auto text-sm text-white group"
                                            >
                                                <Undo2 size={14} className="group-hover:-translate-x-1 transition-transform" />
                                                Revoir ma décision
                                            </motion.button>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="confirmation-no"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="space-y-10 py-10"
                                        >
                                            <div className="relative inline-block">
                                                <HeartCrack size={64} className="mx-auto text-white/20" />
                                                <motion.div
                                                    animate={{ y: [0, -10, 0] }}
                                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                                    className="absolute inset-0 flex items-center justify-center"
                                                >
                                                    <Frown size={32} className="text-white/40" />
                                                </motion.div>
                                            </div>

                                            <p className="text-white/80 text-2xl font-serif italic max-w-md mx-auto leading-relaxed">
                                                "Nous respectons votre choix et espérons vous revoir très bientôt pour d'autres moments heureux."
                                            </p>

                                            <Button
                                                onClick={() => handleRSVP('pending')}
                                                variant="outline"
                                                className="w-fit mx-auto border-white/20 text-white hover:bg-white/10 h-14 px-10 rounded-2xl flex items-center gap-3 group"
                                            >
                                                <Undo2 size={18} className="group-hover:-translate-x-1 transition-transform" />
                                                <span>Changer d'avis</span>
                                            </Button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </section>

                        {/* Premium Wave Separator: RSVP -> Cards */}
                        <div className="relative h-32 md:h-48 z-20 pointer-events-none" style={{ backgroundColor: 'var(--primary)' }}>
                            <div className="absolute inset-0 overflow-hidden">
                                <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
                                    <path d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,218.7C960,235,1056,213,1152,192C1248,171,1344,149,1392,138.7L1440,128L1440,320L0,320Z" fill="var(--bg-soft)" opacity="0.4" />
                                    <path d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L0,320Z" fill="var(--bg-soft)" />
                                </svg>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center gap-10 opacity-30">
                                <Heart size={20} className="text-white" />
                                <Heart size={32} className="text-white" fill="white" />
                                <Heart size={20} className="text-white" />
                            </div>
                        </div>

                        {/* Interactive Cards */}
                        {(eventData.showMusic || eventData.showNotes) && (
                            <section id='personnaliser' className="py-32 px-4" style={{ backgroundColor: 'var(--bg-soft)' }}>
                                <div className="max-w-5xl mx-auto space-y-16">
                                    <div className="text-center space-y-4">
                                        <motion.span
                                            initial={{ opacity: 0 }}
                                            whileInView={{ opacity: 1 }}
                                            className="font-bold tracking-[0.4em] uppercase text-xs"
                                            style={{ color: 'var(--primary)' }}
                                        >
                                            Interactions
                                        </motion.span>
                                        <h2 className="text-5xl md:text-7xl font-serif" style={{ fontFamily: 'var(--font-main)', color: 'var(--primary)' }}>
                                            Personnalisez la fête
                                        </h2>
                                        <p className="text-stone-500 font-serif italic text-lg max-w-md mx-auto">Votre participation rendra cette journée inoubliable.</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-12">
                                        {eventData.showMusic && (
                                            <motion.div
                                                whileHover={{ y: -10 }}
                                                className="bg-white p-12 rounded-[35px] text-center space-y-6 border border-(--secondary)/20 shadow-xl shadow-stone-200/50 relative overflow-hidden group"
                                            >
                                                <div className="absolute top-0 left-0 right-0 w-[90%] mx-auto h-2 rounded-4xl" style={{ backgroundColor: 'var(--primary)' }}></div>
                                                <div
                                                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl transition-transform group-hover:rotate-6"
                                                    style={{ color: 'var(--bg-soft)', backgroundColor: 'var(--primary)' }}
                                                >
                                                    <Music size={32} />
                                                </div>
                                                <h3 className="text-3xl font-serif text-stone-800" style={{ fontFamily: 'var(--font-main)' }}>
                                                    {guest?.music_suggestions?.songs?.length > 0 ? "Vos suggestions" : "Une idée de musique ?"}
                                                </h3>
                                                <p className="text-stone-500 leading-relaxed max-w-xs mx-auto">
                                                    {guest?.music_suggestions?.songs?.length > 0
                                                        ? `Vous avez déjà suggéré ${guest.music_suggestions.songs.length} titre(s).`
                                                        : "Quelle chanson ne devrait pas manquer pour vous faire danser ?"}
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    className="rounded-2xl w-fit mx-auto mt-6 h-14 px-8 text-base font-normal border-stone-100 bg-primary text-white hover:bg-primary/80"
                                                    // style={{ color: 'var(--primary)' }}
                                                    onClick={() => setIsMusicModalOpen(true)}
                                                >
                                                    {guest?.music_suggestions?.songs?.length > 0 ? "Modifier mes choix" : "Proposer une chanson"}
                                                </Button>
                                            </motion.div>
                                        )}
                                        {eventData.showNotes && (
                                            <motion.div
                                                whileHover={{ y: -10 }}
                                                className="bg-white p-12 rounded-[35px] text-center space-y-6 border border-(--secondary)/20 shadow-xl shadow-stone-200/50 relative overflow-hidden group"
                                            >
                                                <div className="absolute top-0 left-0 right-0 w-[90%] mx-auto h-2 rounded-4xl" style={{ backgroundColor: 'var(--secondary)' }}></div>
                                                <div
                                                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl transition-transform group-hover:-rotate-6"
                                                    style={{ color: 'var(--bg-soft)', backgroundColor: 'var(--secondary)' }}
                                                >
                                                    <MessageCircle size={32} />
                                                </div>
                                                <h3 className="text-3xl font-serif text-stone-800" style={{ fontFamily: 'var(--font-main)' }}>
                                                    {guest?.guestbook_message ? "Votre message" : "Votre petit mot pour les mariés"}
                                                </h3>
                                                <p className="text-stone-500 leading-relaxed max-w-xs mx-auto">
                                                    {guest?.guestbook_message
                                                        ? "Votre message est enregistré dans le livre d'or."
                                                        : "Laissez un souvenir mémorable de cette magnifique journée."}
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    className="rounded-2xl w-fit mx-auto mt-6 h-14 px-8 text-base font-normal border-stone-100 bg-secondary text-white hover:bg-(--secondary)/80"
                                                    // style={{ color: 'var(--secondary)' }}
                                                    onClick={() => setIsGuestbookModalOpen(true)}
                                                >
                                                    {guest?.guestbook_message ? "Modifier mon message" : "Écrire un mot"}
                                                </Button>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </section>
                        )}

                        <MusicModal
                            isOpen={isMusicModalOpen}
                            onClose={() => setIsMusicModalOpen(false)}
                            onSuccess={refreshData}
                            token={token}
                            initialData={guest?.music_suggestions}
                        />
                        <GuestbookModal
                            isOpen={isGuestbookModalOpen}
                            onClose={() => setIsGuestbookModalOpen(false)}
                            onSuccess={refreshData}
                            token={token}
                            initialData={{ name: guest?.name, message: guest?.guestbook_message }}
                        />

                        {/* Premium Wave Separator: Cards -> Galerie */}
                        <div className="relative h-32 md:h-48 -mt-24 md:-mt-32 z-20 pointer-events-none" style={{ backgroundColor: 'var(--bg-soft)' }}>
                            <div className="absolute inset-0 overflow-hidden">
                                <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full scale-x-110" preserveAspectRatio="none">
                                    <motion.path
                                        animate={{ x: [-20, 20, -20] }}
                                        transition={{ duration: 15, repeat: Infinity }}
                                        d="M0,192L60,208C120,224,240,256,360,240C480,224,600,160,720,149.3C840,139,960,181,1080,181.3C1200,181,1320,139,1380,117.3L1440,96L1440,320L0,320Z"
                                        fill="white" opacity="0.3"
                                    />
                                    <path d="M0,288L60,272C120,256,240,224,360,197.3C480,171,600,149,720,165.3C840,181,960,235,1080,250.7C1200,267,1320,245,1380,234.7L1440,224L1440,320L0,320Z" fill="white" />
                                </svg>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center gap-14 opacity-20">
                                <Heart size={40} className="text-primary" />
                                <Heart size={20} className="text-primary" fill="currentColor" />
                                <Heart size={40} className="text-primary" />
                            </div>
                        </div>

                        {/* Carousel Galerie - Modern Wedding Style */}
                        <section id="galerie" className="py-32 px-4 bg-white relative overflow-hidden">
                            {/* Floral backgrounds */}
                            <div className="absolute -top-24 -left-24 w-64 h-64 text-(--primary)/5 pointer-events-none rotate-12">
                                <Flower2 size={256} strokeWidth={0.5} />
                            </div>
                            <div className="absolute -bottom-24 -right-24 w-64 h-64 text-(--primary)/5 pointer-events-none -rotate-12">
                                <Flower2 size={256} strokeWidth={0.5} />
                            </div>

                            <div className="max-w-7xl mx-auto space-y-20 relative z-10">
                                <div className="text-center space-y-6">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        className="inline-flex items-center justify-center p-3 rounded-full mb-2"
                                        style={{ backgroundColor: 'var(--bg-soft)', color: 'var(--primary)' }}
                                    >
                                        <Camera size={20} />
                                    </motion.div>
                                    <div className="space-y-4">
                                        <motion.span
                                            initial={{ opacity: 0, y: 10 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            className="font-bold tracking-[0.4em] uppercase text-[10px] md:text-xs block"
                                            style={{ color: 'var(--primary)' }}
                                        >
                                            Album Photos
                                        </motion.span>
                                        <h2 className="text-5xl md:text-8xl font-serif leading-none" style={{ fontFamily: 'var(--font-main)', color: 'var(--primary)' }}>
                                            Nos plus beaux <br className="hidden md:block" /> souvenirs
                                        </h2>
                                        <div className="flex items-center justify-center gap-4 pt-4">
                                            <div className="h-px w-8 bg-current opacity-20" style={{ color: 'var(--primary)' }} />
                                            <Sparkles size={16} className="opacity-40" style={{ color: 'var(--primary)' }} />
                                            <div className="h-px w-8 bg-current opacity-20" style={{ color: 'var(--primary)' }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="relative py-10 md:py-20">
                                        <Swiper
                                            effect={'coverflow'}
                                            grabCursor={true}
                                            loop={true}
                                            centeredSlides={true}
                                            slidesPerView={'auto'}
                                            autoplay={{
                                                delay: 4000,
                                                disableOnInteraction: false,
                                                pauseOnMouseEnter: true,
                                            }}
                                            speed={1000}
                                            modules={[EffectCoverflow, Navigation, Pagination, Autoplay]}
                                            className="wedding-gallery-swiper overflow-visible! py-10"
                                            coverflowEffect={{
                                                rotate: 5,
                                                stretch: 0,
                                                depth: 60,
                                                modifier: 1.5,
                                                slideShadows: false,
                                            }}
                                            navigation={{
                                                prevEl: '.swiper-btn-prev',
                                                nextEl: '.swiper-btn-next',
                                            }}
                                            pagination={{
                                                clickable: true,
                                                el: '.swiper-dots-custom',
                                                bulletClass: 'swiper-dot',
                                                bulletActiveClass: 'active'
                                            }}
                                            onSlideChange={(swiper) => setActiveGalleryIdx(swiper.realIndex)}
                                        >
                                            {eventData.gallery.map((img, idx) => (
                                                <SwiperSlide key={idx} className="wedding-slide w-[220px] md:w-[260px] lg:w-[480px]!" >
                                                    <motion.div
                                                        whileHover={{ y: -10 }}
                                                        transition={{ type: "spring", stiffness: 300 }}
                                                        className="bg-white p-3 md:p-5 rounded-2xl md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-stone-100 flex flex-col gap-4 md:gap-6"
                                                    >
                                                        <div className="relative aspect-square overflow-hidden rounded-xl md:rounded-2xl">
                                                            <img
                                                                src={img}
                                                                alt={`Galerie ${idx + 1}`}
                                                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                                            />
                                                            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl md:rounded-2xl" />
                                                        </div>
                                                        <div className="flex items-center justify-between px-2 pb-2">
                                                            <div className="space-y-1">
                                                                <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Instants</p>
                                                                <p className="font-serif italic text-base md:text-lg text-stone-800">Souvenir #{idx + 1}</p>
                                                            </div>
                                                            <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center border border-stone-100">
                                                                <Heart size={16} className="text-stone-300" />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </SwiperSlide>
                                            ))}
                                        </Swiper>
                                    </div>

                                    {/* Navigation Controls */}
                                    <div className="flex items-center justify-center gap-8 mt-1">
                                        <button
                                            className="swiper-btn-prev w-12 h-12 rounded-full border border-stone-100 flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-all outline-none"
                                            style={{ '--hover-color': 'var(--primary)' }}
                                        >
                                            <ChevronLeft size={20} />
                                        </button>

                                        <button
                                            className="swiper-btn-next w-12 h-12 rounded-full border border-stone-100 flex items-center justify-center text-stone-400 hover:bg-stone-50 transition-all outline-none"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Premium Wave Separator: Galerie -> Donation */}
                        <div className="relative h-32 md:h-48 -mt-24 md:-mt-32 z-20 pointer-events-none" style={{ backgroundColor: 'white' }}>
                            <div className="absolute inset-0 overflow-hidden">
                                <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
                                    <path d="M0,160L80,170.7C160,181,320,203,480,202.7C640,203,800,181,960,176C1120,171,1280,181,1360,186.7L1440,192L1440,320L0,320Z" fill="var(--bg-soft)" opacity="0.4" />
                                    <path d="M0,288L80,272C160,256,320,224,480,213.3C640,203,800,213,960,229.3C1120,245,1280,267,1360,277.3L1440,288L1440,320L0,320Z" fill="var(--bg-soft)" />
                                </svg>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                                    <Heart size={40} className="text-primary opacity-20" fill="currentColor" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Donation */}
                        {eventData.showGift && (
                            <section id="liste" className="py-32 px-4 relative overflow-hidden bg-(--bg-soft)">
                                {/* Background decoration */}
                                {/* <div className="absolute top-0 right-0 w-96 h-96 opacity-5 pointer-events-none" style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }}></div> */}

                                <div className="max-w-3xl mx-auto text-center space-y-10 relative z-10">
                                    <div className="flex justify-center mb-6">
                                        <div className="relative">
                                            <Gift className="w-12 h-12" style={{ color: 'var(--primary)' }} fill="var(--bg-soft)" />
                                            <motion.div
                                                // animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute inset-0"
                                            >
                                                <Gift className="w-12 h-12 blur-sm opacity-50" style={{ color: 'var(--primary)' }} />
                                            </motion.div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h2 className="text-5xl md:text-7xl font-serif leading-tight" style={{ fontFamily: 'var(--font-main)', color: 'var(--primary)' }}>Cadeaux</h2>
                                    </div>

                                    <div className='max-w-2xl mx-auto space-y-4'>
                                        <p className="text-stone-500 text-xl leading-relaxed font-serif italic">
                                            "Vous trouverez toutes les informations relatives aux cadeaux et aux intentions particulières en cliquant sur le bouton ci-dessous."
                                        </p>
                                        <small className="text-stone-400 text-sm leading-relaxed font-serif italic ">Nous vous remercions pour votre délicate attention.</small>
                                    </div>
                                    <Button
                                        variant="primary"
                                        onClick={() => setIsDonationModalOpen(true)}
                                        className="h-16 w-fit mx-auto px-16 group relative overflow-hidden rounded-full border-none shadow-2xl hover:scale-105 transition-all text-lg font-medium"
                                        style={{ backgroundColor: 'var(--primary)', color: 'white' }}
                                    >
                                        <span className="relative z-10 flex items-center gap-3">
                                            Détails de l'émission <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </Button>
                                </div>
                            </section>
                        )}

                        {/* Premium Wave Separator: Donation -> Footer */}
                        <div className="relative h-32 md:h-48 -mt-24 md:-mt-32 z-20 pointer-events-none" >
                            <div className="absolute inset-0 overflow-hidden">
                                <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
                                    <path d="M0,160L120,186.7C240,213,480,267,720,250.7C960,235,1200,149,1320,106.7L1440,64L1440,320L0,320Z" fill="#1c1917" opacity="0.5" />
                                    <path d="M0,288L120,272C240,256,480,224,720,208C960,192,1200,192,1320,192L1440,192L1440,320L0,320Z" fill="#1c1917" />
                                </svg>
                            </div>
                        </div>

                        {/* Footer */}
                        <footer className="py-16 bg-stone-900  text-center text-stone-400">
                            <div className="max-w-4xl mx-auto space-y-6">
                                <Heart className="mx-auto text-stone-600" size={28} />
                                <p className="text-2xl font-serif italic text-stone-300">Merci de faire partie de notre histoire.</p>
                                <p className="text-sm tracking-wide uppercase font-semibold text-stone-500">Mille mercis par avance pour votre présence !</p>
                            </div>
                        </footer>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default InvitationPage;
