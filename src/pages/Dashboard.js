import React from "react";
import "./styles/dashboard.css";

const Dashboard = () => {
    const students = [
        {
            id: 1,
            name: "Alice Johnson",
            course: "Mathematics",
            status: "Completed",
            grade: "A",
        },
        {
            id: 2,
            name: "Bob Smith",
            course: "Physics",
            status: "Pending",
            grade: "B+",
        },
        {
            id: 3,
            name: "Charlie Davis",
            course: "Mathematics",
            status: "In Progress",
            grade: "-",
        },
    ];

    return (
        <div className="dashboard-container">
            {/* Sidebar Navigation */}
            <aside className="sidebar">
                <h2 className="logo">eSchool</h2>
                <nav>
                    <ul>
                        <li className="active">Overview</li>
                        <li>My Classes</li>
                        <li>Assignments</li>
                        <li>Messages</li>
                        <li>Settings</li>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <header className="top-bar">
                    <h1>Teacher Dashboard</h1>
                    <div className="user-profile">
                        <span>Welcome, Prof. Anderson</span>
                        <div className="avatar"></div>
                    </div>
                </header>

                {/* Stats Section */}
                <section className="stats-grid">
                    <div className="stat-card">
                        <h3>Total Students</h3>
                        <p className="stat-number">124</p>
                    </div>
                    <div className="stat-card">
                        <h3>Active Courses</h3>
                        <p className="stat-number">6</p>
                    </div>
                    <div className="stat-card">
                        <h3>Pending Grades</h3>
                        <p className="stat-number">12</p>
                    </div>
                </section>

                {/* Student Table */}
                <section className="table-container">
                    <h3>Recent Student Activity</h3>
                    <table className="student-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Course</th>
                                <th>Status</th>
                                <th>Grade</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td>{student.name}</td>
                                    <td>{student.course}</td>
                                    <td>
                                        <span
                                            className={`status ${student.status.toLowerCase().replace(" ", "-")}`}
                                        >
                                            {student.status}
                                        </span>
                                    </td>
                                    <td>{student.grade}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </main>
        </div>
    );
};

export default Dashboard;
