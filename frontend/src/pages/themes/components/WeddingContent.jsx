import React from 'react';
import LazyImage from '@/components/ui/LazyImage';
import coupleFlower from '@/assets/decorations/hero/couple-flower.png';

const WeddingContent = ({ data }) => {
    // Handle split of hosts if bride/groom not provided
    let bride = data.bride;
    let groom = data.groom;

    if (!bride && data.hosts) {
        const parts = data.hosts.split(' & ');
        bride = parts[0];
        groom = parts[1] || "";
    }

    const dateObj = new Date(data.date);
    const dayName = data.day || dateObj.toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase();
    const monthName = dateObj.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase();
    const dayNumber = dateObj.getDate();
    const year = dateObj.getFullYear();
    const time = data.time || "19:00";

    return (
        <div className="min-h-screen w-full flex select-none flex-col items-center justify-center gap-12 p-8 py-24 md:py-24 md:p-24 text-center relative z-20 overflow-hidden">
            {data?.couplePhoto && (
                <div className='w-52 h-52 md:w-96 md:h-96 relative mx-auto z-20'>
                    <div className='rounded-full overflow-hidden h-full w-full'>
                        <LazyImage
                            fit='cover'
                            className='rounded-full w-full h-full select-none!'
                            src={data.couplePhoto}
                            alt={`${bride} & ${groom}`}
                        />
                    </div>
                    {/* Flower decoration for couple */}
                    <div className="absolute -bottom-20 md:-bottom-35 w-full pointer-events-none z-20">
                        {/* Lorem, ipsum. */}
                        <LazyImage
                            fit='contain'
                            className='w-full select-none!'
                            src={coupleFlower}
                            alt={`${bride} & ${groom}`}
                        />
                    </div>
                    <div className="absolute top-1 -left-2 w-full h-full rounded-full border-2 border-white-400/30 pointer-events-none z-10"></div>
                    <div className="absolute top-1 left-1 w-full h-full rounded-full border-2 border-secondary pointer-events-none z-10"></div>
                    <div className="absolute bottom-1 -right-1 w-full h-full rounded-full border-2 border-primary/30 pointer-events-none z-10"></div>
                </div>
            )}

            <div className="relative z-10 flex items-center justify-center lg:gap-12 gap-4" style={{ color: 'var(--primary)', fontFamily: 'var(--font-main)' }}>
                <h1 className="text-5xl md:text-8xl leading-tight">
                    {bride}
                </h1>
                <p className="text-4xl md:text-8xl opacity-60">&</p>
                <h1 className="text-5xl md:text-8xl leading-tight">
                    {groom}
                </h1>
            </div>

            <div className="max-w-sm uppercase tracking-[0.3em] text-[14px] md:text-base font-serif leading-relaxed opacity-80" style={{ color: 'var(--primary)' }}>
                <p>{data.message || "Sont heureux de vous inviter à la célébration de leur mariage"}</p>
            </div>

            <div className="w-full max-w-lg relative z-10" style={{ color: 'var(--primary)' }}>
                <p className="uppercase tracking-[0.5em] font-serif text-sm font-semibold opacity-70">{monthName}</p>

                <div className="flex items-center justify-center gap-4 md:gap-8">
                    <div className="border-t border-b flex-1" style={{ borderColor: 'var(--primary)', opacity: 0.8 }}>
                        <p className="uppercase tracking-[0.2em] font-serif text-[10px] py-5 font-bold">{dayName}</p>
                    </div>
                    <div className="flex flex-col items-center min-w-[100px] -mt-2">
                        <p className="text-4xl md:text-8xl font-serif font-light leading-none">{dayNumber}</p>
                    </div>
                    <div className="border-t border-b flex-1" style={{ borderColor: 'var(--primary)', opacity: 0.8 }}>
                        <p className="uppercase tracking-[0.2em] font-serif text-[12px] py-5 font-bold">À {time}</p>
                    </div>
                </div>

                <p className="uppercase tracking-[0.5em] font-serif text-sm font-semibold opacity-70">{year}</p>
            </div>

            <p className="italic text-xl md:text-2xl font-serif opacity-80 pt-4" style={{ color: 'var(--primary)' }}>
                {data.reception || "Soyez les bienvenus"}
            </p>
        </div>
    );
};

export default WeddingContent;
