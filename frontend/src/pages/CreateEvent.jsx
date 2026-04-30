import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../components/ui/Base';

import mariage from '../assets/steps/mariage.webp';
import anniversaire from '../assets/steps/anniversaire.webp';
import conference from '../assets/steps/conference.webp';
import fete from '../assets/steps/fete.webp';
import diplome from '../assets/steps/diplome.webp';
import naissance from '../assets/steps/baby-shower.webp';

const eventTypes = [
    { label: 'Mariage', img: mariage, route: '/create/wedding' },
    { label: 'Anniversaire', img: anniversaire, route: '/create/birthday' },
    { label: 'Conférence', img: conference, route: '/create/conference' },
    { label: 'Fête', img: fete, route: '/create/party' },
    { label: 'Remise de diplôme', img: diplome, route: '/create/graduation' },
    { label: 'Baby Shower', img: naissance, route: '/create/baby' },
];

const CreateEvent = () => {
    const navigate = useNavigate();

    return (
        <div className='min-h-screen relative overflow-hidden bg-[#FDFBF7]'>
            {/* Background Decorations */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-100/30 blur-[120px] rounded-full -mr-40 -mt-20" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-100/20 blur-[100px] rounded-full -ml-20 -mb-20" />

            <div className="container relative z-10 py-16 px-6 max-w-5xl mx-auto">
                <div className="flex flex-col gap-12">
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/')}
                            className="group flex items-center gap-2 text-dark/50 hover:text-dark transition-all font-semibold uppercase tracking-widest text-[10px]"
                        >
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Retour à l'accueil
                        </button>
                        <div className="space-y-2">
                            <h1 className="text-5xl md:text-6xl font-bold text-dark tracking-tight">
                                Quel événement <br />
                                <span className="text-amber-600">célébrez-vous ?</span>
                            </h1>
                            <p className="text-xl text-dark/40 max-w-xl font-medium">
                                Choisissez votre type d'événement pour commencer la personnalisation de votre invitation unique.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {eventTypes.map((t, idx) => (
                            <motion.button
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => navigate(t.route)}
                                className={cn(
                                    "group relative p-3 rounded-[3rem] border-2 bg-white/40 backdrop-blur-md shadow-sm hover:shadow-2xl hover:shadow-amber-900/10 transition-all duration-500 hover:-translate-y-2 border-white/60"
                                )}
                            >
                                <div className="relative overflow-hidden rounded-[2rem] aspect-4/5 bg-amber-50/50">
                                    <img
                                        src={t.img}
                                        alt={t.label}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-linear-to-t from-dark/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>
                                <div className="p-6 text-center space-y-1">
                                    <span className="block text-dark font-bold text-xl">{t.label}</span>
                                    <span className="block text-amber-600 font-bold text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
                                        Commencer
                                    </span>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateEvent;
