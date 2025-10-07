import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import courseService from '../../services/courseService';

const StudentCourses = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const [allCoursesResponse, enrolledResponse] = await Promise.all([
          courseService.getAllCourses(),
          courseService.getEnrolledCourses()
        ]);
        
        // Handle backend response structure: { success: true, count: X, courses: [...] }
        let processedCourses = [];
        if (allCoursesResponse && allCoursesResponse.courses && Array.isArray(allCoursesResponse.courses)) {
          processedCourses = allCoursesResponse.courses;
        } else if (Array.isArray(allCoursesResponse)) {
          processedCourses = allCoursesResponse;
        }
        
        const processedEnrolled = Array.isArray(enrolledResponse) ? enrolledResponse : [];
        
        // Remove duplicates by ID
        const uniqueCourses = processedCourses.filter((course, index, self) => 
          index === self.findIndex(c => (c.id || c._id) === (course.id || course._id))
        );
        
        if (processedCourses.length !== uniqueCourses.length) {
          console.warn(`Removed ${processedCourses.length - uniqueCourses.length} duplicate courses`);
        }
        
        setCourses(uniqueCourses);
        setEnrolledCourses(processedEnrolled);
      } catch (error) {
        console.error('Failed to load courses:', error);
        setError('Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEnroll = async (courseId) => {
    // Ensure we're passing a numeric ID
    const numericId = parseInt(courseId);
    console.log('Enrolling in course:', courseId, 'Parsed as:', numericId, 'Valid:', !isNaN(numericId));
    
    if (isNaN(numericId)) {
      setError('Invalid course ID');
      return;
    }
    
    setEnrolling(courseId);
    try {
      await courseService.enrollInCourse(numericId);
      // Refresh enrolled courses
      const response = await courseService.getEnrolledCourses();
      setEnrolledCourses(Array.isArray(response) ? response : []);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Enrollment error:', error.response?.data);
      setError(error.response?.data?.message || 'Enrollment failed');
    } finally {
      setEnrolling(null);
    }
  };

  const isEnrolled = (courseId) => {
    return enrolledCourses.some(course => (course.id || course._id) === courseId);
  };

  if (loading) return <div className="loading">Loading courses...</div>;

  return (
    <div className="courses-page">
      <h1 className="page-title">Available Courses</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {courses.length === 0 ? (
        <div className="empty-state">
          <p>No courses available at the moment.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id || course._id} className="course-card">
              {course.thumbnail && (
                <img 
                  src={course.thumbnail} 
                  alt={course.title}
                  className="course-thumbnail"
                />
              )}
              
              <div className="course-content">
                <div className="course-header">
                  <h3>{course.title}</h3>
                  <span className="course-level">{course.level}</span>
                </div>
                
                <p className="course-description">{course.description}</p>
                
                <div className="course-meta">
                  <span>Instructor: {course.instructor.firstName} {course.instructor.lastName}</span>
                  <span>Videos: {course.videos.length}</span>
                  <span>Duration: {Math.floor(course.duration / 60)}h {course.duration % 60}m</span>
                </div>
                
                {course.tags && course.tags.length > 0 && (
                  <div className="course-tags">
                    {course.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
                
                <div className="course-actions">
                  {isEnrolled(course.id || course._id) ? (
                    <Link 
                      to={`/student/courses/${course.id || course._id}`}
                      className="btn btn-success"
                    >
                      Continue Learning
                    </Link>
                  ) : (
                    <button
                      className="btn btn-primary"
                      onClick={() => handleEnroll(course.id || course._id)}
                      disabled={enrolling === (course.id || course._id)}
                    >
                      {enrolling === (course.id || course._id) ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentCourses;