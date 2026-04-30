import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createSwapy } from 'swapy';
import { Plus, LayoutPanelLeft, Trash2, ArrowDown, Users as UsersIcon, LayoutTemplate, X, GripVertical, Check, Search } from 'lucide-react';
import { cn } from '../ui/Base';
import { toast } from 'sonner';

export const SeatingManager = ({
    tables,
    allGuests = [],
    unplacedGuests,
    onUpdateTable,
    onCreateTable,
    onDeleteTable,
    selectedTableId,
    onSelectTable,
    onAssignGuest,
    onEditGuest,
}) => {
    const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false);
    const [guestToPlace, setGuestToPlace] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [tableSearchQuery, setTableSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('tables');

    // Info about selected table
    const selectedTable = useMemo(() => tables.find(t => t.id === selectedTableId), [tables, selectedTableId]);

    // Calculate aggregated stats
    const totalCapacity = tables.reduce((acc, table) => acc + (parseInt(table.capacity) || 0), 0);
    const totalPlaced = allGuests.length - unplacedGuests.length;
    const occupancyRate = totalCapacity > 0 ? Math.round((totalPlaced / totalCapacity) * 100) : 0;

    // ─── Swapy Reordering ─────────────────────────────────────────────────────
    const swapyContainerRef = useRef(null);
    const swapyInstance = useRef(null);
    const [orderedTables, setOrderedTables] = useState(() => [...tables]);

    // Keep orderedTables in sync whenever tables prop changes
    useEffect(() => {
        setOrderedTables([...tables].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    }, [tables]);

    const filteredTables = useMemo(() => {
        if (!searchQuery.trim()) return orderedTables;
        const lowerQuery = searchQuery.toLowerCase();
        return orderedTables.filter(table => {
            const tableMatch = table.name?.toLowerCase().includes(lowerQuery);
            const guestsInTable = allGuests.filter(g => String(g.table_id) === String(table.id));
            const guestMatch = guestsInTable.some(g => g.name?.toLowerCase().includes(lowerQuery));
            return tableMatch || guestMatch;
        });
    }, [orderedTables, searchQuery, allGuests]);

    const filteredUnplacedGuests = useMemo(() => {
        if (!searchQuery.trim()) return unplacedGuests;
        const lowerQuery = searchQuery.toLowerCase();
        return unplacedGuests.filter(guest =>
            guest.name?.toLowerCase().includes(lowerQuery) ||
            guest.guest_type?.toLowerCase().includes(lowerQuery)
        );
    }, [unplacedGuests, searchQuery]);

    useEffect(() => {
        if (swapyContainerRef.current && filteredTables.length > 0) {
            swapyInstance.current = createSwapy(swapyContainerRef.current, {
                animation: 'dynamic', // dynamic follows cursor better if CPU is high
                config: {
                    dragAxis: 'both',
                    threshold: 50
                },
                enabled: !searchQuery.trim() // Disable swapy while searching to prevent order mess
            });

            swapyInstance.current.onSwap((event) => {
                if (searchQuery.trim()) return; // Don't process swaps while searching
                const { asArray } = event.newSlotItemMap;

                // asArray is [{slot: 'id', item: 'id'}, ...]
                // Update sort_order for each table based on its new position
                asArray.forEach((map, index) => {
                    const tableId = map.item;
                    onUpdateTable(tableId, { sort_order: index });
                });
            });

            return () => {
                swapyInstance.current?.destroy();
            };
        }
    }, [filteredTables, searchQuery]); // Re-init if order, search, or tables change

    // ─── Guest DnD state (Native) ──────────────────────────────────────────────
    const [draggedGuestId, setDraggedGuestId] = useState(null);
    const [dragOverTableId, setDragOverTableId] = useState(null);

    const handleDragStart = (e, guest) => {
        if (guest.status === 'confirmed') {
            e.preventDefault();
            toast.error("Placement verrouillé", { description: "Cet invité a déjà confirmé sa présence." });
            return;
        }
        setDraggedGuestId(guest.id);
        e.dataTransfer.setData('guestId', String(guest.id));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragEnd = () => {
        setDraggedGuestId(null);
        setDragOverTableId(null);
    };

    const handleDragOver = (e, tableId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverTableId !== tableId) setDragOverTableId(tableId);
    };

    const handleDragLeave = (e, tableId) => {
        e.preventDefault();
        if (dragOverTableId === tableId) setDragOverTableId(null);
    };

    const handleDrop = (e, tableId) => {
        e.preventDefault();
        setDragOverTableId(null);
        const guestId = e.dataTransfer.getData('guestId');
        if (guestId) {
            const parsedGuestId = !isNaN(guestId) ? Number(guestId) : guestId;
            onAssignGuest(parsedGuestId, tableId);
        }
    };

    const closeTableSelector = () => {
        setIsTableSelectorOpen(false);
        setGuestToPlace(null);
        setTableSearchQuery('');
    };

    return (
        <div className="flex flex-col xl:flex-row gap-6 xl:h-[calc(100vh-140px)] min-h-[600px] h-auto pb-10">
            {/* ─── MOBILE HEADER (SEARCH + TABS) ───────────────────────── */}
            <div className="xl:hidden flex flex-col gap-4 shrink-0">
                <div className="relative w-full">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Rechercher table ou invité..."
                        className="w-full pl-11 pr-10 py-4 bg-card border border-border lg:rounded-[1.5rem] rounded-full text-[14px] font-medium outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X size={18} />
                        </button>
                    )}
                </div>

                <div className="flex p-1 bg-card/90 backdrop-blur-md rounded-2xl border border-border mb-6 shadow-md lg:relative overflow-hidden sticky top-20 z-40">
                    <button
                        onClick={() => setActiveTab('tables')}
                        className={cn(
                            "flex-1 py-3 text-[13px] font-bold tracking-wide rounded-xl transition-all z-10",
                            activeTab === 'tables' ? "text-primary" : "text-muted-foreground"
                        )}
                    >
                        <div className="flex items-center justify-center gap-1">
                            <LayoutTemplate size={14} />
                            Tables ({tables.length})
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('guests')}
                        className={cn(
                            "flex-1 py-3 text-[13px] font-bold tracking-wide rounded-xl transition-all z-10",
                            activeTab === 'guests' ? "text-emerald-500" : "text-muted-foreground"
                        )}
                    >
                        <div className="flex items-center justify-center gap-1">
                            <UsersIcon size={14} />
                            À placer ({unplacedGuests.length})
                        </div>
                    </button>
                    {/* Active pill background */}
                    <div
                        className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-background border border-border/50 rounded-xl shadow-sm transition-transform duration-300 ease-spring"
                        style={{
                            transform: activeTab === 'tables' ? 'translateX(0)' : 'translateX(calc(100% + 4px))',
                            boxShadow: activeTab === 'guests' ? '0 2px 8px -2px rgba(192,144,80,0.1)' : '0 2px 8px -2px rgba(244,63,94,0.1)'
                        }}
                    />
                </div>
            </div>

            {/* ─── TABLES GRID AREA ────────────────────────────────────── */}
            <div className={cn(
                "flex-1 flex flex-col min-w-0 bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden",
                activeTab !== 'tables' && "hidden xl:flex"
            )}>
                {/* Header */}
                <div className="px-6 py-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-extrabold text-foreground tracking-tight">Tables de la salle</h3>
                        <div className="flex items-center gap-3 mt-1.5">
                            <p className="text-[13px] font-medium text-muted-foreground">{tables.length} tables créées</p>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                            <p className="text-[13px] font-bold text-primary">{occupancyRate}% d'occupation</p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        {/* Search Input (Desktop only) */}
                        <div
                            className="hidden xl:block relative w-full sm:w-64 lg:w-72"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-muted-foreground" />
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher une table, un invité..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 bg-card border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/10 rounded-xl text-[13px] outline-none transition-all placeholder:text-muted-foreground/70"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCreateTable();
                            }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-5 py-2.5 rounded-xl text-[12px] font-semibold transition-all shadow-lg shadow-primary/10 active:scale-95 shrink-0"
                        >
                            <Plus size={16} />
                            Nouvelle Table
                        </button>
                    </div>
                </div>

                {/* Tables Grid Area */}
                <div
                    className="flex-1 overflow-y-auto p-2 lg:p-6 custom-scrollbar"
                    data-lenis-prevent
                    onClick={() => onSelectTable(null)}
                >
                    {tables.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <div className="w-20 h-20 rounded-[2rem] bg-muted flex items-center justify-center mb-5 border border-border">
                                <LayoutTemplate size={32} className="text-muted-foreground/30" />
                            </div>
                            <p className="text-[14px] font-bold text-foreground">Aucune table créée</p>
                            <p className="text-[12px] mt-1 mb-5">Commencez par ajouter votre première table</p>
                            <button
                                onClick={() => onCreateTable()}
                                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-[12px] font-bold uppercase tracking-wider shadow-lg shadow-primary/20 hover:opacity-90 transition-colors"
                            >
                                Créer une table
                            </button>
                        </div>
                    ) : (
                        <div ref={swapyContainerRef} className="columns-1 md:columns-2 lg:columns-3 gap-5 select-none">
                            <AnimatePresence initial={false}>
                                {filteredTables.length === 0 && searchQuery ? (
                                    <div className="col-span-full py-10 flex flex-col items-center justify-center text-muted-foreground">
                                        <Search size={32} className="text-muted-foreground/30 mb-3" />
                                        <p className="text-[14px] font-bold text-foreground">Aucun résultat</p>
                                        <p className="text-[12px] mt-1">Aucune table ou invité ne correspond à "{searchQuery}"</p>
                                    </div>
                                ) : null}
                                {filteredTables.map(table => {
                                    const tableCapacity = parseInt(table.capacity) || 1;
                                    const tableGuests = allGuests.filter(g => String(g.table_id) === String(table.id));
                                    const isSelected = String(selectedTableId) === String(table.id);
                                    const isFull = tableGuests.length >= tableCapacity;
                                    const fillPercentage = Math.min((tableGuests.length / tableCapacity) * 100, 100);

                                    return (
                                        <div key={table.id} data-swapy-slot={table.id} className="mb-5 break-inside-avoid">
                                            <div
                                                data-swapy-item={table.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onSelectTable(table.id);
                                                }}
                                                onDragOver={(e) => handleDragOver(e, table.id)}
                                                onDragLeave={(e) => handleDragLeave(e, table.id)}
                                                onDrop={(e) => handleDrop(e, table.id)}
                                                className={cn(
                                                    "relative bg-card rounded-[2rem] overflow-hidden border cursor-pointer flex flex-col transition-all duration-300",
                                                    String(dragOverTableId) === String(table.id)
                                                        ? "border-primary shadow-2xl ring-4 ring-primary/10 z-10 scale-[1.02]"
                                                        : isSelected
                                                            ? "border-primary shadow-xl shadow-primary/5 ring-4 ring-primary/5"
                                                            : "border-border/40 hover:border-border shadow-sm hover:shadow-md"
                                                )}
                                            >
                                                {/* Card Header */}
                                                <div className="flex justify-between items-start mb-4 px-5 pt-5 relative">
                                                    <div className="flex items-center gap-3">
                                                        {/* Drag handle */}
                                                        <div
                                                            data-swapy-handle
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="p-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors shrink-0 -ml-1 touch-none"
                                                            title="Réorganiser"
                                                        >
                                                            <GripVertical size={16} />
                                                        </div>
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                                            isSelected ? "bg-primary text-primary-foreground shadow-inner shadow-black/10" : "bg-muted text-muted-foreground border border-border"
                                                        )}>
                                                            <LayoutPanelLeft size={18} />
                                                        </div>
                                                        <div>
                                                            <h4 className="text-[14px] font-bold text-foreground leading-none">{table.name}</h4>
                                                            <p className="text-[11px] font-medium text-muted-foreground mt-1.5">
                                                                {tableGuests.length} / {tableCapacity} Occupés
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteTable(table.id, table.name);
                                                            }}
                                                            className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                                                            title="Supprimer la table"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Mobile Placement Button */}
                                                <div className="xl:hidden px-5 mb-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSelectTable(table.id);
                                                            setActiveTab('guests');
                                                        }}
                                                        className={cn(
                                                            "w-full py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
                                                            isSelected
                                                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                                : "bg-muted text-muted-foreground border border-border"
                                                        )}
                                                    >
                                                        <Plus size={14} strokeWidth={3} />
                                                        {isSelected ? "Prêt à placer" : "Ajouter des invités"}
                                                    </button>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="px-5">
                                                    <div className="w-full h-[2px] bg-muted overflow-hidden mb-4 rounded-full">
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-700 ease-out",
                                                                isFull ? "bg-emerald-500" : isSelected ? "bg-primary" : "bg-muted-foreground/40"
                                                            )}
                                                            style={{ width: `${fillPercentage}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Guest List container */}
                                                <div className="flex-1 space-y-1 p-2 min-h-[120px]">
                                                    {tableGuests.length === 0 ? (
                                                        <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-[13px] font-medium text-muted-foreground/50">
                                                            <span className="text-3xl mb-2">🍽️</span>
                                                            Table vide
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            {tableGuests.map(guest => {
                                                                const isLocked = guest.status === 'confirmed';
                                                                return (
                                                                    <div
                                                                        key={guest.id}
                                                                        draggable={!isLocked}
                                                                        onDragStart={(e) => handleDragStart(e, guest)}
                                                                        onDragEnd={handleDragEnd}
                                                                        className={cn(
                                                                            "group flex items-center justify-between px-3 py-1.5 rounded-[1rem] transition-colors cursor-grab active:cursor-grabbing",
                                                                            isSelected ? "hover:bg-primary/5" : "hover:bg-muted/50",
                                                                            String(draggedGuestId) === String(guest.id) ? "opacity-30 scale-[0.97]" : "",
                                                                            isLocked && "cursor-not-allowed opacity-80"
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-3 min-w-0 pointer-events-none">
                                                                            <div className={cn(
                                                                                "w-2 h-2 rounded-full shrink-0",
                                                                                isLocked ? "bg-emerald-500" : isSelected ? "bg-primary" : "bg-muted-foreground/30"
                                                                            )} />
                                                                            <div className="flex flex-col min-w-0">
                                                                                <span className={cn(
                                                                                    "text-[13px] font-semibold truncate transition-colors",
                                                                                    searchQuery && guest.name.toLowerCase().includes(searchQuery.toLowerCase())
                                                                                        ? "text-primary bg-primary/10 px-1.5 py-0.5 -mx-1.5 rounded-md"
                                                                                        : "text-foreground"
                                                                                )}>
                                                                                    {guest.name}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        {/* Remove from table btn */}
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                if (isLocked) {
                                                                                    toast.error("Action impossible", { description: "Le placement d'un invité confirmé ne peut pas être modifié." });
                                                                                    return;
                                                                                }
                                                                                onAssignGuest(guest.id, null);
                                                                            }}
                                                                            title={isLocked ? "Placement verrouillé" : "Retirer de la table"}
                                                                            className={cn(
                                                                                "p-1.5 rounded-full transition-colors xl:opacity-0 xl:group-hover:opacity-100 opacity-100",
                                                                                isLocked ? "text-muted-foreground/20 cursor-not-allowed" : "text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                                                                            )}
                                                                        >
                                                                            {isLocked ? <Check size={14} className="text-emerald-500" /> : <X size={14} />}
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── SIDEBAR: UNPLACED GUESTS ────────────────────────────── */}
            <div id="unplaced-guests-section" className={cn(
                "w-full xl:w-[350px] xl:h-full shrink-0 flex flex-col bg-card rounded-[2rem] border border-border shadow-sm overflow-hidden min-h-[500px]",
                activeTab !== 'guests' && "hidden xl:flex"
            )}>
                {/* Header */}
                <div className="px-6 py-6 pb-2">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-extrabold text-foreground tracking-tight">À placer</h3>
                        <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-bold">{unplacedGuests.length}</span>
                    </div>
                    <p className="text-[13px] text-muted-foreground font-medium leading-relaxed">
                        Sélectionnez une table, puis ajoutez-y vos invités.
                    </p>
                </div>

                {/* State Indicator (Toast-like) */}
                <div className="px-4 mt-2 mb-2">
                    {selectedTable ? (
                        <div className="p-3 bg-zinc-950 rounded-[1.2rem] text-white shadow-xl flex items-center gap-3 border border-zinc-800">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                                <ArrowDown size={14} strokeWidth={3} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-0.5">Mode Placement Actif</p>
                                <p className="text-[13px] font-bold text-white truncate">{selectedTable.name}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-3 bg-muted/50 rounded-[1.2rem] flex items-center gap-3 border border-transparent">
                            <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center text-muted-foreground shrink-0">
                                <LayoutPanelLeft size={14} />
                            </div>
                            <div>
                                <p className="text-[12px] font-medium text-muted-foreground leading-snug">Sélectionnez une table pour placer vos invités.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar" data-lenis-prevent>
                    {filteredUnplacedGuests.map(guest => {
                        const isLocked = guest.status === 'confirmed';
                        return (
                            <div
                                key={guest.id}
                                draggable={!isLocked}
                                onDragStart={(e) => handleDragStart(e, guest)}
                                onDragEnd={handleDragEnd}
                                className={cn(
                                    "group flex items-center justify-between p-3 rounded-[1.2rem] transition-all text-left",
                                    "hover:bg-muted/50 cursor-grab active:cursor-grabbing",
                                    String(draggedGuestId) === String(guest.id) ? "opacity-40 scale-[0.98]" : "",
                                    isLocked && "cursor-not-allowed opacity-80"
                                )}
                                onClick={() => {
                                    if (isLocked) {
                                        toast.error("Placement verrouillé", { description: "Cet invité a déjà confirmé." });
                                        return;
                                    }
                                    if (tables.length === 0) {
                                        toast.error("Action impossible", {
                                            description: "Aucune table n'est encore disponible. Veuillez en créer une d'abord dans l'onglet 'Placement'."
                                        });
                                        return;
                                    }
                                    if (selectedTableId) {
                                        onAssignGuest(guest.id, selectedTableId);
                                    } else {
                                        setGuestToPlace(guest);
                                        setIsTableSelectorOpen(true);
                                    }
                                }}
                            >
                                <div className="flex items-center gap-3 min-w-0 pointer-events-none">
                                    <div className={cn(
                                        "w-9 h-9 rounded-xl font-bold text-[12px] flex items-center justify-center shrink-0 transition-colors",
                                        selectedTableId ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground/50",
                                        guest.status === 'confirmed' && "bg-emerald-500/10 text-emerald-500",
                                        guest.status === 'declined' && "bg-rose-500/10 text-rose-500"
                                    )}>
                                        {guest.name[0]?.toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-bold text-foreground truncate">{guest.name}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium truncate">
                                                {guest.guest_type || 'Invité'}
                                            </p>
                                            {isLocked && <span className="text-[9px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded-md font-bold">CONFIRMÉ</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {selectedTableId && !isLocked && (
                                        <div className="xl:flex hidden w-7 h-7 rounded-full bg-muted border border-border items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors shrink-0">
                                            <Plus size={14} />
                                        </div>
                                    )}
                                    <button className={cn(
                                        "xl:hidden px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all",
                                        selectedTableId && !isLocked
                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                            : "bg-muted text-muted-foreground border border-border"
                                    )}>
                                        {isLocked ? "Bloqué" : selectedTableId ? "Placer" : "Bloqué"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {filteredUnplacedGuests.length === 0 && (
                        <div className="py-16 text-center text-muted-foreground flex flex-col items-center">
                            <div className={cn(
                                "w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4 transition-colors",
                                searchQuery ? "bg-muted text-muted-foreground/30" : "bg-emerald-500/10 text-emerald-500"
                            )}>
                                {searchQuery ? <Search size={24} /> : <UsersIcon size={24} />}
                            </div>
                            <p className="text-[13px] font-bold text-foreground">
                                {searchQuery ? "Aucun invité trouvé" : "Tous les invités sont placés"}
                            </p>
                            <p className="text-[11px] font-medium text-muted-foreground mt-1">
                                {searchQuery ? "Essayez une autre recherche" : "Excellent travail !"}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── TABLE SELECTOR MODAL ────────────────────────────────── */}
            <AnimatePresence>
                {isTableSelectorOpen && (
                    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeTableSelector}
                            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-card w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative z-20 flex flex-col border border-border"
                        >
                            <div className="p-6 flex items-center justify-between pb-4">
                                <div>
                                    <h3 className="text-[18px] font-extrabold text-foreground">Placer cet invité</h3>
                                    <p className="text-[13px] text-muted-foreground font-medium mt-1">Sélectionnez une table pour <strong className="text-foreground">{guestToPlace?.name}</strong></p>
                                </div>
                                <button onClick={closeTableSelector} className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Table Search */}
                            <div className="px-6 pb-2">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        placeholder="Rechercher une table..."
                                        value={tableSearchQuery}
                                        onChange={(e) => setTableSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-transparent focus:border-primary/50 focus:bg-background rounded-xl text-[13px] outline-none transition-all placeholder:text-muted-foreground/70"
                                    />
                                </div>
                            </div>

                            <div className="p-4 overflow-y-auto max-h-[350px] space-y-1.5 custom-scrollbar">
                                {tables
                                    .filter(t => t.name.toLowerCase().includes(tableSearchQuery.toLowerCase()))
                                    .map(table => {
                                        const tableGuests = allGuests.filter(g => String(g.table_id) === String(table.id));
                                        const isFull = tableGuests.length >= (parseInt(table.capacity) || 0);

                                        return (
                                            <button
                                                key={table.id}
                                                disabled={isFull}
                                                onClick={() => {
                                                    onAssignGuest(guestToPlace.id, table.id);
                                                    closeTableSelector();
                                                    setActiveTab('tables');
                                                }}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-3 rounded-[1.2rem] transition-all text-left group",
                                                    isFull
                                                        ? "bg-transparent opacity-50 cursor-not-allowed"
                                                        : "bg-transparent hover:bg-muted/50"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                        isFull ? "bg-muted text-muted-foreground/30" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                                                    )}>
                                                        <LayoutPanelLeft size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-bold text-foreground">{table.name}</p>
                                                        <p className="text-[11px] text-muted-foreground font-medium">
                                                            {tableGuests.length} / {table.capacity} Personnes
                                                        </p>
                                                    </div>
                                                </div>
                                                {!isFull && <Plus size={16} className="text-muted-foreground/30 group-hover:text-primary transition-colors" />}
                                                {isFull && <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pleine</span>}
                                            </button>
                                        );
                                    })}

                                {tables.filter(t => t.name.toLowerCase().includes(tableSearchQuery.toLowerCase())).length === 0 && (
                                    <div className="py-10 text-center text-muted-foreground flex flex-col items-center">
                                        <Search size={24} className="opacity-20 mb-2" />
                                        <p className="text-[13px] font-medium">Aucune table ne correspond</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <button
                                    onClick={() => {
                                        closeTableSelector();
                                        onCreateTable();
                                    }}
                                    className="w-full py-4 rounded-[1.2rem] bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-[13px] font-bold transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} />
                                    Créer une table
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
