import React from 'react';
import { cn } from "@/lib/utils";

/**
 * InputEvent Component
 * A reusable input component with consistent styling, integrated label and error handling.
 */
const InputEvent = React.forwardRef(({
    label,
    error,
    icon: Icon,
    className,
    containerClassName,
    type = "text",
    ...props
}, ref) => {
    return (
        <div className={cn("w-full", containerClassName)}>
            {label && (
                <label className="text-[10px] font-medium text-dark/40 uppercase tracking-widest ml-1 block">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <Icon
                        className={cn(
                            "absolute left-4 top-1/2 -translate-y-1/2 transition-colors z-10",
                            error ? "text-rose-400" : "text-foreground/20 group-focus-within:text-amber-600"
                        )}
                        size={18}
                    />
                )}
                <input
                    ref={ref}
                    type={type}
                    className={cn(
                        "w-full p-3 bg-white border rounded-lg transition-all outline-none text-foreground placeholder:text-foreground/20",
                        Icon && "pl-12",
                        error
                            ? "border-rose-500 focus:ring-rose-500/5"
                            : "border-foreground/10 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/5",
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-[10px] text-rose-500 font-medium px-1 mt-1.5 animate-in fade-in slide-in-from-top-1">
                    {error}
                </p>
            )}
        </div>
    );
});

InputEvent.displayName = "InputEvent";

export { InputEvent };
