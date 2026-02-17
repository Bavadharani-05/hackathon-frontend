import React from 'react';
import './Card.css';

/**
 * Card Component
 * 
 * Glassmorphism card container.
 * 
 * @param {ReactNode} children - Card content
 * @param {string} className - Additional CSS classes
 * @param {function} onClick - Click handler (makes card clickable)
 * @param {boolean} hover - Enable hover effect
 */

export default function Card({
    children,
    className = '',
    onClick,
    hover = false,
    ...props
}) {
    const clickable = typeof onClick === 'function';

    const classNames = [
        'card',
        hover && 'card-hover',
        clickable && 'card-clickable',
        className
    ].filter(Boolean).join(' ');

    return (
        <div
            className={classNames}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
}
