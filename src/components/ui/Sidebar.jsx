import React from 'react';
import { NavLink } from 'react-router-dom';
import {
    BookOpen,
    FileText,
    ClipboardList,
    BarChart3,
    LogOut,
    Menu,
    X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Avatar from './Avatar';
import './Sidebar.css';

/**
 * Sidebar Component
 * 
 * Main navigation sidebar with user info and logout.
 */

export default function Sidebar() {
    const { user, logout } = useAuth();
    const [isMobileOpen, setIsMobileOpen] = React.useState(false);

    const navItems = [
        { path: '/classes', label: 'Classes', icon: BookOpen },
        { path: '/tests', label: 'Tests', icon: FileText },
        { path: '/homework', label: 'Homework', icon: ClipboardList },
    ];

    // Add dashboard for teachers only
    if (user?.role === 'teacher') {
        navItems.push({
            path: '/dashboard',
            label: 'Dashboard',
            icon: BarChart3
        });
    }

    const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

    return (
        <>
            {/* Mobile menu button */}
            <button className="sidebar-mobile-toggle show-mobile" onClick={toggleMobile}>
                <Menu size={24} />
            </button>

            {/* Sidebar */}
            <aside className={`sidebar ${isMobileOpen ? 'sidebar-mobile-open' : ''}`}>
                {/* Close button for mobile */}
                <button className="sidebar-close show-mobile" onClick={toggleMobile}>
                    <X size={24} />
                </button>

                {/* Logo */}
                <div className="sidebar-logo">
                    <div className="logo-icon">🎓</div>
                    <h1 className="logo-text">EduTrack</h1>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                                }
                                onClick={() => setIsMobileOpen(false)}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className="sidebar-user">
                    <div className="sidebar-user-info">
                        <Avatar
                            name={user?.name}
                            size="md"
                            status="online"
                        />
                        <div className="sidebar-user-details">
                            <p className="sidebar-user-name">{user?.name}</p>
                            <p className="sidebar-user-role">{user?.role}</p>
                        </div>
                    </div>
                    <button className="sidebar-logout" onClick={logout} title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {isMobileOpen && (
                <div className="sidebar-overlay show-mobile" onClick={toggleMobile} />
            )}
        </>
    );
}
