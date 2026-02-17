import React from 'react';
import './Loader.css';

/**
 * Loader Component
 * 
 * Animated loading spinner.
 * 
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {string} variant - 'spinner' | 'dots'
 * @param {string} text - Optional loading text
 */

export default function Loader({
    size = 'md',
    variant = 'spinner',
    text,
    className = '',
}) {
    if (variant === 'dots') {
        return (
            <div className={`loader-container ${className}`}>
                <div className={`loader-dots loader-${size}`}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                {text && <p className="loader-text">{text}</p>}
            </div>
        );
    }

    return (
        <div className={`loader-container ${className}`}>
            <div className={`loader-spinner loader-${size}`}></div>
            {text && <p className="loader-text">{text}</p>}
        </div>
    );
}
