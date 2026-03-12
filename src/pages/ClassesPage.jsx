import React, { useState, useMemo } from 'react';
import { Play, Users, Clock, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import VideoRoom from '../components/VideoRoom';
import '../styles/pages/classes.css';

// Static pool of classes (used by students to see all classes)
const allMockClasses = [
    { id: 1, subject: 'Mathematics', teacher: 'Dr. Smith', time: '10:00 AM', students: 25, status: 'live', color: '#7c3aed' },
    { id: 2, subject: 'Physics', teacher: 'Prof. Johnson', time: '2:00 PM', students: 30, status: 'scheduled', color: '#3b82f6' },
    { id: 3, subject: 'Chemistry', teacher: 'Dr. Williams', time: '4:00 PM', students: 22, status: 'scheduled', color: '#22c55e' },
    { id: 4, subject: 'Biology', teacher: 'Prof. Brown', time: 'Tomorrow 9:00 AM', students: 28, status: 'scheduled', color: '#f59e0b' },
];

// Subjects pre-assigned to a teacher when they first log in
const teacherDefaultSubjects = [
    { subject: 'Mathematics', time: '10:00 AM', students: 25, status: 'live', color: '#7c3aed' },
    { subject: 'Physics', time: '2:00 PM', students: 30, status: 'scheduled', color: '#3b82f6' },
];

const SUBJECT_COLORS = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export default function ClassesPage() {
    const { user } = useAuth();
    const isTeacher = user?.role === 'teacher';

    // Teacher's own classes (seeded from their name, then extended via Create Class)
    const [teacherClasses, setTeacherClasses] = useState(() => {
        if (!isTeacher) return [];
        return teacherDefaultSubjects.map((s, i) => ({
            id: Date.now() + i,
            subject: s.subject,
            teacher: user?.name || 'You',
            time: s.time,
            students: s.students,
            status: s.status,
            color: s.color,
        }));
    });

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newClass, setNewClass] = useState({ subject: '', time: '', description: '' });
    const [activeClass, setActiveClass] = useState(null);

    // Decide which list to show based on role
    const displayedClasses = useMemo(() => {
        return isTeacher ? teacherClasses : allMockClasses;
    }, [isTeacher, teacherClasses]);

    const handleJoinClass = (classItem) => {
        setActiveClass(classItem);
    };

    const handleCreateClass = () => {
        if (!newClass.subject.trim()) return;

        const created = {
            id: Date.now(),
            subject: newClass.subject,
            teacher: user?.name || 'You',
            time: newClass.time
                ? new Date(newClass.time).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })
                : 'TBD',
            students: 0,
            status: 'scheduled',
            color: SUBJECT_COLORS[teacherClasses.length % SUBJECT_COLORS.length],
            description: newClass.description,
        };

        setTeacherClasses((prev) => [...prev, created]);
        setIsCreateModalOpen(false);
        setNewClass({ subject: '', time: '', description: '' });
    };

    return (
        <div className="classes-page">
            <div className="page-header">
                <div>
                    <h1>Classes</h1>
                    <p className="page-subtitle">
                        {isTeacher ? 'Manage your classes and start live sessions' : 'Join live sessions or view upcoming classes'}
                    </p>
                </div>
                {isTeacher && (
                    <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={20} />
                        Create Class
                    </Button>
                )}
            </div>

            {displayedClasses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '1.1rem' }}>No classes yet. Click <strong>Create Class</strong> to add one!</p>
                </div>
            ) : (
                <div className="classes-grid">
                    {displayedClasses.map((classItem) => (
                        <Card key={classItem.id} className="class-card" hover>
                            <div className="class-card-header">
                                <div className="class-thumbnail" style={{ background: `linear-gradient(135deg, ${classItem.color}40, ${classItem.color}20)` }}>
                                    <span className="class-icon" style={{ color: classItem.color }}>📚</span>
                                </div>
                                {classItem.status === 'live' && (
                                    <Badge variant="success" className="class-live-badge">
                                        <span className="live-indicator"></span>
                                        Live
                                    </Badge>
                                )}
                            </div>

                            <div className="class-card-content">
                                <h3 className="class-title">{classItem.subject}</h3>
                                <p className="class-teacher">
                                    {isTeacher ? '👤 Your Class' : `by ${classItem.teacher}`}
                                </p>

                                <div className="class-meta">
                                    <div className="class-meta-item">
                                        <Clock size={16} />
                                        <span>{classItem.time}</span>
                                    </div>
                                    <div className="class-meta-item">
                                        <Users size={16} />
                                        <span>{classItem.students} students</span>
                                    </div>
                                </div>

                                <Button
                                    variant={classItem.status === 'live' ? 'primary' : 'secondary'}
                                    fullWidth
                                    onClick={() => handleJoinClass(classItem)}
                                >
                                    {classItem.status === 'live' ? (
                                        <><Play size={18} /> {isTeacher ? 'Start Session' : 'Join Now'}</>
                                    ) : (
                                        isTeacher ? 'Manage Class' : 'View Details'
                                    )}
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Class Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Class"
                size="md"
            >
                <Input
                    label="Subject"
                    placeholder="e.g. Advanced Mathematics"
                    value={newClass.subject}
                    onChange={(e) => setNewClass({ ...newClass, subject: e.target.value })}
                />
                <Input
                    label="Time"
                    type="datetime-local"
                    value={newClass.time}
                    onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                />
                <Input
                    label="Description"
                    placeholder="Brief description of the class"
                    value={newClass.description}
                    onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                />
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
                    <Button variant="ghost" fullWidth onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" fullWidth onClick={handleCreateClass} disabled={!newClass.subject.trim()}>
                        Create Class
                    </Button>
                </div>
            </Modal>

            {/* Video Room */}
            {activeClass && (
                <VideoRoom
                    classInfo={activeClass}
                    onClose={() => setActiveClass(null)}
                />
            )}
        </div>
    );
}
