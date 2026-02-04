import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ElementType;
}

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    className = '',
    ...props
}: ButtonProps) {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white focus:ring-[var(--accent-primary)] shadow-lg shadow-blue-500/20",
        secondary: "bg-[var(--surface-elevated)] hover:bg-[#242e3f] text-white border border-[var(--surface-border)] focus:ring-[var(--accent-primary)]",
        danger: "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500 shadow-sm",
        ghost: "bg-transparent hover:bg-white/5 text-[var(--text-secondary)] hover:text-white"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {Icon && <Icon className={`w-5 h-5 ${children ? 'mr-2' : ''}`} />}
            {children}
        </button>
    );
}
