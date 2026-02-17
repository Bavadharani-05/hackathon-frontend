import React from 'react';
import { Clock, FileCheck, Calendar } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import '../styles/pages/test.css';

// Mock test data
const mockTests = [
    { id: 1, title: 'Mathematics Mid-term Exam', subject: 'Mathematics', duration: '90 min', questions: 50, date: 'Today, 2:00 PM', status: 'upcoming' },
    { id: 2, title: 'Physics Quiz Chapter 5', subject: 'Physics', duration: '30 min', questions: 20, date: 'Tomorrow, 10:00 AM', status: 'upcoming' },
    { id: 3, title: 'Chemistry Lab Test', subject: 'Chemistry', duration: '45 min', questions: 25, score: 85, date: 'Yesterday', status: 'completed' },
    { id: 4, title: 'Biology Final Exam', subject: 'Biology', duration: '120 min', questions: 75, score: 92, date: 'Last Week', status: 'completed' },
];

export default function TestPage() {
    const upcomingTests = mockTests.filter(t => t.status === 'upcoming');
    const completedTests = mockTests.filter(t => t.status === 'completed');

    const handleStartTest = (test) => {
        alert(`Starting ${test.title}...`);
        // Would navigate to test-taking interface
    };

    return (
        <div className="test-page">
            <div className="page-header">
                <div>
                    <h1>Tests & Exams</h1>
                    <p className="page-subtitle">Upcoming and completed assessments</p>
                </div>
            </div>

            {/* Upcoming Tests */}
            <section className="test-section">
                <h2 className="section-title">Upcoming Tests</h2>
                <div className="test-grid">
                    {upcomingTests.map((test) => (
                        <Card key={test.id} className="test-card">
                            <div className="test-card-header">
                                <Badge variant="info">{test.subject}</Badge>
                                <Badge variant="warning">Upcoming</Badge>
                            </div>

                            <h3 className="test-title">{test.title}</h3>

                            <div className="test-meta">
                                <div className="test-meta-item">
                                    <Calendar size={16} />
                                    <span>{test.date}</span>
                                </div>
                                <div className="test-meta-item">
                                    <Clock size={16} />
                                    <span>{test.duration}</span>
                                </div>
                                <div className="test-meta-item">
                                    <FileCheck size={16} />
                                    <span>{test.questions} questions</span>
                                </div>
                            </div>

                            <Button variant="primary" fullWidth onClick={() => handleStartTest(test)}>
                                Start Test
                            </Button>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Completed Tests */}
            <section className="test-section">
                <h2 className="section-title">Completed Tests</h2>
                <div className="test-grid">
                    {completedTests.map((test) => (
                        <Card key={test.id} className="test-card">
                            <div className="test-card-header">
                                <Badge variant="info">{test.subject}</Badge>
                                <Badge variant="success">Completed</Badge>
                            </div>

                            <h3 className="test-title">{test.title}</h3>

                            <div className="test-score">
                                <div className="test-score-circle">
                                    <span className="test-score-value">{test.score}</span>
                                    <span className="test-score-total">/100</span>
                                </div>
                            </div>

                            <div className="test-meta">
                                <div className="test-meta-item">
                                    <Calendar size={16} />
                                    <span>{test.date}</span>
                                </div>
                                <div className="test-meta-item">
                                    <Clock size={16} />
                                    <span>{test.duration}</span>
                                </div>
                            </div>

                            <Button variant="ghost" fullWidth>
                                View Results
                            </Button>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    );
}
