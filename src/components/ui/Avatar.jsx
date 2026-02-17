import React from 'react';
import './Avatar.css';

/**
 * Avatar Component
 * 
 * User avatar with optional status indicator.
 * 
 * @param {string} src - Image URL
 * @param {string} alt - Alt text
 * @param {string} name - User name (for initials fallback)
 * @param {string} size - 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} status - 'online' | 'offline' | 'busy' (optional)
 */

export default function Avatar({
    src,
    alt,
    name,
    size = 'md',
    status,
    className = '',
}) {
    const getInitials = (fullName) => {
        if (!fullName) return '?';
        const names = fullName.trim().split(' ');
        if (names.length === 1) return names[0][0].toUpperCase();
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    };

    const classNames = [
        'avatar',
        `avatar-${size}`,
        status && 'avatar-with-status',
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={classNames}>
            {src ? (
                <img src={src} alt={alt || name} className="avatar-image" />
            ) : (
                <div className="avatar-initials">
                    {getInitials(name)}
                </div>
            )}
            {status && (
                <span className={`avatar-status avatar-status-${status}`}></span>
            )}
        </div>
    );
}
