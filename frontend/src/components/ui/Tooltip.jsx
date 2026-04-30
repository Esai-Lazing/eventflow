import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './Base';

const Tooltip = ({ children, content, side = 'top', className }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positions = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    return (
        <div
            className="relative"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: side === 'top' ? 10 : -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: side === 'top' ? 10 : -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={cn(
                            "absolute z-100 px-3 py-1.5 bg-premium-dark text-premium-gold text-[12px] font-medium rounded-lg shadow-2xl border border-premium-gold/20 whitespace-nowrap pointer-events-none mb-2",
                            positions[side],
                            className
                        )}
                    >
                        {content}
                        <div className={cn(
                            "absolute w-2 h-2 bg-premium-dark rotate-45 border-premium-gold/20",
                            side === 'top' ? "top-full -translate-y-1/2 left-1/2 -translate-x-1/2 border-b border-r" :
                                side === 'bottom' ? "bottom-full translate-y-1/2 left-1/2 -translate-x-1/2 border-t border-l" : ""
                        )} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Tooltip;
