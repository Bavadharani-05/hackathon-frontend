import React from 'react';
import { Users, Eye, MonitorOff, AlertTriangle } from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';
import '../styles/pages/dashboard.css';

// Mock student data for teacher dashboard
const mockStudents = [
    { id: 1, name: 'Alice Johnson', attention: 95, tabSwitches: 2, headScore: 98, lastActive: '5 min ago', status: 'online' },
    { id: 2, name: 'Bob Smith', attention: 78, tabSwitches: 8, headScore: 82, lastActive: '2 min ago', status: 'online' },
    { id: 3, name: 'Charlie Brown', attention: 45, tabSwitches: 15, headScore: 50, lastActive: '1 min ago', status: 'busy' },
    { id: 4, name: 'Diana Prince', attention: 89, tabSwitches: 3, headScore: 92, lastActive: '3 min ago', status: 'online' },
    { id: 5, name: 'Ethan Hunt', attention: 67, tabSwitches: 12, headScore: 70, lastActive: '7 min ago', status: 'online' },
];

export default function DashboardPage() {
    const totalStudents = mockStudents.length;
    const avgAttention = Math.round(mockStudents.reduce((sum, s) => sum + s.attention, 0) / totalStudents);
    const flaggedStudents = mockStudents.filter(s => s.attention < 60).length;
    const activeClasses = 2;

    const getAttentionColor = (score) => {
        if (score >= 80) return 'var(--success)';
        if (score >= 50) return 'var(--warning)';
        return 'var(--danger)';
    };

    const getAttentionVariant = (score) => {
        if (score >= 80) return 'success';
        if (score >= 50) return 'warning';
        return 'danger';
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1>Student Performance Dashboard</h1>
                    <p className="page-subtitle">Real-time attention tracking and analytics</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <Card className="kpi-card">
                    <div className="kpi-icon" style={{ background: '#7c3aed20', color: '#7c3aed' }}>
                        <Users size={24} />
                    </div>
                    <div className="kpi-content">
                        <p className="kpi-label">Total Students</p>
                        <h2 className="kpi-value">{totalStudents}</h2>
                    </div>
                </Card>

                <Card className="kpi-card">
                    <div className="kpi-icon" style={{ background: '#22c55e20', color: '#22c55e' }}>
                        <Eye size={24} />
                    </div>
                    <div className="kpi-content">
                        <p className="kpi-label">Avg Attention</p>
                        <h2 className="kpi-value">{avgAttention}%</h2>
                    </div>
                </Card>

                <Card className="kpi-card">
                    <div className="kpi-icon" style={{ background: '#3b82f620', color: '#3b82f6' }}>
                        <MonitorOff size={24} />
                    </div>
                    <div className="kpi-content">
                        <p className="kpi-label">Active Classes</p>
                        <h2 className="kpi-value">{activeClasses}</h2>
                    </div>
                </Card>

                <Card className="kpi-card">
                    <div className="kpi-icon" style={{ background: '#ef444420', color: '#ef4444' }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className="kpi-content">
                        <p className="kpi-label">Flagged Students</p>
                        <h2 className="kpi-value">{flaggedStudents}</h2>
                    </div>
                </Card>
            </div>

            {/* Student Attention Table */}
            <Card className="dashboard-table-card">
                <div className="table-header">
                    <h2>Student Attention Levels</h2>
                    <Badge variant="info">{totalStudents} students</Badge>
                </div>

                <div className="table-container">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Attention Score</th>
                                <th>Tab Switches</th>
                                <th>Head Score</th>
                                <th>Last Active</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mockStudents.map((student) => (
                                <tr key={student.id}>
                                    <td>
                                        <div className="student-cell">
                                            <Avatar name={student.name} size="sm" status={student.status} />
                                            <span>{student.name}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="attention-cell">
                                            <div className="attention-bar-container">
                                                <div
                                                    className="attention-bar"
                                                    style={{
                                                        width: `${student.attention}%`,
                                                        background: getAttentionColor(student.attention)
                                                    }}
                                                />
                                            </div>
                                            <Badge variant={getAttentionVariant(student.attention)} size="sm">
                                                {student.attention}%
                                            </Badge>
                                        </div>
                                    </td>
                                    <td>
                                        <Badge variant={student.tabSwitches > 10 ? 'danger' : 'default'} size="sm">
                                            {student.tabSwitches}
                                        </Badge>
                                    </td>
                                    <td>{student.headScore}%</td>
                                    <td className="text-muted">{student.lastActive}</td>
                                    <td>
                                        <Badge
                                            variant={student.status === 'online' ? 'success' : 'warning'}
                                            size="sm"
                                        >
                                            {student.status}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
