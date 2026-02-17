import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/ui/Sidebar';
import LoginPage from './pages/LoginPage';
import ClassesPage from './pages/ClassesPage';
import TestPage from './pages/TestPage';
import HomeworkPage from './pages/HomeworkPage';
import DashboardPage from './pages/DashboardPage';
import './App.css';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <div className="app">
                    <Routes>
                        {/* Public route */}
                        <Route path="/login" element={<LoginPage />} />

                        {/* Protected routes with sidebar */}
                        <Route
                            path="/*"
                            element={
                                <ProtectedRoute>
                                    <div className="app-layout">
                                        <Sidebar />
                                        <main className="app-main">
                                            <Routes>
                                                <Route path="/" element={<Navigate to="/classes" />} />
                                                <Route path="/classes" element={<ClassesPage />} />
                                                <Route path="/tests" element={<TestPage />} />
                                                <Route path="/homework" element={<HomeworkPage />} />
                                                <Route path="/dashboard" element={<DashboardPage />} />
                                            </Routes>
                                        </main>
                                    </div>
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
