import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export default function Select({ label, error, options, className = '', ...props }: SelectProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 ml-1">
                    {label}
                </label>
            )}
            <select
                className={`block w-full bg-[var(--surface-input)] border border-[var(--surface-border)] rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors appearance-none ${className}`}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[var(--surface-panel)] text-white">
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1.5 text-xs text-red-400 ml-1">{error}</p>}
        </div>
    );
}
