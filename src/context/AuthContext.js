import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const login = (email, password, role) => {
        // Mock authentication - replace with real API call
        const mockUser = {
            id: '1',
            name: email.split('@')[0],
            email,
            role, // 'student' or 'teacher'
        };

        setUser(mockUser);
        setIsAuthenticated(true);
        localStorage.setItem('edutrack_user', JSON.stringify(mockUser));
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('edutrack_user');
    };

    // Check for existing session on mount
    React.useEffect(() => {
        const savedUser = localStorage.getItem('edutrack_user');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            setIsAuthenticated(true);
        }
    }, []);

    const value = {
        user,
        isAuthenticated,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
