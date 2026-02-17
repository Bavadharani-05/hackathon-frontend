import React, { useState } from 'react';
import './Input.css';

/**
 * Input Component
 * 
 * Text input with floating label animation.
 * 
 * @param {string} type - Input type (text, email, password, etc.)
 * @param {string} label - Label text
 * @param {string} placeholder - Placeholder text
 * @param {string} value - Controlled value
 * @param {function} onChange - Change handler
 * @param {string} error - Error message
 * @param {boolean} disabled - Disabled state
 * @param {ReactNode} icon - Icon component (from lucide-react)
 */

export default function Input({
    type = 'text',
    label,
    placeholder,
    value,
    onChange,
    error,
    disabled = false,
    icon: Icon,
    className = '',
    ...props
}) {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value && value.length > 0;

    return (
        <div className={`input-wrapper ${error ? 'input-error' : ''} ${className}`}>
            <div className="input-container">
                {Icon && (
                    <div className="input-icon">
                        <Icon size={20} />
                    </div>
                )}
                <input
                    type={type}
                    className={`input ${Icon ? 'input-with-icon' : ''}`}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    disabled={disabled}
                    {...props}
                />
                {label && (
                    <label
                        className={`input-label ${isFocused || hasValue ? 'input-label-float' : ''}`}
                    >
                        {label}
                    </label>
                )}
            </div>
            {error && (
                <span className="input-error-text">{error}</span>
            )}
        </div>
    );
}
