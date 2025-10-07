import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import courseService from '../../services/courseService';
import userService from '../../services/userService';
import resultService from '../../services/resultService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    courses: 0,
    users: 0,
    students: 0,
    results: 0
  });
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [coursesResponse, userStatsResponse, resultsResponse] = await Promise.all([
          courseService.getAllCourses(),
          userService.getUserStats(),
          resultService.getAllResults({ limit: 5 })
        ]);

        // Handle backend response structure: { success: true, count: X, courses: [...] }
        let coursesArray = [];
        if (coursesResponse && coursesResponse.courses && Array.isArray(coursesResponse.courses)) {
          coursesArray = coursesResponse.courses;
        } else if (Array.isArray(coursesResponse)) {
          coursesArray = coursesResponse;
        }

        setStats({
          courses: coursesArray.length,
          users: userStatsResponse.stats.totalUsers,
          students: userStatsResponse.stats.studentUsers,
          results: resultsResponse.total
        });

        setRecentResults(resultsResponse.results);
      } catch (error) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="admin-dashboard">
      <h1 className="page-title">Admin Dashboard</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-content">
            <h3>Total Courses</h3>
            <div className="stat-number">{stats.courses}</div>
          </div>
          <Link to="/admin/courses" className="stat-link">
            View All →
          </Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Total Users</h3>
            <div className="stat-number">{stats.users}</div>
          </div>
          <Link to="/admin/users" className="stat-link">
            Manage →
          </Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎓</div>
          <div className="stat-content">
            <h3>Students</h3>
            <div className="stat-number">{stats.students}</div>
          </div>
          <Link to="/admin/users" className="stat-link">
            View All →
          </Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>Quiz Results</h3>
            <div className="stat-number">{stats.results}</div>
          </div>
          <Link to="/admin/results" className="stat-link">
            View Results →
          </Link>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="dashboard-section">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <Link to="/admin/courses/new" className="action-card">
            <div className="action-icon">➕</div>
            <div className="action-content">
              <h3>Create Course</h3>
              <p>Add a new course with videos</p>
            </div>
          </Link>
          
          <Link to="/admin/users/new" className="action-card">
            <div className="action-icon">👤</div>
            <div className="action-content">
              <h3>Add User</h3>
              <p>Register new students or admins</p>
            </div>
          </Link>
          
          <Link to="/admin/quizzes/new" className="action-card">
            <div className="action-icon">❓</div>
            <div className="action-content">
              <h3>Create Quiz</h3>
              <p>Build interactive quizzes</p>
            </div>
          </Link>
          
          <Link to="/admin/results" className="action-card">
            <div className="action-icon">📈</div>
            <div className="action-content">
              <h3>View Analytics</h3>
              <p>Track student performance</p>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Quiz Results</h2>
          <Link to="/admin/results" className="btn btn-primary">View All</Link>
        </div>
        
        {recentResults.length === 0 ? (
          <div className="empty-state">
            <p>No recent quiz results.</p>
          </div>
        ) : (
          <div className="recent-results">
            <div className="results-table">
              <div className="table-header">
                <span>Student</span>
                <span>Quiz</span>
                <span>Course</span>
                <span>Score</span>
                <span>Status</span>
                <span>Date</span>
              </div>
              
              {recentResults.map((result) => (
                <div key={result._id} className="table-row">
                  <span className="student-name">
                    {result.student.firstName} {result.student.lastName}
                  </span>
                  <span>{result.quiz.title}</span>
                  <span>{result.course.title}</span>
                  <span className="score">{result.percentage}%</span>
                  <span>
                    <span className={`status-badge ${result.isPassed ? 'passed' : 'failed'}`}>
                      {result.isPassed ? 'Passed' : 'Failed'}
                    </span>
                  </span>
                  <span>{new Date(result.completedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;