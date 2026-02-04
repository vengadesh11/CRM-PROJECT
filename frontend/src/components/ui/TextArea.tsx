import React from 'react';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export default function TextArea({ label, error, className = '', ...props }: TextAreaProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2 ml-1">
                    {label}
                </label>
            )}
            <textarea
                className={`block w-full bg-[var(--surface-input)] border ${error ? 'border-red-500' : 'border-[var(--surface-border)]'
                    } rounded-lg py-3 px-4 text-sm text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-colors shadow-sm ${className}`}
                {...props}
            />
            {error && <p className="mt-1.5 text-xs text-red-400 ml-1">{error}</p>}
        </div>
    );
}
