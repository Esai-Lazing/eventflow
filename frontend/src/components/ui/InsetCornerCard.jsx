import React from 'react';
import { motion } from 'framer-motion';
import { cn } from './Base';

const InsetCornerCard = ({
    children,
    icon: Icon,
    iconClassName,
    className,
    bg = 'bg-white border-none!',
    cutoutColor = 'var(--inset-bg)',
    containerClassName,
    position = 'top-left', // 'top-left' or 'top-right'
    cornerElement,
    ...props
}) => {
    const isRight = position === 'top-right';

    return (
        <motion.div
            className={cn(
                "group relative transition-all duration-300",
                containerClassName
            )}
            {...props}
        >
            <div className={cn(
                bg,
                "relative p-7 flex flex-col justify-end min-h-[180px] rounded-[1.75rem] overflow-hidden w-full h-full transition-all duration-300",
                className
            )}>
                {/* The Inset Corner Cutout & Element Wrapper */}
                <div
                    className={isRight ? "bento-card-inset-corners-tr" : "bento-card-inset-corners"}
                    style={{ '--inset-bg': cutoutColor, zIndex: 20 }}
                >
                    <div className={cn(
                        isRight ? "corner-element-tr" : "icon-container-inset",
                        iconClassName
                    )}>
                        {cornerElement ? cornerElement : Icon && <Icon size={22} />}
                    </div>
                </div>

                {/* Main Content */}
                <div className="relative z-10 transition-transform duration-300">
                    {children}
                </div>
            </div>
        </motion.div>
    );
};

export default InsetCornerCard;
