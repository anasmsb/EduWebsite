import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import courseService from '../../services/courseService';
import resultService from '../../services/resultService';

const StudentDashboard = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [courses, results] = await Promise.all([
          courseService.getEnrolledCourses(),
          resultService.getMyResults()
        ]);
        
        setEnrolledCourses(Array.isArray(courses) ? courses : []);
        setRecentResults(Array.isArray(results) ? results.slice(0, 5) : []); // Latest 5 results
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
    <div className="dashboard">
      <h1 className="page-title">Student Dashboard</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="dashboard-grid">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Enrolled Courses</h3>
            <div className="stat-number">{Array.isArray(enrolledCourses) ? enrolledCourses.length : 0}</div>
          </div>
          
          <div className="stat-card">
            <h3>Completed Quizzes</h3>
            <div className="stat-number">{Array.isArray(recentResults) ? recentResults.length : 0}</div>
          </div>
          
          <div className="stat-card">
            <h3>Average Score</h3>
            <div className="stat-number">
              {Array.isArray(recentResults) && recentResults.length > 0
                ? Math.round(recentResults.reduce((sum, result) => sum + (result.percentage || 0), 0) / recentResults.length)
                : 0}%
            </div>
          </div>
        </div>
        
        {/* My Courses */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>My Courses</h2>
            <Link to="/student/courses" className="btn btn-primary">View All</Link>
          </div>
          
          {!Array.isArray(enrolledCourses) || enrolledCourses.length === 0 ? (
            <div className="empty-state">
              <p>You haven't enrolled in any courses yet.</p>
              <Link to="/student/courses" className="btn btn-primary">Browse Courses</Link>
            </div>
          ) : (
            <div className="course-list">
              {enrolledCourses.slice(0, 3).map((course) => (
                <div key={course.id || course._id} className="course-card">
                  <h3>{course.title || 'Untitled Course'}</h3>
                  <p>{course.description || 'No description available'}</p>
                  <div className="course-meta">
                    <span>Instructor: {course.instructor ? `${course.instructor.firstName || ''} ${course.instructor.lastName || ''}` : 'Unknown Instructor'}</span>
                    <span>{Array.isArray(course.videos) ? course.videos.length : 0} videos</span>
                  </div>
                  <Link to={`/student/courses/${course.id || course._id}`} className="btn btn-primary">
                    Continue Learning
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Recent Results */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Quiz Results</h2>
            <Link to="/student/results" className="btn btn-primary">View All</Link>
          </div>
          
          {!Array.isArray(recentResults) || recentResults.length === 0 ? (
            <div className="empty-state">
              <p>No quiz results yet.</p>
            </div>
          ) : (
            <div className="results-list">
              {recentResults.map((result) => (
                <div key={result.id || result._id} className="result-item">
                  <div className="result-info">
                    <h4>{result.quiz ? result.quiz.title : 'Unknown Quiz'}</h4>
                    <p>Course: {result.course ? result.course.title : 'Unknown Course'}</p>
                  </div>
                  <div className="result-score">
                    <span className={`score ${result.isPassed ? 'passed' : 'failed'}`}>
                      {result.percentage || 0}%
                    </span>
                    <small>{result.completedAt ? new Date(result.completedAt).toLocaleDateString() : 'Unknown Date'}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;