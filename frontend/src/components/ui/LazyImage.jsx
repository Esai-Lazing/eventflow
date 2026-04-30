import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LazyImage = ({ src, alt, className, style, placeholderSrc, fit = 'cover', position = 'center' }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // Auto-resolve thumbnail if not provided, but only for local assets (not API or external URLs)
  const thumb = placeholderSrc || (
    typeof src === 'string' && !src.includes('/api/') && !src.startsWith('http')
    ? src.replace(/\.(png|jpe?g|webp)$/i, '.thumb.webp') 
    : null
  );

  // Determine if it's already in cache
  useEffect(() => {
    const img = new Image();
    img.src = src;
    if (img.complete) {
      setIsLoaded(true);
      setShowPlaceholder(false);
    }
  }, [src]);

  return (
    <div className={`relative ${className}`} style={style}>
      {/* Placeholder anim\u00e9 (shimmer) */}
      <AnimatePresence>
        {showPlaceholder && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-10"
          >
            <div
              className="w-full h-full bg-stone-100/30 flex items-center justify-center overflow-hidden"
              style={{
                backgroundImage: thumb ? `url(${thumb})` : 'none',
                backgroundSize: fit,
                backgroundPosition: position,
                filter: 'blur(8px)', // Lower blur is cheaper
              }}
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent translate-x-[-150%] animate-[shimmer_2.5s_infinite]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image R\u00e9elle */}
      <motion.img
        src={src}
        alt={alt}
        onLoad={() => {
          setIsLoaded(true);
          setTimeout(() => setShowPlaceholder(false), 200);
        }}
        onError={() => {
          setIsLoaded(true);
          setShowPlaceholder(false);
        }}
        initial={{ opacity: 0 }}
        animate={{
          opacity: isLoaded ? 1 : 0,
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`w-full h-full transition-all duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ objectFit: fit, objectPosition: position, select: 'none' }}
        loading="lazy"
      />

      <style>{`
        @keyframes shimmer {
            100% { transform: translateX(150%) skewX(12deg); }
        }
      `}</style>
    </div>
  );
};

export default LazyImage;
