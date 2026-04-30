import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Copy, ExternalLink, MessageSquare, Download, Search, X, Heart } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '../ui/Base';
import Lenis from 'lenis';

const InteractionsTab = ({ guests, handleCopyText }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('music'); // 'music' | 'guestbook'

    // Pagination state
    const [visibleMusic, setVisibleMusic] = useState(15);
    const [visibleGuestbook, setVisibleGuestbook] = useState(15);

    const musicObserverRef = useRef(null);
    const guestbookObserverRef = useRef(null);

    // Lenis specific refs
    const musicScrollWrapperRef = useRef(null);
    const musicScrollContentRef = useRef(null);
    const guestbookScrollWrapperRef = useRef(null);
    const guestbookScrollContentRef = useRef(null);

    // Deep search split by words
    const searchTerms = useMemo(() => searchQuery.toLowerCase().split(' ').filter(Boolean), [searchQuery]);

    const musicGuests = useMemo(() => {
        if (!searchTerms.length) return guests.filter(g => g.music_suggestions);
        return guests.filter(g => {
            if (!g.music_suggestions) return false;
            const searchString = `${g.name} ${g.music_suggestions.songs?.join(' ')} ${g.music_suggestions.link || ''}`.toLowerCase();
            return searchTerms.every(term => searchString.includes(term));
        });
    }, [guests, searchTerms]);

    const guestbookGuests = useMemo(() => {
        if (!searchTerms.length) return guests.filter(g => g.guestbook_message);
        return guests.filter(g => {
            if (!g.guestbook_message) return false;
            const searchString = `${g.name} ${g.guestbook_message}`.toLowerCase();
            return searchTerms.every(term => searchString.includes(term));
        });
    }, [guests, searchTerms]);

    // Reset pagination on search or tab change
    useEffect(() => {
        setVisibleMusic(15);
        setVisibleGuestbook(15);
    }, [searchQuery, activeTab]);

    // Infinite scroll observers
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setVisibleMusic(prev => prev + 15);
                }
            },
            { threshold: 0.1 }
        );
        if (musicObserverRef.current) observer.observe(musicObserverRef.current);
        return () => observer.disconnect();
    }, [musicGuests.length]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    setVisibleGuestbook(prev => prev + 15);
                }
            },
            { threshold: 0.1 }
        );
        if (guestbookObserverRef.current) observer.observe(guestbookObserverRef.current);
        return () => observer.disconnect();
    }, [guestbookGuests.length]);

    // Lenis smooth scroll initialization for Music
    useEffect(() => {
        if (!musicScrollWrapperRef.current || !musicScrollContentRef.current) return;

        let lenis = null;
        let rafId;
        const mql = window.matchMedia('(min-width: 768px)');

        const handleResize = (e) => {
            if (e.matches) {
                if (!lenis) {
                    lenis = new Lenis({
                        wrapper: musicScrollWrapperRef.current,
                        content: musicScrollContentRef.current,
                        smoothWheel: true,
                        lerp: 0.08
                    });
                }
            } else {
                if (lenis) {
                    lenis.destroy();
                    lenis = null;
                }
            }
        };

        function raf(time) {
            if (lenis) lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        }

        handleResize(mql);
        mql.addEventListener('change', handleResize);
        rafId = requestAnimationFrame(raf);

        return () => {
            mql.removeEventListener('change', handleResize);
            cancelAnimationFrame(rafId);
            if (lenis) lenis.destroy();
        };
    }, [activeTab]);

    // Lenis smooth scroll initialization for Guestbook
    useEffect(() => {
        if (!guestbookScrollWrapperRef.current || !guestbookScrollContentRef.current) return;

        let lenis = null;
        let rafId;
        const mql = window.matchMedia('(min-width: 768px)');

        const handleResize = (e) => {
            if (e.matches) {
                if (!lenis) {
                    lenis = new Lenis({
                        wrapper: guestbookScrollWrapperRef.current,
                        content: guestbookScrollContentRef.current,
                        smoothWheel: true,
                        lerp: 0.08
                    });
                }
            } else {
                if (lenis) {
                    lenis.destroy();
                    lenis = null;
                }
            }
        };

        function raf(time) {
            if (lenis) lenis.raf(time);
            rafId = requestAnimationFrame(raf);
        }

        handleResize(mql);
        mql.addEventListener('change', handleResize);
        rafId = requestAnimationFrame(raf);

        return () => {
            mql.removeEventListener('change', handleResize);
            cancelAnimationFrame(rafId);
            if (lenis) lenis.destroy();
        };
    }, [activeTab]);

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Suggestions Musicales", 14, 22);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28);

        const tableData = musicGuests.flatMap(g =>
            g.music_suggestions.songs.map(song => [
                g.name,
                song,
                g.music_suggestions.link || '-'
            ])
        );

        autoTable(doc, {
            startY: 35,
            head: [['Invité', 'Chanson', 'Lien']],
            body: tableData,
            theme: 'plain',
            headStyles: { fillColor: [24, 24, 27], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2 }
        });

        doc.save("playlist_suggestions.pdf");
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 pb-10 min-h-screen"
        >
            {/* Header with Global Search (Minimalist) */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-card md:rounded-[1rem] rounded-[1.5rem] shadow-sm border border-border p-2">
                <div className="relative flex-1 w-full lg:max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        type="text"
                        placeholder="Rechercher (invité, chanson, message)..."
                        className="w-full pl-11 pr-10 h-12 bg-transparent text-[13px] font-medium text-foreground placeholder:text-muted-foreground outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3 px-5 py-2 bg-background border border-border rounded-[1rem] shadow-inner w-full md:w-auto justify-between md:justify-center">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Interactions</p>
                    <div className="w-px h-4 bg-border hidden md:block" />
                    <p className="text-[13px] font-black text-foreground">{musicGuests.length + guestbookGuests.length}</p>
                </div>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="md:hidden flex p-1 bg-card/90 backdrop-blur-md rounded-2xl border border-border mb-6 shadow-md lg:relative overflow-hidden sticky top-20 z-40">
                <button
                    onClick={() => setActiveTab('music')}
                    className={cn(
                        "flex-1 py-3 text-[13px] font-bold tracking-wide rounded-xl transition-all z-10",
                        activeTab === 'music' ? "text-primary" : "text-muted-foreground"
                    )}
                >
                    Musique ({musicGuests.length})
                </button>
                <button
                    onClick={() => setActiveTab('guestbook')}
                    className={cn(
                        "flex-1 py-3 text-[13px] font-bold tracking-wide rounded-xl transition-all z-10",
                        activeTab === 'guestbook' ? "text-rose-500" : "text-muted-foreground"
                    )}
                >
                    Livre d'Or ({guestbookGuests.length})
                </button>
                {/* Active pill background */}
                <div
                    className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background border border-border/50 rounded-xl shadow-sm transition-transform duration-300 ease-spring"
                    style={{
                        transform: activeTab === 'music' ? 'translateX(0)' : 'translateX(calc(100% + 4px))',
                        boxShadow: activeTab === 'music' ? '0 2px 8px -2px rgba(192,144,80,0.1)' : '0 2px 8px -2px rgba(244,63,94,0.1)'
                    }}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 xl:gap-8 items-start">
                {/* Music Section */}
                <div className={cn("flex-col gap-6", activeTab === 'music' ? "flex" : "hidden md:flex")}>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-border/50 relative overflow-hidden shrink-0">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="flex items-center gap-3 group relative z-10">
                            <div className="w-10 h-10 rounded-[1rem] bg-primary/10 text-primary flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
                                <Music size={18} />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-foreground leading-tight">Musique</h3>
                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">{musicGuests.length} suggestion{musicGuests.length > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                        <button
                            onClick={exportToPDF}
                            disabled={musicGuests.length === 0}
                            className="relative z-10 h-10 px-5 bg-background border border-border text-foreground hover:bg-primary/5 hover:text-primary hover:border-primary/20 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-30 shadow-sm hover:-translate-y-0.5"
                        >
                            <Download size={14} className="text-primary" />
                            PDF
                        </button>
                    </div>

                    {/* List */}
                    <div ref={musicScrollWrapperRef} className="md:max-h-[600px] md:overflow-y-auto custom-scrollbar md:pr-2 md:-mr-2">
                        <motion.div ref={musicScrollContentRef} variants={containerVariants} initial="hidden" animate="show" className="space-y-1">
                            {musicGuests.length > 0 ? (
                                <>
                                    {musicGuests.slice(0, visibleMusic).map((g, index) => (
                                        <motion.div
                                            variants={itemVariants}
                                            key={g.id}
                                            className={cn(
                                                "bg-card group hover:bg-primary/5 border border-transparent hover:border-primary/20 relative shadow-sm px-5 py-4 transition-all duration-300 flex flex-col xl:flex-row xl:items-center justify-between gap-4",
                                                index === 0 ? 'rounded-t-[1.8rem]' : 'rounded-lg',
                                                index === Math.min(visibleMusic, musicGuests.length) - 1 ? 'rounded-b-[1.8rem]' : 'rounded-lg',
                                                Math.min(visibleMusic, musicGuests.length) === 1 && 'rounded-[1.8rem]'
                                            )}
                                        >
                                            {/* Infos left */}
                                            <div className="flex items-center gap-4 min-w-0 pr-2">
                                                <div className="w-10 h-10 rounded-[1rem] bg-background border border-border flex items-center justify-center text-foreground text-[12px] font-bold shadow-sm shrink-0 transition-all group-hover:scale-105 group-hover:text-primary group-hover:border-primary/30">
                                                    {g.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[14px] font-bold text-foreground leading-tight truncate">{g.name}</span>
                                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                                        {g.music_suggestions.songs?.map((song, i) => (
                                                            <span key={i} className="text-[11px] font-semibold text-foreground/80 bg-background border border-border/50 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 truncate max-w-full transition-all group-hover:border-primary/20 group-hover:bg-primary/5 cursor-default">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                                                <span className="truncate">{song}</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions right */}
                                            <div className="flex items-center justify-end gap-2 xl:opacity-0 xl:group-hover:opacity-100 transition-opacity shrink-0">
                                                {g.music_suggestions.link && (
                                                    <a
                                                        href={g.music_suggestions.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="h-10 px-4 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-colors flex items-center border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground shadow-sm hover:-translate-y-0.5"
                                                    >
                                                        <ExternalLink size={14} className="mr-2" />
                                                        Lien
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleCopyText(`${g.music_suggestions.songs.join(', ')}${g.music_suggestions.link ? ` - Lien: ${g.music_suggestions.link}` : ''}`, "Playlist")}
                                                    className="w-10 h-10 flex items-center justify-center rounded-xl shadow-sm border border-border bg-background text-muted-foreground hover:text-primary hover:border-primary/50 transition-all hover:-translate-y-0.5"
                                                    title="Copier"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {visibleMusic < musicGuests.length && (
                                        <div ref={musicObserverRef} className="h-12 flex items-center justify-center mt-2">
                                            <span className="w-5 h-5 border-2 border-primary/50 border-t-primary rounded-full animate-spin"></span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <motion.div variants={itemVariants} className="py-20 flex flex-col items-center justify-center text-center bg-card rounded-[2rem] border border-border shadow-sm">
                                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
                                        <Music size={32} className="text-primary/30 mb-4" />
                                    </motion.div>
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Aucune suggestion</p>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </div>

                {/* Guestbook Section */}
                <div className={cn("flex-col gap-6", activeTab === 'guestbook' ? "flex" : "hidden md:flex")}>
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-border/50 relative overflow-hidden shrink-0">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="flex items-center gap-3 group relative z-10">
                            <div className="w-10 h-10 rounded-[1rem] bg-rose-500/10 text-rose-500 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
                                <MessageSquare size={18} />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-extrabold text-foreground leading-tight">Livre d'Or</h3>
                                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">{guestbookGuests.length} message{guestbookGuests.length > 1 ? 's' : ''}</p>
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    <div ref={guestbookScrollWrapperRef} className="md:max-h-[600px] md:overflow-y-auto custom-scrollbar md:pr-2 md:-mr-2">
                        <motion.div ref={guestbookScrollContentRef} variants={containerVariants} initial="hidden" animate="show" className="space-y-1">
                            {guestbookGuests.length > 0 ? (
                                <>
                                    {guestbookGuests.slice(0, visibleGuestbook).map((g, index) => (
                                        <motion.div
                                            variants={itemVariants}
                                            key={g.id}
                                            className={cn(
                                                "bg-card group hover:bg-rose-500/5 border border-transparent hover:border-rose-500/20 relative shadow-sm px-6 py-5 transition-all duration-300 flex flex-col gap-4",
                                                index === 0 ? 'rounded-t-[1.8rem]' : 'rounded-lg',
                                                index === Math.min(visibleGuestbook, guestbookGuests.length) - 1 ? 'rounded-b-[1.8rem]' : 'rounded-lg',
                                                Math.min(visibleGuestbook, guestbookGuests.length) === 1 && 'rounded-[1.8rem]'
                                            )}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 min-w-0 pr-2">
                                                    <div className="w-10 h-10 rounded-[1rem] bg-background border border-border flex items-center justify-center text-foreground text-[12px] font-bold shadow-sm shrink-0 transition-all group-hover:scale-105 group-hover:text-rose-500 group-hover:border-rose-500/30">
                                                        {g.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <span className="text-[14px] font-bold text-foreground leading-tight truncate">{g.name}</span>
                                                </div>
                                                <button
                                                    onClick={() => handleCopyText(`${g.name}: ${g.guestbook_message}`, "Message")}
                                                    className="opacity-0 group-hover:opacity-100 transition-all w-10 h-10 flex items-center justify-center rounded-xl shadow-sm border border-border bg-background text-muted-foreground hover:text-rose-500 hover:border-rose-500/50 shrink-0 hover:-translate-y-0.5"
                                                    title="Copier"
                                                >
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                            <div className="pl-4 border-l-2 border-border/50 group-hover:border-rose-500/30 transition-colors ml-5 mr-2 relative">
                                                <Heart className="absolute -top-2 -right-2 text-rose-500/10 rotate-12 pointer-events-none transition-transform group-hover:scale-110" size={32} />
                                                <blockquote className="text-[13px] text-foreground/80 font-medium leading-relaxed italic relative z-10">
                                                    "{g.guestbook_message}"
                                                </blockquote>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {visibleGuestbook < guestbookGuests.length && (
                                        <div ref={guestbookObserverRef} className="h-12 flex items-center justify-center mt-2">
                                            <span className="w-5 h-5 border-2 border-rose-500/50 border-t-rose-500 rounded-full animate-spin"></span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <motion.div variants={itemVariants} className="py-20 flex flex-col items-center justify-center text-center bg-card rounded-[2rem] border border-border shadow-sm">
                                    <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}>
                                        <MessageSquare size={32} className="text-rose-500/30 mb-4" />
                                    </motion.div>
                                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Aucun message</p>
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default InteractionsTab;
