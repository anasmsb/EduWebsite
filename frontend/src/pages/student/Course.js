import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import courseService from '../../services/courseService';
import './Course.css';

const StudentCourse = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentVideo, setCurrentVideo] = useState(0);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await courseService.getCourse(id);
        setCourse(response.course);
        
        // Sort videos by order
        if (response.course.videos) {
          response.course.videos.sort((a, b) => a.order - b.order);
        }
      } catch (error) {
        setError('Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  if (loading) return <div className="loading">Loading course...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!course) return <div className="alert alert-danger">Course not found</div>;

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="course-view">
      <div className="course-header">
        <Link to="/student/courses" className="btn btn-secondary">
          ← Back to Courses
        </Link>
        <div className="course-info">
          <h1>{course.title}</h1>
          <p className="course-instructor">
            by {course.instructor.firstName} {course.instructor.lastName}
          </p>
          <p className="course-description">{course.description}</p>
        </div>
      </div>
      
      <div className="course-content">
        {/* Video Player */}
        {course.videos && course.videos.length > 0 ? (
          <div className="video-section">
            <div className="video-player">
              <video 
                key={currentVideo}
                controls 
                width="100%"
                height="400"
                onError={(e) => {
                  console.error('Video load error:', e);
                  setError(`Failed to load video: ${course.videos[currentVideo].title}`);
                }}
                onEnded={() => {
                  if (currentVideo < course.videos.length - 1) {
                    setCurrentVideo(currentVideo + 1);
                  }
                }}
              >
                <source 
                  src={`http://localhost:5000${course.videos[currentVideo].videoUrl}`} 
                  type="video/mp4" 
                />
                Your browser does not support the video tag.
                Video file not found or corrupted.
              </video>
            </div>
            
            <div className="current-video-info">
              <h3>{course.videos[currentVideo].title}</h3>
              {course.videos[currentVideo].description && (
                <p>{course.videos[currentVideo].description}</p>
              )}
              <span className="video-duration">
                Duration: {formatDuration(course.videos[currentVideo].duration)}
              </span>
            </div>
          </div>
        ) : (
          <div className="no-videos-section">
            <div className="alert alert-info">
              <h3>📹 No Videos Available</h3>
              <p>This course doesn't have any videos yet. Please check back later or contact the instructor.</p>
            </div>
          </div>
        )}
        
        {/* Video Playlist */}
        <div className="video-playlist">
          <h3>Course Videos</h3>
          {course.videos && course.videos.length > 0 ? (
            <div className="playlist">
              {course.videos.map((video, index) => (
                <div 
                  key={index}
                  className={`playlist-item ${currentVideo === index ? 'active' : ''}`}
                  onClick={() => setCurrentVideo(index)}
                >
                  <div className="playlist-video-info">
                    <span className="video-number">{index + 1}.</span>
                    <h4>{video.title}</h4>
                    <span className="video-duration">
                      {formatDuration(video.duration)}
                    </span>
                  </div>
                  {video.description && (
                    <p className="playlist-description">{video.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No videos available for this course.</p>
          )}
        </div>
        
        {/* Quiz Section */}
        {(course.quizId || course.quiz) && (
          <div className="quiz-section">
            <h3>Course Quiz</h3>
            <p>Complete the course quiz to test your knowledge.</p>
            <div className="quiz-info">
              <p><strong>Quiz Title:</strong> {course.quiz?.title || 'Course Quiz'}</p>
              <p><strong>Passing Score:</strong> {course.quiz?.passingScore || 70}%</p>
              <p><strong>Time Limit:</strong> {course.quiz?.timeLimit || 15} minutes</p>
              <p><strong>Question Types:</strong> Multiple Choice, True/False, Dropdown</p>
            </div>
            <Link 
              to={`/student/quiz/${course.quizId || course.quiz?.id}`}
              className="btn btn-success btn-lg"
            >
              🎯 Take Quiz
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentCourse;