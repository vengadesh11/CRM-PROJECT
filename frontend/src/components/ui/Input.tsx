import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ElementType;
}

export default function Input({ label, error, icon: Icon, className = '', ...props }: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Icon className="h-5 w-5 text-[var(--text-secondary)]" />
                    </div>
                )}
                <input
                    className={`block w-full bg-[var(--surface-input)] border border-[var(--surface-border)] rounded-lg py-3 px-4 ${Icon ? 'pl-11' : ''
                        } text-sm text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors ${className}`}
                    {...props}
                />
            </div>
            {error && <p className="mt-1.5 text-xs text-red-400 ml-1">{error}</p>}
        </div>
    );
}
