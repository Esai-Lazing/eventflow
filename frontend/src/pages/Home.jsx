import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button, cn } from '../components/ui/Base';
import floralTR from '../assets/flowers/Plantilla-1.avif';
import floralBL from '../assets/flowers/Plantilla-2.avif';

const Home = () => {
    return (
        <div className="relative min-h-screen overflow-hidden selection:bg-amber-100 selection:text-amber-900 font-sans flex flex-col">
            {/* Soft Premium Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0.4)_0%,transparent_70%)] pointer-events-none" />

            {/* Floral Decorations */}
            <motion.img
                src={floralTR}
                alt=""
                className="fixed top-0 right-0 w-[300px] md:w-[500px] z-0 pointer-events-none opacity-20"
                initial={{ opacity: 0, x: 50, y: -50 }}
                animate={{ opacity: 0.2, x: 0, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            />
            <motion.img
                src={floralBL}
                alt=""
                className="fixed bottom-0 left-0 w-[300px] md:w-[500px] z-0 pointer-events-none opacity-20"
                initial={{ opacity: 0, x: -50, y: 50 }}
                animate={{ opacity: 0.2, x: 0, y: 0 }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            />


            {/* <nav className="relative z-20 p-8 flex items-center justify-between max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2D1B0D] rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/20">
                        <Sparkles className="text-[#D8A872]" size={20} />
                    </div>
                    <span className="text-2xl font-black text-[#2D1B0D] tracking-tight">Invitation</span>
                </div>
                <Link to="/login" className="text-xs font-bold text-[#2D1B0D]/60 hover:text-[#2D1B0D] transition-all tracking-[0.2em] uppercase bg-white/20 backdrop-blur-sm px-6 py-2.5 rounded-full border border-white/40">
                    Connexion
                </Link>
            </nav> */}

            <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 text-center max-w-5xl mx-auto pt-10">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="mb-8 inline-flex items-center gap-3 px-5 py-2.5 bg-white/30 backdrop-blur-xl rounded-full border border-white/40 shadow-sm"
                >
                    <span className="flex h-2 w-2 rounded-full bg-amber-600 animate-pulse" />
                    <span className="text-xs font-bold text-[#4a2e15]">La Haute Couture de l'Invitation</span>
                </motion.div>

                <motion.h1
                    className="text-6xl md:text-8xl font-semibold text-[#2D1B0D] leading-[0.95] tracking-tighter mb-10"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                >
                    Créez des invitations <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#92400e] via-[#f59e0b] to-[#92400e]">uniques et élégantes</span>
                </motion.h1>

                <motion.p
                    className="text-lg md:text-2xl text-[#4a2e15]/80 font-medium leading-relaxed mb-14 max-w-3xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    Créez des invitations numériques qui capturent l'essence de votre événement.
                    Une expérience raffinée, du design à la gestion des invités.
                </motion.p>

                <motion.div
                    className="flex flex-col items-center gap-6"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                >
                    <Link to="/create" className="group">
                        <Button className="py-4 px-6 md:py-6 md:px-10 rounded-full text-lg md:text-xl bg-[#2D1B0D] text-white shadow-xl shadow-amber-900/10 hover:bg-[#3D2B1D] hover:scale-105 active:scale-95 transition-all duration-500 flex items-center gap-6 group">
                            Créer mon invitation
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                                <ArrowRight className="text-white" size={20} />
                            </div>
                        </Button>
                    </Link>
                    <p className="text-xs font-medium text-[#2D1B0D]/40 uppercase tracking-widest">Sans carte bancaire — Essai gratuit</p>
                </motion.div>

                {/* Feature Cards Grid */}
                {/* <motion.div
                    className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 w-full pb-20"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 1 }}
                >
                    <FeatureCard icon={Heart} label="Mariages Prestigieux" color="text-amber-700" bg="bg-white/20" />
                    <FeatureCard icon={Gift} label="Fêtes Exclusives" color="text-amber-700" bg="bg-white/20" />
                    <FeatureCard icon={Calendar} label="Événements Corporatifs" color="text-amber-700" bg="bg-white/20" />
                </motion.div> */}
            </main>

            {/* <footer className="relative z-10 py-12 text-center text-[#2D1B0D]/40 text-[10px] font-black tracking-[0.1em] capitalize">
                © 2026 INVIATTION — L'EXCELLENCE NUMÉRIQUE
            </footer> */}
        </div>
    );
};

const FeatureCard = ({ icon: Icon, label, color, bg }) => (
    <div className={cn("group backdrop-blur-2xl p-10 rounded-3xl border border-white/40 flex flex-col items-center gap-6 transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl hover:shadow-amber-900/10", bg)}>
        <div className={cn("p-6 rounded-2xl bg-white/40 shadow-xl shadow-amber-900/5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", color)}>
            <Icon size={32} />
        </div>
        <span className="text-sm font-medium text-[#2D1B0D] tracking-widest">{label}</span>
    </div>
);

export default Home;
