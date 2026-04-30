import React from 'react';
import { cn } from "@/lib/utils";

/**
 * TextareaEvent Component
 * A reusable textarea component with consistent styling, integrated label and error handling.
 */
const TextareaEvent = React.forwardRef(({
    label,
    error,
    className,
    containerClassName,
    rows = 4,
    ...props
}, ref) => {
    return (
        <div className={cn("w-full space-y-1.5", containerClassName)}>
            {label && (
                <label className="text-[10px] font-medium text-dark/40 uppercase tracking-widest ml-1 block">
                    {label}
                </label>
            )}
            <textarea
                ref={ref}
                rows={rows}
                className={cn(
                    "w-full p-3 bg-white border rounded-xl transition-all outline-none text-dark leading-relaxed placeholder:text-dark/30 resize-none",
                    error
                        ? "border-rose-500 focus:ring-rose-500/5"
                        : "border-dark/10 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5",
                    className
                )}
                {...props}
            />
            {error && (
                <p className="text-[10px] text-rose-500 font-medium px-1 mt-1.5 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
});

TextareaEvent.displayName = "TextareaEvent";

export { TextareaEvent };
