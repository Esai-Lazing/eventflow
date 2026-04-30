import React from 'react';
import WeddingContent from './WeddingContent';
import LazyImage from '@/components/ui/LazyImage';

const HeroWedding = ({ data }) => {
    const defaultPhoto = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800";
    const photo = data.couplePhoto || defaultPhoto;

    return (
        <section className="relative w-full min-h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-soft)' }}>
            <div className="w-full absolute z-0 h-screen md:h-screen ">
                <LazyImage
                    fit='cover'
                    className='w-full h-full select-none!'
                    src={photo}
                    alt={`${data.bride || ''} & ${data.groom || ''}`}
                />
            </div>

            <div className="w-full md:w-full min-h-screen pl-0 md:pl-16 md:h-screen relative bg-surface/80 backdrop-blur-lg">
                <WeddingContent data={data} />
            </div>
        </section>
    );
};

export default HeroWedding;
