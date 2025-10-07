import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import courseService from '../../services/courseService';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      console.log('Admin Courses: Fetching courses...');
      const response = await courseService.getAllCourses();
      console.log('Admin Courses: Response received:', response);
      
      // Handle backend response structure: { success: true, count: X, courses: [...] }
      let coursesArray = [];
      if (response && response.courses && Array.isArray(response.courses)) {
        coursesArray = response.courses;
      } else if (Array.isArray(response)) {
        coursesArray = response;
      }
      
      console.log('Admin Courses: Courses array:', coursesArray);
      
      // Remove duplicates by ID
      const uniqueCourses = coursesArray.filter((course, index, self) => 
        index === self.findIndex(c => (c.id || c._id) === (course.id || course._id))
      );
      
      console.log('Admin courses - Original count:', coursesArray.length, 'Unique count:', uniqueCourses.length);
      
      setCourses(uniqueCourses);
    } catch (error) {
      console.error('Admin Courses: Error fetching courses:', error);
      setError('Failed to load courses');
      setCourses([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await courseService.deleteCourse(id);
        fetchCourses();
      } catch (error) {
        setError('Failed to delete course');
      }
    }
  };

  if (loading) return <div className="loading">Loading courses...</div>;

  return (
    <div className="admin-courses">
      <div className="page-header">
        <h1 className="page-title">Manage Courses</h1>
        <Link to="/admin/courses/new" className="btn btn-primary">
          Create New Course
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {!Array.isArray(courses) || courses.length === 0 ? (
        <div className="empty-state">
          <p>No courses created yet.</p>
          <Link to="/admin/courses/new" className="btn btn-primary">
            Create First Course
          </Link>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="admin-course-card">
              <div className="course-header">
                <h3>{course.title}</h3>
                <span className={`status-badge ${course.isPublished ? 'published' : 'draft'}`}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
              
              <p className="course-description">{course.description}</p>
              
              <div className="course-stats">
                <span>Videos: {course.videos?.length || 0}</span>
                <span>Students: {course.enrolledStudents?.length || 0}</span>
                <span>Duration: {Math.floor((course.duration || 0) / 60)}h</span>
              </div>

              <div className="course-actions">
                <Link to={`/admin/courses/edit/${course.id}`} className="btn btn-secondary">
                  Edit
                </Link>
                <button 
                  onClick={() => handleDelete(course.id)}
                  className="btn btn-danger"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCourses;