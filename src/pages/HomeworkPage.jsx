import React from 'react';
import { Calendar, Paperclip, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import '../styles/pages/homework.css';

// Mock homework data
const mockHomework = [
    {
        id: 1,
        title: 'Calculus Problem Set 5',
        subject: 'Mathematics',
        dueDate: 'Tomorrow',
        status: 'pending',
        hasAttachment: true,
    },
    {
        id: 2,
        title: 'Newton\'s Laws Lab Report',
        subject: 'Physics',
        dueDate: 'In 3 days',
        status: 'in-progress',
        hasAttachment: true,
    },
    {
        id: 3,
        title: 'Chemical Equations Worksheet',
        subject: 'Chemistry',
        dueDate: 'Submitted',
        status: 'submitted',
        hasAttachment: false,
        submittedDate: 'Yesterday',
    },
    {
        id: 4,
        title: 'Cell Biology Essay',
        subject: 'Biology',
        dueDate: 'Graded',
        status: 'graded',
        grade: 'A',
        feedback: 'Excellent work! Very thorough analysis.',
    },
];

export default function HomeworkPage() {
    const pending = mockHomework.filter(h => h.status === 'pending');
    const inProgress = mockHomework.filter(h => h.status === 'in-progress');
    const submitted = mockHomework.filter(h => h.status === 'submitted');
    const graded = mockHomework.filter(h => h.status === 'graded');

    const renderHomeworkCard = (hw) => (
        <Card key={hw.id} className="homework-card" hover>
            <div className="homework-card-header">
                <Badge variant="info">{hw.subject}</Badge>
                <Badge
                    variant={
                        hw.status === 'graded' ? 'success' :
                            hw.status === 'submitted' ? 'info' :
                                hw.status === 'in-progress' ? 'warning' :
                                    'default'
                    }
                >
                    {hw.status === 'in-progress' ? 'In Progress' : hw.status.charAt(0).toUpperCase() + hw.status.slice(1)}
                </Badge>
            </div>

            <h3 className="homework-title">{hw.title}</h3>

            <div className="homework-meta">
                <div className="homework-meta-item">
                    <Calendar size={16} />
                    <span>{hw.dueDate}</span>
                </div>
                {hw.hasAttachment && (
                    <div className="homework-meta-item">
                        <Paperclip size={16} />
                        <span>Has attachments</span>
                    </div>
                )}
            </div>

            {hw.status === 'graded' && (
                <div className="homework-grade">
                    <div className="grade-badge">{hw.grade}</div>
                    <p className="grade-feedback">{hw.feedback}</p>
                </div>
            )}

            <Button
                variant={hw.status === 'pending' ? 'primary' : 'ghost'}
                fullWidth
            >
                {hw.status === 'pending' ? 'Start Assignment' :
                    hw.status === 'in-progress' ? 'Continue' :
                        hw.status === 'submitted' ? 'View Submission' :
                            'View Details'}
            </Button>
        </Card>
    );

    return (
        <div className="homework-page">
            <div className="page-header">
                <div>
                    <h1>Homework & Assignments</h1>
                    <p className="page-subtitle">Manage and submit your assignments</p>
                </div>
            </div>

            <div className="homework-columns">
                {/* Pending */}
                <div className="homework-column">
                    <div className="column-header">
                        <AlertCircle size={20} className="column-icon pending" />
                        <h2>Pending</h2>
                        <Badge variant="danger" size="sm">{pending.length}</Badge>
                    </div>
                    <div className="homework-list">
                        {pending.map(renderHomeworkCard)}
                    </div>
                </div>

                {/* In Progress */}
                <div className="homework-column">
                    <div className="column-header">
                        <Clock size={20} className="column-icon progress" />
                        <h2>In Progress</h2>
                        <Badge variant="warning" size="sm">{inProgress.length}</Badge>
                    </div>
                    <div className="homework-list">
                        {inProgress.map(renderHomeworkCard)}
                    </div>
                </div>

                {/* Submitted */}
                <div className="homework-column">
                    <div className="column-header">
                        <CheckCircle size={20} className="column-icon submitted" />
                        <h2>Submitted</h2>
                        <Badge variant="info" size="sm">{submitted.length}</Badge>
                    </div>
                    <div className="homework-list">
                        {submitted.map(renderHomeworkCard)}
                    </div>
                </div>

                {/* Graded */}
                <div className="homework-column">
                    <div className="column-header">
                        <CheckCircle size={20} className="column-icon graded" />
                        <h2>Graded</h2>
                        <Badge variant="success" size="sm">{graded.length}</Badge>
                    </div>
                    <div className="homework-list">
                        {graded.map(renderHomeworkCard)}
                    </div>
                </div>
            </div>
        </div>
    );
}
