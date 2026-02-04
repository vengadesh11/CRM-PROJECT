import React from 'react';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export default function Badge({ children, variant = 'neutral' }: BadgeProps) {
    const variants = {
        success: "bg-green-500/10 text-green-400 border-green-500/20",
        warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        danger: "bg-red-500/10 text-red-400 border-red-500/20",
        info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        neutral: "bg-dark-700 text-gray-400 border-dark-600"
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${variants[variant]}`}>
            {children}
        </span>
    );
}
