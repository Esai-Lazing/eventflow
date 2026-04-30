import React from 'react';
import { cn } from "@/lib/utils";

/**
 * SwitchEvent Component
 * A professional toggle switch component for the personalizer.
 */
const SwitchEvent = ({ checked, onChange, onCheckedChange, className }) => {
    const handleChange = () => {
        const nextValue = !checked;
        if (onCheckedChange) onCheckedChange(nextValue);
        if (onChange) onChange({ target: { checked: nextValue } });
    };

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={handleChange}
            className={cn(
                "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                checked ? "bg-primary" : "bg-muted",
                className
            )}
        >
            <span
                className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out",
                    checked ? "translate-x-4" : "translate-x-0"
                )}
            />
        </button>
    );
};

export { SwitchEvent };
