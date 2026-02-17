import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import '../styles/pages/login.css';

/**
 * LoginPage Component
 * 
 * Authentication page with email/password login and role selection.
 */

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'student', // 'student' or 'teacher'
    });

    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            login(formData.email, formData.password, formData.role);
            setIsLoading(false);
            navigate('/classes');
        }, 1000);
    };

    return (
        <div className="login-page">
            {/* Animated background */}
            <div className="login-background">
                <div className="login-gradient-orb login-orb-1"></div>
                <div className="login-gradient-orb login-orb-2"></div>
                <div className="login-gradient-orb login-orb-3"></div>
            </div>

            {/* Content container */}
            <div className="login-container">
                {/* Left side - Branding */}
                <div className="login-branding">
                    <div className="login-logo">
                        <span className="login-logo-icon">🎓</span>
                        <h1 className="login-logo-text">EduTrack</h1>
                    </div>
                    <h2 className="login-tagline">
                        Elevate learning with <span className="gradient-text">AI-powered</span> attention tracking
                    </h2>
                    <p className="login-description">
                        The modern platform for online education, homework management, and intelligent student engagement analytics.
                    </p>
                </div>

                {/* Right side - Login form */}
                <Card className="login-card">
                    <div className="login-form-header">
                        <h3>Welcome Back</h3>
                        <p>Sign in to continue to EduTrack</p>
                    </div>

                    {/* Role selector */}
                    <div className="login-role-selector">
                        <button
                            type="button"
                            className={`login-role-option ${formData.role === 'student' ? 'active' : ''}`}
                            onClick={() => handleChange('role', 'student')}
                        >
                            Student
                        </button>
                        <button
                            type="button"
                            className={`login-role-option ${formData.role === 'teacher' ? 'active' : ''}`}
                            onClick={() => handleChange('role', 'teacher')}
                        >
                            Teacher
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <Input
                            type="email"
                            label="Email Address"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            error={errors.email}
                            icon={Mail}
                        />

                        <Input
                            type="password"
                            label="Password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => handleChange('password', e.target.value)}
                            error={errors.password}
                            icon={Lock}
                        />

                        <div className="login-options">
                            <label className="login-remember">
                                <input type="checkbox" />
                                <span>Remember me</span>
                            </label>
                            <a href="#forgot" className="login-forgot">Forgot password?</a>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            fullWidth
                            loading={isLoading}
                        >
                            Sign In
                        </Button>
                    </form>

                    <div className="login-footer">
                        <p>Don't have an account? <a href="#signup">Sign up</a></p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
