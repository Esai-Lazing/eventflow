import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, XCircle, Camera, ChevronRight, ChevronLeft, Check, Plus, Trash2, Eye, EyeOff, MapPin, Loader2, User, FileEditIcon, ArrowLeftFromLine, ArrowLeft, Save, Download, SaveAll, ArrowRight } from 'lucide-react';
import { Button } from './ui/Base';
import { InputEvent } from './ui/InputEvent';
import { TextareaEvent } from './ui/TextareaEvent';
import { SwitchEvent } from './ui/SwitchEvent';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './AuthModal';
import { eventService } from '../services/api';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';

const steps = [
    {
        id: 'hero',
        title: 'Section Accueil',
        description: 'Personnalisez les images principales et vos noms.',
    },
    {
        id: 'intro',
        title: 'Introduction',
        description: 'Partagez votre histoire en quelques mots.',
    },
    {
        id: 'palette',
        title: 'Palette de Couleurs',
        description: 'Choisissez l\'ambiance colorée de votre invitation.',
    },
    {
        id: 'typography',
        title: 'Typographie',
        description: 'Sélectionnez le style de vos titres et noms.',
    },
    {
        id: 'decoration',
        title: 'Décoration Florale',
        description: 'Choisissez les ornements pour votre page.',
    },
    {
        id: 'ceremony',
        title: 'Cérémonies',
        description: 'Détaillez les lieux et horaires de votre événement.',
    },
    {
        id: 'program',
        title: 'Programme',
        description: 'Ajoutez ou modifiez le planning de la journée.',
    },
    {
        id: 'gallery',
        title: 'Galerie Photos',
        description: 'Gérez les photos souvenirs de votre couple.',
    },
    {
        id: 'messages',
        title: 'Messages & RSVP',
        description: 'Personnalisez les textes du RSVP et des cadeaux.',
    },
    {
        id: 'cards',
        title: 'Modules Interactifs',
        description: 'Activez les modules de musique et de conseils.',
    }
];

const palettes = [
    { id: 'rose-gold', name: 'Rose Poudré & Or', colors: ['#7a404a', '#a67c85', '#fff9fa'] },
    { id: 'sage-green', name: 'Sauge & Eucalyptus', colors: ['#2d4a3e', '#7a9a8c', '#f2f5f3'] },
    { id: 'classic-champagne', name: 'Champagne Classique', colors: ['#8a6d3b', '#bfa26a', '#fdfbf7'] },
    { id: 'dusty-amber', name: 'Bleu Dusty & Argent', colors: ['#2c4c58', '#6b8e9b', '#f5f9fa'] },
    { id: 'terracotta-sand', name: 'Terracotta & Sable', colors: ['#a64d32', '#d68c6e', '#fdf8f5'] },
    { id: 'lavender-mist', name: 'Lavande & Provence', colors: ['#5d4a66', '#9b8ea9', '#f8f7f9'] },
    { id: 'emerald-cream', name: 'Émeraude & Crème', colors: ['#123c33', '#4a7c73', '#f4f7f6'] },
    { id: 'midnight-navy', name: 'Marine & Ivoire', colors: ['#1b263b', '#415a77', '#f8f9fa'] },
    { id: 'modern-minimal', name: 'Minimaliste Chic', colors: ['#1a1a1a', '#666666', '#ffffff'] },
    { id: 'vintage-mauve', name: 'Vieux Rose & Mauve', colors: ['#6b4a53', '#a78b91', '#faf8f9'] },
];

const fonts = [
    { name: 'Great Vibes', category: 'Script' },
    { name: 'Dancing Script', category: 'Script' },
    { name: 'Alex Brush', category: 'Script' },
    { name: 'Pinyon Script', category: 'Script' },
    { name: 'Parisienne', category: 'Script' },
    { name: 'Rochester', category: 'Script' },
    { name: 'Allura', category: 'Script' },
    { name: 'Sacramento', category: 'Script' },
    { name: 'Arizonia', category: 'Script' },
    { name: 'Tangerine', category: 'Script' },
    { name: 'Mrs Saint Delafield', category: 'Script' },
    { name: 'Playfair Display', category: 'Serif' },
    { name: 'Cinzel', category: 'Serif' },
    { name: 'Cormorant Garamond', category: 'Serif' },
    { name: 'Bodoni Moda', category: 'Serif' },
    { name: 'EB Garamond', category: 'Serif' },
    { name: 'Spectral', category: 'Serif' },
    { name: 'Outfit', category: 'Modern' },
    { name: 'Montserrat', category: 'Modern' },
    { name: 'Quicksand', category: 'Modern' },
    { name: 'Josefin Sans', category: 'Modern' },
    { name: 'Tenor Sans', category: 'Modern' },
];

// Dynamic asset recovery
const decorationFiles = import.meta.glob('/src/assets/decorations/intro/*.{png,jpg,jpeg,avif,webp}', { eager: true });

const processFiles = (files) => {
    const map = new Map();
    Object.entries(files).forEach(([path, module]) => {
        if (path.includes('.thumb.')) return; // Exclure les miniatures

        const fileName = path.split('/').pop().split('.')[0]; // Nom sans extension
        const isWebp = path.endsWith('.webp');

        // On garde la version WebP si elle existe, sinon le PNG/JPG
        if (!map.has(fileName) || isWebp) {
            map.set(fileName, {
                id: fileName, // Stable ID: just the name
                name: fileName.replace(/-/g, ' '),
                img: module.default
            });
        }
    });
    return Array.from(map.values());
};

const decorations = [
    { id: 'none', name: 'Aucune', img: null },
    ...processFiles(decorationFiles)
];

const CustomizationModal = ({ isOpen, onClose, eventData, setEventData }) => {
    const [currentStep, setCurrentStep] = useState(eventData?.current_step || 0);
    const { user, login, isAuthenticated, loading } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGuestMode, setIsGuestMode] = useState(false);
    const [errors, setErrors] = useState({});
    const { slug, eventType } = useParams();
    // Sync currentStep with eventData.current_step if it changes externally
    useEffect(() => {
        if (eventData?.current_step !== undefined && eventData.current_step !== currentStep) {
            setCurrentStep(eventData.current_step);
        }
    }, [eventData?.current_step]);

    const compressImage = (file, maxWidth = 800, quality = 0.7) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Force JPEG for maximum backwards-compatibility and lowest weight
                    resolve(canvas.toDataURL('image/webp', quality));
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    if (!isOpen) return null;

    const validateStep = (idx = currentStep) => {
        const step = steps[idx];
        const newErrors = {};

        if (step.id === 'hero') {
            if (!eventData.hosts || eventData.hosts.trim() === '') {
                newErrors.hosts = 'Le nom des mariés est requis.';
            }
            if (!eventData.date) {
                newErrors.date = 'La date de l\'événement est requise.';
            }
            if (!eventData.couplePhoto) {
                newErrors.couplePhoto = 'La photo du couple est requise.';
            }
        }

        if (step.id === 'gallery') {
            if (!eventData.gallery || eventData.gallery.length < 1) {
                newErrors.gallery = 'Veuillez ajouter au moins une photo à la galerie.';
            }
        }

        if (step.id === 'intro') {
            if (!eventData.intro?.title || eventData.intro.title.trim() === '') {
                newErrors.introTitle = 'Le titre de l\'introduction est requis.';
            }
            if (!eventData.intro?.text || eventData.intro.text.trim() === '') {
                newErrors.introText = 'Le message d\'introduction est requis.';
            }
        }

        if (step.id === 'ceremony') {
            eventData.ceremonies.forEach((ceremony, idx) => {
                if (!ceremony.title || ceremony.title.trim() === '') {
                    newErrors[`ceremony_${idx}_title`] = 'Le titre est requis.';
                }
                if (!ceremony.venue || ceremony.venue.trim() === '') {
                    newErrors[`ceremony_${idx}_venue`] = 'Le lieu est requis.';
                }
                if (!ceremony.time || ceremony.time.trim() === '') {
                    newErrors[`ceremony_${idx}_time`] = 'L\'heure est requise.';
                }
                if (!ceremony.address || ceremony.address.trim() === '') {
                    newErrors[`ceremony_${idx}_address`] = 'L\'adresse est requise.';
                }
            });
        }

        if (step.id === 'program') {
            eventData.program.forEach((item, idx) => {
                if (!item.title || item.title.trim() === '') {
                    newErrors[`program_${idx}_title`] = 'Le titre de l\'activité est requis.';
                }
                if (!item.time || item.time.trim() === '') {
                    newErrors[`program_${idx}_time`] = 'L\'heure est requise.';
                }
            });
        }

        if (step.id === 'messages') {
            if (!eventData.rsvp?.title || eventData.rsvp.title.trim() === '') {
                newErrors.rsvpTitle = 'Le titre RSVP est requis.';
            }
            if (!eventData.rsvp?.text || eventData.rsvp.text.trim() === '') {
                newErrors.rsvpText = 'Le message RSVP est requis.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (!validateStep()) {
            const firstError = document.querySelector('.text-red-500');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        const nextIdx = currentStep + 1;
        if (nextIdx < steps.length) {
            // Instant UI update
            setCurrentStep(nextIdx);
            setEventData(prev => ({ ...prev, current_step: nextIdx }));

            // Background save (ultra-light: only save the step index, not the whole data)
            const currentSlug = slug || eventData.slug;
            if (isAuthenticated && currentSlug) {
                eventService.update(currentSlug, {
                    current_step: nextIdx
                }).catch(err => console.warn('Background step save failed:', err));
            }
        } else {
            if (!isAuthenticated) {
                setIsAuthModalOpen(true);
            } else {
                handleSave(true);
            }
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            const prevIdx = currentStep - 1;
            setCurrentStep(prevIdx);
            setEventData(prev => ({ ...prev, current_step: prevIdx }));
            setErrors({}); // Clear errors when going back
        }
    };

    const createNewEvent = async (status) => {
        const response = await eventService.create({
            title: eventData.hosts || 'Mon Événement',
            type: eventType || 'wedding',
            date: eventData.date || new Date().toISOString(),
            time: eventData.program?.[0]?.time || '10:00',
            location: eventData.ceremonies?.[0]?.venue || 'Lieu à définir',
            description: eventData.intro?.text || '',
            template: eventData.template || 'classic-gold',
            customization: eventData,
            status: status,
            current_step: currentStep
        });

        // Save the generated slug and processed data in the state
        if (response.data && response.data.customization) {
            setEventData(response.data.customization);
        } else {
            setEventData({
                ...eventData,
                slug: response.data.slug,
                status: status,
                current_step: currentStep
            });
        }
    };

    const handleSave = async (isFinished = false) => {
        const currentSlug = slug || eventData.slug;
        setIsSaving(true);
        try {
            const status = isFinished ? 'published' : (eventData.status || 'draft');
            const payloadObj = {
                customization: eventData,
                status: status,
                current_step: currentStep
            };

            // Optimization: Only do size check on final save or manual save
            const payloadSizeMB = +(JSON.stringify(payloadObj).length / (1024 * 1024)).toFixed(2);
            
            if (payloadSizeMB > 4) { // Increased limit to 4MB for better flexibility
                toast.error(`Contenu trop lourd (${payloadSizeMB} Mo). Veuillez compresser vos images.`);
                setIsSaving(false);
                return;
            }

            if (currentSlug) {
                try {
                    // Try to update existing event
                    const res = await eventService.update(currentSlug, payloadObj);
                    if (res.data && res.data.customization) {
                        setEventData(res.data.customization);
                    }
                } catch (err) {
                    if (err.response?.status === 404) {
                        // Slug existed in cache but not on server, fall through to creation
                        console.warn("Slug not found on server, attempting creation instead.");
                        await createNewEvent(status);
                    } else {
                        throw err; // Re-throw other errors to be caught by main catch block
                    }
                }
            } else {
                await createNewEvent(status);
            }

            // Close modal after successful save
            onClose();

            toast.custom((t) => (
                <div className="flex items-start gap-3 bg-white border border-amber-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-4 rounded-2xl w-[350px] font-sans relative overflow-hidden">
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-[70%] bg-amber-500 rounded-sm"></div>
                    <div className="flex items-center justify-center bg-amber-100 text-amber-600 rounded-full w-8 h-8 shrink-0 mt-0.5 ml-1">
                        <Check size={16} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                        <h3 className="font-medium text-stone-900 text-sm">Sauvegarde réussie</h3>
                        <p className="text-stone-500 text-[13px] leading-relaxed">
                            Vos modifications sont maintenant visibles sur l'invitation.
                        </p>
                    </div>
                    <button
                        onClick={() => toast.dismiss(t)}
                        className="text-stone-400 hover:text-stone-700 hover:bg-stone-100 p-1 rounded-md transition-colors shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>
            ), { duration: 4000 });

        } catch (err) {
            console.error('Could not save event to API:', err);

            // Extract the most descriptive error message
            let errorMessage = "Une erreur est survenue lors de la sauvegarde.";

            if (err.response?.data?.errors) {
                // Laravel style validation errors: { message: "...", errors: { field: ["msg"] } }
                const firstField = Object.keys(err.response.data.errors)[0];
                errorMessage = err.response.data.errors[firstField][0];
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

            toast.custom((t) => (
                <div className="flex items-start gap-3 bg-white border border-rose-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-4 rounded-2xl w-[350px] font-sans relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>
                    <div className="flex items-center justify-center bg-rose-100 text-rose-600 rounded-full w-8 h-8 shrink-0 mt-0.5 ml-1">
                        <XCircle size={16} strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                        <h3 className="font-medium text-stone-900 text-sm">Erreur d'enregistrement</h3>
                        <p className="text-stone-500 text-[13px] leading-relaxed">
                            {errorMessage}
                        </p>
                    </div>
                    <button
                        onClick={() => toast.dismiss(t)}
                        className="text-stone-400 hover:text-stone-700 hover:bg-stone-100 p-1 rounded-md transition-colors shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>
            ), { duration: 5000 });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAuthSuccess = (userData, token) => {
        login(userData, token);
        setIsAuthModalOpen(false);
        handleSave();
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setEventData({ ...eventData, heroImage: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const addProgramItem = () => {
        const newProgram = [...eventData.program, { time: '00:00', title: 'Nouvelle activité' }];
        setEventData({ ...eventData, program: newProgram });
    };

    const removeProgramItem = (index) => {
        const newProgram = eventData.program.filter((_, i) => i !== index);
        setEventData({ ...eventData, program: newProgram });
    };

    const renderStepContent = () => {
        const step = steps[currentStep];

        switch (step.id) {
            case 'hero':
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <InputEvent
                                label="Noms des mariés"
                                value={eventData.hosts}
                                error={errors.hosts}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const transformed = val.replace(/\s+et\s+/gi, ' & ');
                                    setEventData({ ...eventData, hosts: transformed });
                                    if (errors.hosts) setErrors({ ...errors, hosts: null });
                                }}
                                placeholder="Sarah & Patrick"
                                className="font-medium"
                            />
                            <p className="text-[10px] text-dark/40 font-medium ml-1">Utilisez ' & ' pour séparer les noms et les afficher avec style.</p>
                        </div>
                        <div className="space-y-2">
                            <InputEvent
                                label="Date et Heure"
                                type="datetime-local"
                                value={eventData.date.substring(0, 16)}
                                error={errors.date}
                                onChange={(e) => {
                                    setEventData({ ...eventData, date: e.target.value });
                                    if (errors.date) setErrors({ ...errors, date: null });
                                }}
                                className="font-medium text-dark"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[11px] font-medium text-dark/40 uppercase tracking-wider ml-1">Photo principale du couple</label>
                            <div className="flex items-center gap-4 p-4 bg-dark/5 rounded-2xl border border-dark/10 shadow-sm">
                                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md bg-stone-100 flex-shrink-0">
                                    {eventData.couplePhoto ? (
                                        <img src={eventData.couplePhoto} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <User size={32} />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                                        <Camera size={20} className="text-white" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={async (e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    try {
                                                        const compressed = await compressImage(file);
                                                        setEventData({ ...eventData, couplePhoto: compressed });
                                                    } catch (err) {
                                                        console.error("Compression failed:", err);
                                                    }
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-[13px] font-medium text-dark/80">Photo du couple</h4>
                                    <p className="text-[10px] text-dark/40 leading-relaxed mt-1">Cette photo sera utilisée comme image principale dans les thèmes modernes.</p>
                                    <div className="flex gap-2 mt-3">
                                        <div className="relative">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-8 px-3 text-[10px] relative overflow-hidden"
                                            >
                                                Choisir une photo
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            try {
                                                                const compressed = await compressImage(file);
                                                                setEventData({ ...eventData, couplePhoto: compressed });
                                                            } catch (err) {
                                                                console.error("Compression failed:", err);
                                                            }
                                                        }
                                                    }}
                                                />
                                            </Button>
                                        </div>
                                        {eventData.couplePhoto && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-3 text-[10px] text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                onClick={() => setEventData({ ...eventData, couplePhoto: null })}
                                            >
                                                Supprimer
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'intro':
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <InputEvent
                                label="Titre de l'introduction"
                                value={eventData.intro?.title}
                                error={errors.introTitle}
                                onChange={(e) => {
                                    setEventData({
                                        ...eventData,
                                        intro: { ...eventData.intro, title: e.target.value }
                                    });
                                    if (errors.introTitle) setErrors({ ...errors, introTitle: null });
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <TextareaEvent
                                label="Votre message"
                                value={eventData.intro?.text}
                                error={errors.introText}
                                onChange={(e) => {
                                    setEventData({
                                        ...eventData,
                                        intro: { ...eventData.intro, text: e.target.value }
                                    });
                                    if (errors.introText) setErrors({ ...errors, introText: null });
                                }}
                                className="h-48"
                            />
                        </div>
                    </div>
                );
            case 'palette':
                return (
                    <div className="grid grid-cols-2 gap-4">
                        {palettes.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setEventData({ ...eventData, palette: p })}
                                className={`p-5 rounded-[1.5rem] border-2 transition-all flex flex-col gap-4 text-left ${eventData.palette?.id === p.id ? 'border-amber-600 bg-amber-50/50 shadow-lg shadow-amber-100/50 scale-[1.02]' : 'border-dark/10 hover:border-dark/20 bg-white hover:bg-dark/5'
                                    }`}
                            >
                                <div className="flex w-full h-12 rounded-xl overflow-hidden shadow-sm border border-slate-200/50 ring-2 ring-white ring-inset">
                                    {p.colors.map((c, i) => (
                                        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
                                    ))}
                                </div>
                                <span className={`text-[11px] font-medium uppercase tracking-wider ${eventData.palette?.id === p.id ? 'text-amber-700' : 'text-slate-600'}`}>{p.name}</span>
                            </button>
                        ))}
                    </div>
                );
            case 'typography':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 max-h-[460px] overflow-y-auto p-1 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                            {fonts.map((f) => (
                                <button
                                    key={f.name}
                                    onClick={() => setEventData({ ...eventData, selectedFont: f.name })}
                                    className={`p-5 rounded-2xl border-2 transition-all text-left ${eventData.selectedFont === f.name ? 'border-amber-600 bg-amber-50/50' : 'border-dark/10 hover:border-slate-200 bg-white'
                                        }`}
                                    style={{ fontFamily: f.name }}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-xl font-medium">{f.name}</span>
                                        <span className="text-[9px] uppercase tracking-widest text-dark/40 font-sans font-medium">{f.category}</span>
                                    </div>
                                    <p className="text-[13px] text-slate-500 font-sans font-medium">L'art de célébrer l'amour</p>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'decoration':
                return (
                    <div className="space-y-8">
                        <div>
                            <p className="text-[10px] font-medium text-dark/40 uppercase tracking-[0.2em] mb-4 ml-1">Fleur de la section Intro (Coins inférieurs)</p>
                            <div className="grid grid-cols-2 gap-4">
                                {decorations.map((d) => (
                                    <button
                                        key={d.id}
                                        onClick={() => setEventData({ ...eventData, decoration: d.id })}
                                        className={`p-3 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${eventData.decoration === d.id ? 'border-amber-600 bg-amber-50/50' : 'border-dark/10 hover:border-slate-200 bg-white'
                                            }`}
                                    >
                                        <div className="aspect-square w-full bg-dark/5 rounded-2xl overflow-hidden flex items-center justify-center p-2 border border-dark/10/50 shadow-inner">
                                            {d.img ? (
                                                <img src={d.img} alt={d.name} className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-[10px] font-medium text-dark/40 uppercase tracking-widest">Aucun</span>
                                            )}
                                        </div>
                                        <span className={`text-[11px] font-medium uppercase tracking-wider mb-1 truncate w-full text-center ${eventData.decoration === d.id ? 'text-amber-700' : 'text-slate-600'}`}>{d.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'ceremony':
                return (
                    <div className="space-y-8">
                        {eventData.ceremonies.map((ceremony, idx) => (
                            <div key={idx} className="p-6 bg-dark/5 border border-dark/10 rounded-[1.3rem] space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <h4 className="font-medium text-dark/80 text-[13px] uppercase tracking-wider">Cérémonie {idx + 1}</h4>
                                        <p className="text-[10px] text-dark/40 font-medium uppercase tracking-widest mt-0.5">Détails de l'étape</p>
                                    </div>
                                    <div className="relative group">
                                        <div className="w-14 h-14 relative bg-white rounded-2xl border border-dark/20 overflow-hidden shadow-sm ring-2 ring-white ring-inset">
                                            <img
                                                src={ceremony.image || (idx === 0
                                                    ? "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1000"
                                                    : "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000")}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-dark/40 overflow-hidden flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                                <Camera size={16} className="text-white" />
                                            </div>
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        const newCeremonies = [...eventData.ceremonies];
                                                        newCeremonies[idx].image = reader.result;
                                                        setEventData({ ...eventData, ceremonies: newCeremonies });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <InputEvent
                                                label="Nom de la cérémonie"
                                                value={ceremony.title}
                                                error={errors[`ceremony_${idx}_title`]}
                                                onChange={(e) => {
                                                    const newCeremonies = [...eventData.ceremonies];
                                                    newCeremonies[idx].title = e.target.value;
                                                    setEventData({ ...eventData, ceremonies: newCeremonies });
                                                    if (errors[`ceremony_${idx}_title`]) setErrors({ ...errors, [`ceremony_${idx}_title`]: null });
                                                }}
                                                placeholder="ex: Cérémonie Laïque"
                                            />
                                        </div>
                                        <div>
                                            <InputEvent
                                                label="Lieu"
                                                value={ceremony.venue || ''}
                                                error={errors[`ceremony_${idx}_venue`]}
                                                onChange={(e) => {
                                                    const newCeremonies = [...eventData.ceremonies];
                                                    newCeremonies[idx].venue = e.target.value;
                                                    setEventData({ ...eventData, ceremonies: newCeremonies });
                                                    if (errors[`ceremony_${idx}_venue`]) setErrors({ ...errors, [`ceremony_${idx}_venue`]: null });
                                                }}
                                                placeholder="ex: Domaine de Bel Air"
                                            />
                                        </div>
                                        <div>
                                            <InputEvent
                                                label="Heure"
                                                type="time"
                                                value={ceremony.time}
                                                error={errors[`ceremony_${idx}_time`]}
                                                onChange={(e) => {
                                                    const newCeremonies = [...eventData.ceremonies];
                                                    newCeremonies[idx].time = e.target.value;
                                                    setEventData({ ...eventData, ceremonies: newCeremonies });
                                                    if (errors[`ceremony_${idx}_time`]) setErrors({ ...errors, [`ceremony_${idx}_time`]: null });
                                                }}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <InputEvent
                                                label="Adresse complète"
                                                value={ceremony.address}
                                                error={errors[`ceremony_${idx}_address`]}
                                                onChange={(e) => {
                                                    const newCeremonies = [...eventData.ceremonies];
                                                    newCeremonies[idx].address = e.target.value;
                                                    setEventData({ ...eventData, ceremonies: newCeremonies });
                                                    if (errors[`ceremony_${idx}_address`]) setErrors({ ...errors, [`ceremony_${idx}_address`]: null });
                                                }}
                                                placeholder="ex: 12 rue du Moulin, 75000 Paris"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <TextareaEvent
                                                label="Description"
                                                value={ceremony.description}
                                                onChange={(e) => {
                                                    const newCeremonies = [...eventData.ceremonies];
                                                    newCeremonies[idx].description = e.target.value;
                                                    setEventData({ ...eventData, ceremonies: newCeremonies });
                                                }}
                                                placeholder="Quelques mots sur ce moment..."
                                                className="h-24 bg-white"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <InputEvent
                                                label="Lien Google Maps"
                                                value={ceremony.mapUrl}
                                                onChange={(e) => {
                                                    const newCeremonies = [...eventData.ceremonies];
                                                    newCeremonies[idx].mapUrl = e.target.value;
                                                    setEventData({ ...eventData, ceremonies: newCeremonies });
                                                }}
                                                placeholder="https://maps.app.goo.gl/..."
                                                className="bg-amber-50/70 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'program':
                return (
                    <div className="space-y-4">
                        {eventData.program.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-center group bg-white pb-4 border-b border-dark/10 transition-all hover:border-slate-200">
                                <InputEvent
                                    type="time"
                                    value={item.time}
                                    error={errors[`program_${idx}_time`]}
                                    onChange={(e) => {
                                        const newProgram = [...eventData.program];
                                        newProgram[idx].time = e.target.value;
                                        setEventData({ ...eventData, program: newProgram });
                                        if (errors[`program_${idx}_time`]) setErrors({ ...errors, [`program_${idx}_time`]: null });
                                    }}
                                    containerClassName="w-28"
                                    className="text-sm rounded-lg"
                                />
                                <InputEvent
                                    value={item.title}
                                    error={errors[`program_${idx}_title`]}
                                    onChange={(e) => {
                                        const newProgram = [...eventData.program];
                                        newProgram[idx].title = e.target.value;
                                        setEventData({ ...eventData, program: newProgram });
                                        if (errors[`program_${idx}_title`]) setErrors({ ...errors, [`program_${idx}_title`]: null });
                                    }}
                                    placeholder="Activité"
                                    containerClassName="flex-1"
                                    className="bg-amber-50/10 text-sm rounded-lg"
                                />
                                <button
                                    onClick={() => removeProgramItem(idx)}
                                    className="p-3 text-slate-300 hover:text-rose-500 transition-all hover:bg-rose-50 rounded-xl"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        <Button
                            variant="secondary"
                            className="w-full border-dashed border-2 py-5 mt-4 rounded-3xl font-medium bg-white text-dark/40 hover:text-amber-600 hover:bg-amber-50/50 hover:border-amber-200 uppercase tracking-widest text-[11px]"
                            onClick={addProgramItem}
                        >
                            <Plus size={16} className="mr-2" /> Ajouter une activité
                        </Button>
                    </div>
                );
            case 'gallery':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {eventData.gallery.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden border border-dark/10 group shadow-sm transition-all hover:shadow-md">
                                    <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity gap-2 lg:backdrop-blur-[2px]">
                                        <div className="relative p-2 lmd:p-3 bg-white rounded-full dark/80 cursor-pointer shadow-xl hover:scale-110 transition-transform">
                                            <Camera size={16} className='lg:size-20' />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={async (e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        try {
                                                            const compressed = await compressImage(file);
                                                            const newGallery = [...eventData.gallery];
                                                            newGallery[idx] = compressed;
                                                            setEventData({ ...eventData, gallery: newGallery });
                                                        } catch (err) {
                                                            console.error("Compression failed:", err);
                                                        }
                                                    }
                                                }}
                                            />
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newGallery = eventData.gallery.filter((_, i) => i !== idx);
                                                setEventData({ ...eventData, gallery: newGallery });
                                            }}
                                            className="p-2 md:p-3 bg-rose-500 rounded-full text-white shadow-xl hover:scale-110 transition-transform"
                                        >
                                            <Trash2 size={16} className='lg:size-20' />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {eventData.gallery.length < 10 && (
                                <div className="relative aspect-square rounded-[2rem] border-2 border-dashed border-dark/10 flex flex-col items-center justify-center text-slate-300 hover:border-amber-300 hover:text-amber-600 transition-all cursor-pointer group bg-dark/5/50">
                                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-200 flex items-center justify-center mb-3 transition-colors group-hover:border-amber-200">
                                        <Plus size={24} />
                                    </div>
                                    <span className="text-[11px] font-medium uppercase tracking-widest">Ajouter</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                try {
                                                    const compressed = await compressImage(file);
                                                    setEventData({ ...eventData, gallery: [...eventData.gallery, compressed] });
                                                    if (errors.gallery) setErrors({ ...errors, gallery: null });
                                                } catch (err) {
                                                    console.error("Compression failed:", err);
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                        {errors.gallery && <p className="text-[11px] text-rose-500 font-medium px-4 text-center">{errors.gallery}</p>}
                        <p className="text-[10px] text-dark/40 font-medium uppercase tracking-widest text-center">Jusqu'à 10 photos souvenirs</p>
                    </div>
                );
            case 'messages':
                return (
                    <div className="space-y-10 pr-1">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                                    <Check size={18} />
                                </div>
                                <h4 className="font-medium dark/80 text-sm uppercase tracking-wider">Section RSVP</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <InputEvent
                                        label="Titre RSVP"
                                        value={eventData.rsvp?.title}
                                        error={errors.rsvpTitle}
                                        onChange={(e) => {
                                            setEventData({
                                                ...eventData,
                                                rsvp: { ...eventData.rsvp, title: e.target.value }
                                            });
                                            if (errors.rsvpTitle) setErrors({ ...errors, rsvpTitle: null });
                                        }}
                                        className=""
                                    />
                                </div>
                                <div className="space-y-2">
                                    <TextareaEvent
                                        label="Message RSVP"
                                        value={eventData.rsvp?.text}
                                        error={errors.rsvpText}
                                        onChange={(e) => {
                                            setEventData({
                                                ...eventData,
                                                rsvp: { ...eventData.rsvp, text: e.target.value }
                                            });
                                            if (errors.rsvpText) setErrors({ ...errors, rsvpText: null });
                                        }}
                                        className="h-28"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-2">
                            <div className="flex items-center gap-3 border-b border-slate-50 pb-4">
                                <div className="p-2 bg-amber-100 rounded-xl text-amber-500">
                                    <Plus size={18} />
                                </div>
                                <h4 className="font-medium dark/80 text-sm uppercase tracking-wider">Section Cadeaux</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <InputEvent
                                        label="Titre Cadeaux"
                                        value={eventData.gifts?.title}
                                        onChange={(e) => setEventData({
                                            ...eventData,
                                            gifts: { ...eventData.gifts, title: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <TextareaEvent
                                        label="Description"
                                        value={eventData.gifts?.description}
                                        onChange={(e) => setEventData({
                                            ...eventData,
                                            gifts: { ...eventData.gifts, description: e.target.value }
                                        })}
                                        className="h-28 scrollbar-none"
                                    />
                                </div>

                                {eventData.gifts?.items?.map((item, idx) => (
                                    <div key={idx} className="p-4 bg-dark/5 rounded-[1.3rem] border border-dark/10 space-y-4">
                                        <div className="space-y-4">
                                            <InputEvent
                                                label="Option de cadeau"
                                                value={item.title}
                                                onChange={(e) => {
                                                    const newItems = [...eventData.gifts.items];
                                                    newItems[idx].title = e.target.value;
                                                    setEventData({ ...eventData, gifts: { ...eventData.gifts, items: newItems } });
                                                }}
                                                className=""
                                            />
                                            <TextareaEvent
                                                value={item.description}
                                                onChange={(e) => {
                                                    const newItems = [...eventData.gifts.items];
                                                    newItems[idx].description = e.target.value;
                                                    setEventData({ ...eventData, gifts: { ...eventData.gifts, items: newItems } });
                                                }}
                                                className="h-32"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 'cards':
                return (
                    <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-between p-6 bg-amber-50/40 rounded-[1.3rem] border border-amber-100/50 transition-all hover:bg-amber-100/50 group">
                            <div className="space-y-1">
                                <p className="font-medium dark/80 text-[15px] tracking-tight group-hover:text-amber-600 transition-colors">Module Musique</p>
                                <p className="text-[11px] text-dark/40 font-medium uppercase tracking-widest">Suggérer des chansons</p>
                            </div>
                            <SwitchEvent
                                checked={eventData.showMusic}
                                onChange={(e) => setEventData({ ...eventData, showMusic: e.target.checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-6 bg-amber-50/40 rounded-[1.3rem] border border-amber-100/50 transition-all hover:bg-amber-100/50 group">
                            <div className="space-y-1">
                                <p className="font-medium dark/80 text-[15px] tracking-tight group-hover:text-amber-600 transition-colors">Module Livre d'or</p>
                                <p className="text-[11px] text-dark/40 font-medium uppercase tracking-widest">Laisser un message doux</p>
                            </div>
                            <SwitchEvent
                                checked={eventData.showNotes}
                                onChange={(e) => setEventData({ ...eventData, showNotes: e.target.checked })}
                            />
                        </div>
                        <div className="flex items-center justify-between p-6 bg-amber-50/40 rounded-[1.3rem] border border-amber-100/50 transition-all hover:bg-amber-100/50 group">
                            <div className="space-y-1">
                                <p className="font-medium dark/80 text-[15px] tracking-tight group-hover:text-amber-600 transition-colors">Cagnotte / Cadeaux</p>
                                <p className="text-[11px] text-dark/40 font-medium uppercase tracking-widest">Section de donation</p>
                            </div>
                            <SwitchEvent
                                checked={eventData.showGift}
                                onChange={(e) => setEventData({ ...eventData, showGift: e.target.checked })}
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            {/* Preview Button for when modal is hidden */}
            {isPreviewMode && (
                <motion.button
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsPreviewMode(false)}
                    className="fixed bottom-16 md:bottom-8 right-8 z-110 p-4 rounded-full shadow-2xl bg-dark text-white transition-colors flex items-center group hover:scale-101"
                >
                    <FileEditIcon size={20} className='shrink-0' />
                    <span className=' max-w-0 overflow-hidden group-hover:max-w-xs group-hover:pl-2 transition-all duration-500 font-semibold text-sm whitespace-nowrap'>
                        <span className='md:hidden'>Personnalisation</span>
                        <span className='hidden md:block'>Revenir à la personnalisation</span>
                    </span>
                </motion.button>
            )}

            <AnimatePresence>
                {!isPreviewMode && (
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-zinc-100 z-20"
                        >
                            {/* Header */}
                            <div className="p-4 flex items-center justify-between bg-dark/5/50 border-b border-zinc-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 bg-[#c09050]/10 text-[#c09050] rounded-xl flex items-center justify-center border border-[#c09050]/20 shadow-sm">
                                        <FileEditIcon size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="text-[17px] font-bold text-stone-900 flex items-center gap-2">
                                            Configuration
                                            <span className="hidden md:block px-2 py-0.5 bg-[#c09050]/10 text-[#c09050] text-[11px] font-black rounded-full border border-[#c09050]/20">Édition</span>
                                        </h2>
                                        <p className="text-[12px] text-stone-400 font-medium mt-0.5 opacity-80">Étape {currentStep + 1} sur {steps.length}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsPreviewMode(true)}
                                    className="flex items-center gap-2.5 px-4 py-2.5 text-stone-500 hover:text-stone-900 transition-all bg-stone-50 hover:bg-white border border-stone-200 rounded-full text-[11px] font-bold shadow-sm active:scale-95"
                                    title="Aperçu des changements"
                                >
                                    <Eye size={14} strokeWidth={2.5} className="text-[#c09050]" />
                                    <span>Aperçu</span>
                                </button>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-1 bg-slate-100">
                                <motion.div
                                    className="h-full bg-amber-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-8 lg:min-h-[400px]" data-lenis-prevent>
                                {loading ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[400px]">
                                        <Loader2 className="animate-spin text-amber-600 mb-2" size={32} />
                                        <p className="text-stone-400 text-sm font-medium">Vérification de la session...</p>
                                    </div>
                                ) : !isAuthenticated && !isGuestMode ? (
                                    <div className="flex-1 flex flex-col items-center justify-center p-4 text-center space-y-8 my-auto min-h-[400px]">
                                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-[#c09050]/10 rounded-[2rem] flex items-center justify-center text-[#c09050] border border-[#c09050]/20 shadow-inner">
                                            <User className='size-20 lg:size-40' strokeWidth={1.5} />
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-3xl font-medium text-stone-900">Commencez l'aventure</h3>
                                            <p className="text-stone-500 text-[14px] max-w-[280px] mx-auto leading-relaxed font-medium opacity-80">
                                                Sauvegardez vos choix en vous connectant, ou découvrez nos outils en tant qu'invité.
                                            </p>
                                        </div>
                                        <div className="w-full space-y-4 pt-4">
                                            <Button
                                                className="w-full h-14 bg-[#18181b] font-medium text-md hover:bg-zinc-800 text-[#c09050] rounded-full flex items-center justify-center gap-3 transition-all active:scale-95 border-none"
                                                onClick={() => setIsAuthModalOpen(true)}
                                            >
                                                Se connecter / S'inscrire
                                            </Button>
                                            <button
                                                className="w-full py-2 text-stone-400 hover:text-stone-900 text-md font-medium transition-colors"
                                                onClick={() => setIsGuestMode(true)}
                                            >
                                                Continuer en tant qu'invité
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-1 pb-2">
                                            <h3 className="text-2xl font-bold text-stone-900">{steps[currentStep].title}</h3>
                                            <p className="text-stone-500 text-[15px] font-medium leading-relaxed opacity-80">{steps[currentStep].description}</p>
                                        </div>

                                        <div className="mt-8">
                                            {renderStepContent()}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            {(loading || (!isAuthenticated && !isGuestMode)) ? null : (
                                <div className="p-4 border-t border-zinc-100 bg-stone-50/80 flex items-center justify-between gap-4">
                                    <Button
                                        variant="secondary"
                                        className="md:w-auto md:px-6 bg-stone-100 hover:bg-stone-200 border-none rounded-2xl md:rounded-2xl p-0 w-12 h-12 font-bold text-stone-500 hover:text-stone-900 transition-all active:scale-90"
                                        onClick={prevStep}
                                        disabled={currentStep === 0}
                                    >
                                        <ArrowLeft size={18} strokeWidth={2.5} />
                                        <span className='hidden md:block uppercase tracking-widest text-[10px] ml-2'>Retour</span>
                                    </Button>

                                    <div className="flex items-center gap-3">
                                        {eventData.status === 'published' && (
                                            <Button
                                                variant="outline"
                                                className="w-12 h-12 px-0 rounded-2xl border-stone-200 text-stone-400 hover:text-[#c09050] hover:bg-white hover:border-[#c09050]/30 transition-all"
                                                onClick={() => handleSave(false)}
                                                disabled={isSaving}
                                            >
                                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <SaveAll size={18} />}
                                            </Button>
                                        )}
                                        <Button
                                            className="w-auto px-6 rounded-2xl h-13 bg-[#18181b] hover:bg-zinc-800 text-[#c09050] border-none disabled:opacity-50 font-medium text-sm transition-all hover:-translate-y-1 active:translate-y-0"
                                            onClick={nextStep}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <><Loader2 className="animate-spin" size={16} /> ...</>
                                            ) : currentStep === steps.length - 1 ? (
                                                <><Check size={16} strokeWidth={3} className="mr-2" /> Terminer</>
                                            ) : (
                                                <>Continuer <ArrowRight size={16} strokeWidth={3} className="ml-2" /></>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                onSuccess={handleAuthSuccess}
            />
        </>
    );
};

export default CustomizationModal;
