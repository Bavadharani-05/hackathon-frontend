import React, { useState } from 'react';
import { Play, Users, Clock, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import VideoRoom from '../components/VideoRoom';
import '../styles/pages/classes.css';

// Mock data
const mockClasses = [
    { id: 1, subject: 'Mathematics', teacher: 'Dr. Smith', time: '10:00 AM', students: 25, status: 'live', color: '#7c3aed' },
    { id: 2, subject: 'Physics', teacher: 'Prof. Johnson', time: '2:00 PM', students: 30, status: 'scheduled', color: '#3b82f6' },
    { id: 3, subject: 'Chemistry', teacher: 'Dr. Williams', time: '4:00 PM', students: 22, status: 'scheduled', color: '#22c55e' },
    { id: 4, subject: 'Biology', teacher: 'Prof. Brown', time: 'Tomorrow 9:00 AM', students: 28, status: 'scheduled', color: '#f59e0b' },
];

export default function ClassesPage() {
    const { user } = useAuth();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newClass, setNewClass] = useState({ subject: '', time: '', description: '' });
    const [activeClass, setActiveClass] = useState(null);

    const handleJoinClass = (classItem) => {
        setActiveClass(classItem);
    };

    const handleCreateClass = () => {
        console.log('Creating class:', newClass);
        setIsCreateModalOpen(false);
        setNewClass({ subject: '', time: '', description: '' });
    };

    return (
        <div className="classes-page">
            <div className="page-header">
                <div>
                    <h1>Classes</h1>
                    <p className="page-subtitle">Join live sessions or view upcoming classes</p>
                </div>
                {user?.role === 'teacher' && (
                    <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                        <Plus size={20} />
                        Create Class
                    </Button>
                )}
            </div>

            <div className="classes-grid">
                {mockClasses.map((classItem) => (
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
                            <p className="class-teacher">by {classItem.teacher}</p>

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
                                    <><Play size={18} /> Join Now</>
                                ) : (
                                    'View Details'
                                )}
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Create Class Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Class"
                size="md"
            >
                <Input
                    label="Subject"
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
                    value={newClass.description}
                    onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                />
                <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)' }}>
                    <Button variant="ghost" fullWidth onClick={() => setIsCreateModalOpen(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" fullWidth onClick={handleCreateClass}>
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
