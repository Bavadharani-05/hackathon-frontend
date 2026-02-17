import React from 'react';
import './Badge.css';

/**
 * Badge Component
 * 
 * Small status indicator badge.
 * 
 * @param {string} variant - 'success' | 'warning' | 'danger' | 'info' | 'default'
 * @param {string} size - 'sm' | 'md'
 * @param {ReactNode} children - Badge text
 */

export default function Badge({
    variant = 'default',
    size = 'md',
    children,
    className = '',
}) {
    const classNames = [
        'badge',
        `badge-${variant}`,
        `badge-${size}`,
        className
    ].filter(Boolean).join(' ');

    return (
        <span className={classNames}>
            {children}
        </span>
    );
}
