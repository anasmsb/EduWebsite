import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Edit, Trash2, FileText, CheckCircle, ArrowLeft, Eye, TrendingUp, Clock, XCircle } from 'lucide-react';
import courseService from '../../services/courseService';
import quizService from '../../services/quizService';
import resultService from '../../services/resultService';
import './AdminComponents.css';

// Question Editor Component for Quiz Form
const QuestionEditor = ({ question, index, onUpdate, onRemove }) => {
  const handleQuestionChange = (field, value) => {
    onUpdate(index, { ...question, [field]: value });
  };

  const handleOptionChange = (optionIndex, value) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    onUpdate(index, { ...question, options: newOptions });
  };

  const addOption = () => {
    const newOptions = [...question.options, ''];
    onUpdate(index, { ...question, options: newOptions });
  };

  const removeOption = (optionIndex) => {
    if (question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      const newCorrectAnswer = question.correctAnswer >= optionIndex && question.correctAnswer > 0 
        ? question.correctAnswer - 1 
        : question.correctAnswer;
      onUpdate(index, { 
        ...question, 
        options: newOptions,
        correctAnswer: Math.min(newCorrectAnswer, newOptions.length - 1)
      });
    }
  };

  return (
    <div className="question-editor">
      <div className="question-header">
        <h3>Question {index + 1}</h3>
        <button 
          type="button" 
          onClick={() => onRemove(index)}
          className="btn btn-sm btn-danger"
          title="Remove Question"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="question-form">
        <div className="form-row">
          <div className="form-group">
            <label>Question Type</label>
            <select
              value={question.type}
              onChange={(e) => handleQuestionChange('type', e.target.value)}
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="true-false">True/False</option>
              <option value="dropdown">Dropdown</option>
            </select>
          </div>

          <div className="form-group">
            <label>Points</label>
            <input
              type="number"
              value={question.points}
              onChange={(e) => handleQuestionChange('points', parseInt(e.target.value) || 1)}
              min="1"
              max="10"
            />
          </div>

          <div className="form-group">
            <label>Time Limit (seconds)</label>
            <input
              type="number"
              value={question.timeLimit}
              onChange={(e) => handleQuestionChange('timeLimit', parseInt(e.target.value) || 30)}
              min="10"
              max="300"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Question Text</label>
          <textarea
            value={question.question}
            onChange={(e) => handleQuestionChange('question', e.target.value)}
            placeholder="Enter your question here..."
            rows="2"
            required
          />
        </div>

        {question.type === 'true-false' ? (
          <div className="form-group">
            <label>Correct Answer</label>
            <select
              value={question.correctAnswer}
              onChange={(e) => handleQuestionChange('correctAnswer', parseInt(e.target.value))}
            >
              <option value={0}>True</option>
              <option value={1}>False</option>
            </select>
          </div>
        ) : (
          <div className="options-section">
            <div className="options-header">
              <label>Answer Options</label>
              <button 
                type="button" 
                onClick={addOption}
                className="btn btn-sm btn-secondary"
                disabled={question.options.length >= 6}
              >
                <Plus size={16} />
                Add Option
              </button>
            </div>

            <div className="options-list">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="option-item">
                  <div className="option-input">
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={question.correctAnswer === optionIndex}
                      onChange={() => handleQuestionChange('correctAnswer', optionIndex)}
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                      placeholder={`Option ${optionIndex + 1}`}
                      required
                    />
                  </div>
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(optionIndex)}
                      className="btn btn-sm btn-danger"
                      title="Remove option"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminCourseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'Beginner',
    duration: '',
    isPublished: false,
    tags: []
  });

  const [videos, setVideos] = useState([]);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    file: null,
    duration: '',
    order: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showVideoForm, setShowVideoForm] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourse(id);
      setFormData(response.course);
      setVideos(response.course.videos || []);
    } catch (error) {
      setError('Failed to load course');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      fetchCourse();
    }
  }, [isEdit, fetchCourse]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      if (isEdit) {
        await courseService.updateCourse(id, formData);
        setSuccess('Course updated successfully!');
      } else {
        const response = await courseService.createCourse(formData);
        setSuccess('Course created successfully!');
        navigate(`/admin/courses/edit/${response.course.id}`);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoInputChange = (e) => {
    const { name, value, files } = e.target;
    setVideoForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleVideoUpload = async (e) => {
    e.preventDefault();
    if (!id) {
      setError('Please save the course first before adding videos');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await courseService.uploadVideo(id, {
        video: videoForm.file,
        title: videoForm.title,
        description: videoForm.description,
        order: videoForm.order
      });
      
      setSuccess('Video uploaded successfully!');
      setVideoForm({ title: '', description: '', file: null, duration: '', order: videos.length + 1 });
      setShowVideoForm(false);
      fetchCourse(); // Reload course to get updated videos
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to upload video');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoDelete = async (videoIndex) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await courseService.deleteVideo(id, videoIndex);
      setSuccess('Video deleted successfully!');
      fetchCourse(); // Reload course to get updated videos
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete video');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) return <div className="loading">Loading course...</div>;

  return (
    <div className="admin-form-page">
      <div className="page-header">
        <h1>{isEdit ? 'Edit Course' : 'Create New Course'}</h1>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="course-form-container">
        <form onSubmit={handleSubmit} className="course-form">
          <div className="form-section">
            <h3>Course Information</h3>
            
            <div className="form-group">
              <label htmlFor="title">Course Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter course title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows="4"
                placeholder="Enter course description"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Programming">Programming</option>
                  <option value="Design">Design</option>
                  <option value="Business">Business</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="level">Level *</label>
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="duration">Duration (minutes) *</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="Enter duration in minutes"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags (comma separated)</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags?.join(', ') || ''}
                onChange={handleTagsChange}
                placeholder="Enter tags separated by commas"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isPublished"
                  checked={formData.isPublished}
                  onChange={handleInputChange}
                />
                <span>Publish Course</span>
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/admin/courses')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Course' : 'Create Course')}
            </button>
          </div>
        </form>

        {/* Video Management Section */}
        {isEdit && (
          <div className="video-section">
            <div className="section-header">
              <h3>Course Videos</h3>
              <button
                type="button"
                onClick={() => setShowVideoForm(!showVideoForm)}
                className="btn btn-primary"
              >
                {showVideoForm ? 'Cancel' : 'Add Video'}
              </button>
            </div>

            {showVideoForm && (
              <form onSubmit={handleVideoUpload} className="video-form">
                <div className="form-group">
                  <label htmlFor="videoTitle">Video Title *</label>
                  <input
                    type="text"
                    id="videoTitle"
                    name="title"
                    value={videoForm.title}
                    onChange={handleVideoInputChange}
                    required
                    placeholder="Enter video title"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="videoDescription">Video Description</label>
                  <textarea
                    id="videoDescription"
                    name="description"
                    value={videoForm.description}
                    onChange={handleVideoInputChange}
                    rows="3"
                    placeholder="Enter video description (optional)"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="videoFile">Video File *</label>
                    <input
                      type="file"
                      id="videoFile"
                      name="file"
                      onChange={handleVideoInputChange}
                      accept="video/*"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="videoDuration">Duration (minutes)</label>
                    <input
                      type="number"
                      id="videoDuration"
                      name="duration"
                      value={videoForm.duration}
                      onChange={handleVideoInputChange}
                      min="1"
                      placeholder="Enter video duration"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="videoOrder">Order</label>
                    <input
                      type="number"
                      id="videoOrder"
                      name="order"
                      value={videoForm.order}
                      onChange={handleVideoInputChange}
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => setShowVideoForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? 'Uploading...' : 'Upload Video'}
                  </button>
                </div>
              </form>
            )}

            {/* Videos List */}
            <div className="videos-list">
              {videos.length === 0 ? (
                <p className="no-videos">No videos added yet.</p>
              ) : (
                videos.map((video, index) => (
                  <div key={index} className="video-item">
                    <div className="video-preview">
                      {video.videoUrl && (
                        <video 
                          width="200" 
                          height="120" 
                          controls 
                          preload="metadata"
                          className="video-thumbnail"
                          onError={(e) => {
                            console.error('Admin video load error for:', video.videoUrl);
                            e.target.style.display = 'none';
                            const errorDiv = e.target.parentNode.querySelector('.video-error');
                            if (!errorDiv) {
                              const errorMsg = document.createElement('div');
                              errorMsg.textContent = 'Video file not found';
                              errorMsg.className = 'video-error alert alert-warning';
                              errorMsg.style.cssText = 'padding: 10px; margin: 5px 0; font-size: 12px;';
                              e.target.parentNode.appendChild(errorMsg);
                            }
                          }}
                        >
                          <source src={`http://localhost:5000${video.videoUrl}`} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                    <div className="video-info">
                      <h4>{video.title}</h4>
                      <p>{video.description}</p>
                      <div className="video-metadata">
                        <span className="video-meta">Order: {video.order}</span>
                        {video.duration && (
                          <span className="video-meta">Duration: {video.duration} min</span>
                        )}
                        {video.videoUrl && (
                          <span className="video-meta">File: {video.videoUrl.split('/').pop()}</span>
                        )}
                      </div>
                    </div>
                    <div className="video-actions">
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleVideoDelete(index)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('AdminQuizzes component mounted');
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching quizzes and courses...');
      
      const [quizzesData, coursesData] = await Promise.all([
        quizService.getAllQuizzes(),
        courseService.getAllCourses()
      ]);
      
      console.log('Raw quizzesData:', quizzesData);
      console.log('Raw coursesData:', coursesData);
      
      // Ensure quizzesData is an array
      const quizzes = Array.isArray(quizzesData) ? quizzesData : 
                     (quizzesData && quizzesData.quizzes && Array.isArray(quizzesData.quizzes)) ? quizzesData.quizzes :
                     (quizzesData && quizzesData.data && Array.isArray(quizzesData.data)) ? quizzesData.data : [];
      
      // Handle backend response structure: { success: true, count: X, courses: [...] }
      let courses = [];
      if (coursesData && coursesData.courses && Array.isArray(coursesData.courses)) {
        courses = coursesData.courses;
      } else if (Array.isArray(coursesData)) {
        courses = coursesData;
      } else if (coursesData && coursesData.data && Array.isArray(coursesData.data)) {
        courses = coursesData.data;
      }
      
      setQuizzes(quizzes);
      setCourses(courses);
      
      console.log('Raw quizzesData:', quizzesData);
      console.log('Processed quizzes:', quizzes);
      console.log('Raw coursesData:', coursesData);
      console.log('Processed courses:', courses);
    } catch (err) {
      console.error('Error in fetchData:', err);
      console.error('Error response:', err.response);
      setError('Failed to load data: ' + (err.response?.data?.message || err.message));
      setQuizzes([]); // Ensure it's always an array
      setCourses([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await quizService.deleteQuiz(quizId);
        setQuizzes(prevQuizzes => 
          Array.isArray(prevQuizzes) ? prevQuizzes.filter(quiz => quiz.id !== quizId) : []
        );
      } catch (err) {
        setError('Failed to delete quiz');
        console.error('Error deleting quiz:', err);
      }
    }
  };

  const getCourseTitle = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Unknown Course';
  };

  if (loading) return <div className="loading">Loading quizzes...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-quizzes">
      <div className="page-header">
        <h1>Manage Quizzes</h1>
        <Link to="/admin/quizzes/new" className="btn btn-primary">
          <Plus size={20} />
          Create New Quiz
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FileText />
          </div>
          <div className="stat-info">
            <span className="stat-number">{Array.isArray(quizzes) ? quizzes.length : 0}</span>
            <span className="stat-label">Total Quizzes</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <CheckCircle />
          </div>
          <div className="stat-info">
            <span className="stat-number">{Array.isArray(quizzes) ? quizzes.filter(q => q.isActive).length : 0}</span>
            <span className="stat-label">Active Quizzes</span>
          </div>
        </div>
      </div>

      <div className="quizzes-table">
        <div className="table-header">
          <h2>All Quizzes</h2>
        </div>
        {!Array.isArray(quizzes) || quizzes.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <h3>No Quizzes Found</h3>
            <p>Create your first quiz to get started.</p>
            <Link to="/admin/quizzes/new" className="btn btn-primary">
              Create Quiz
            </Link>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Quiz Title</th>
                  <th>Course</th>
                  <th>Questions</th>
                  <th>Time Limit</th>
                  <th>Passing Score</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map(quiz => (
                  <tr key={quiz.id}>
                    <td>
                      <div className="quiz-info">
                        <strong>{quiz.title}</strong>
                        {quiz.description && (
                          <p className="quiz-description">{quiz.description}</p>
                        )}
                      </div>
                    </td>
                    <td>{getCourseTitle(quiz.courseId)}</td>
                    <td>{quiz.questions ? quiz.questions.length : 0}</td>
                    <td>{quiz.timeLimit} minutes</td>
                    <td>{quiz.passingScore}%</td>
                    <td>
                      <span className={`status ${quiz.isActive ? 'active' : 'inactive'}`}>
                        {quiz.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link 
                          to={`/admin/quizzes/edit/${quiz.id}`}
                          className="btn btn-sm btn-secondary"
                          title="Edit Quiz"
                        >
                          <Edit size={16} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(quiz.id)}
                          className="btn btn-sm btn-danger"
                          title="Delete Quiz"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminQuizForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    timeLimit: 30,
    passingScore: 70,
    attempts: 1,
    isActive: true,
    randomizeQuestions: false,
    showResults: true,
    allowRetake: false,
    retakeCooldownHours: 24,
    questions: []
  });
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCourses = async () => {
    try {
      const coursesData = await courseService.getAllCourses();
      setCourses(Array.isArray(coursesData) ? coursesData : coursesData.courses || []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses');
    }
  };

  const fetchQuiz = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError('');
      const response = await quizService.getQuiz(id);
      const quiz = response.quiz || response; // Handle both nested and direct response
      
      console.log('Fetched quiz data:', quiz); // Debug log
      
      setFormData({
        title: quiz.title || '',
        description: quiz.description || '',
        courseId: quiz.courseId || '',
        timeLimit: quiz.timeLimit || 30,
        passingScore: quiz.passingScore || 70,
        attempts: quiz.attempts || 1,
        isActive: quiz.isActive !== undefined ? quiz.isActive : true,
        randomizeQuestions: quiz.randomizeQuestions || false,
        showResults: quiz.showResults !== undefined ? quiz.showResults : true,
        allowRetake: quiz.allowRetake || false,
        retakeCooldownHours: quiz.retakeCooldownHours || 24,
        questions: Array.isArray(quiz.questions) ? quiz.questions : []
      });
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError(`Failed to load quiz: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (isEditing) {
      fetchQuiz();
    }
  }, [id, isEditing, fetchQuiz]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.courseId || formData.questions.length === 0) {
      setError('Please fill in all required fields and add at least one question');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const quizData = {
        ...formData,
        totalPoints: formData.questions.reduce((sum, q) => sum + (q.points || 1), 0)
      };

      console.log('Submitting quiz data:', { isEditing, id, quizData }); // Debug log

      if (isEditing) {
        const result = await quizService.updateQuiz(id, quizData);
        console.log('Update result:', result); // Debug log
      } else {
        const result = await quizService.createQuiz(quizData);
        console.log('Create result:', result); // Debug log
      }
      
      navigate('/admin/quizzes');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      setError(isEditing ? `Failed to update quiz: ${errorMessage}` : `Failed to create quiz: ${errorMessage}`);
      console.error('Error saving quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      type: 'multiple-choice',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1,
      timeLimit: 30
    };
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (index, updatedQuestion) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === index ? updatedQuestion : q)
    }));
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="admin-form-page">
      <div className="page-header">
        <h1>{isEditing ? 'Edit Quiz' : 'Create New Quiz'}</h1>
        <button 
          type="button" 
          onClick={() => navigate('/admin/quizzes')}
          className="btn btn-secondary"
        >
          <ArrowLeft size={20} />
          Back to Quizzes
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="quiz-form">
        <div className="form-section">
          <h2>Quiz Information</h2>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="title">Quiz Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter quiz title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="courseId">Course *</label>
              <select
                id="courseId"
                name="courseId"
                value={formData.courseId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="timeLimit">Time Limit (minutes)</label>
              <input
                type="number"
                id="timeLimit"
                name="timeLimit"
                value={formData.timeLimit}
                onChange={handleInputChange}
                min="1"
                max="180"
              />
            </div>

            <div className="form-group">
              <label htmlFor="passingScore">Passing Score (%)</label>
              <input
                type="number"
                id="passingScore"
                name="passingScore"
                value={formData.passingScore}
                onChange={handleInputChange}
                min="0"
                max="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="attempts">Max Attempts</label>
              <input
                type="number"
                id="attempts"
                name="attempts"
                value={formData.attempts}
                onChange={handleInputChange}
                min="1"
                max="10"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="Enter quiz description"
            />
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              <span>Active (visible to students)</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="randomizeQuestions"
                checked={formData.randomizeQuestions}
                onChange={handleInputChange}
              />
              <span>Randomize question order</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="showResults"
                checked={formData.showResults}
                onChange={handleInputChange}
              />
              <span>Show results to students</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                name="allowRetake"
                checked={formData.allowRetake}
                onChange={handleInputChange}
              />
              <span>Allow retakes for failed attempts</span>
            </label>
          </div>

          {formData.allowRetake && (
            <div className="form-group">
              <label htmlFor="retakeCooldownHours">Retake Cooldown (hours)</label>
              <input
                type="number"
                id="retakeCooldownHours"
                name="retakeCooldownHours"
                value={formData.retakeCooldownHours}
                onChange={handleInputChange}
                min="1"
                max="8760"
                placeholder="24"
              />
              <small className="form-help">
                Time students must wait after a failed attempt before they can retake the quiz.
              </small>
            </div>
          )}
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2>Questions ({formData.questions.length})</h2>
            <button 
              type="button" 
              onClick={addQuestion}
              className="btn btn-primary"
            >
              <Plus size={20} />
              Add Question
            </button>
          </div>

          {formData.questions.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <h3>No Questions Added</h3>
              <p>Add questions to make your quiz interactive.</p>
              <button 
                type="button" 
                onClick={addQuestion}
                className="btn btn-primary"
              >
                Add First Question
              </button>
            </div>
          ) : (
            <div className="questions-list">
              {formData.questions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  index={index}
                  onUpdate={updateQuestion}
                  onRemove={removeQuestion}
                />
              ))}
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate('/admin/quizzes')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : isEditing ? 'Update Quiz' : 'Create Quiz'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    studentUsers: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Note: We'll need to create a userService for the users endpoint
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      
      // Calculate stats
      const totalUsers = data.users?.length || 0;
      const activeUsers = data.users?.filter(user => user.isActive).length || 0;
      const adminUsers = data.users?.filter(user => user.role === 'admin').length || 0;
      const studentUsers = data.users?.filter(user => user.role === 'student').length || 0;
      
      setStats({
        totalUsers,
        activeUsers,
        adminUsers,
        studentUsers
      });
      
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user status');
      }
      
      // Refresh users list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Failed to update user status');
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="admin-users">
      <div className="admin-header">
        <h1>Manage Users</h1>
        <Link to="/admin/users/new" className="btn btn-primary">
          <Plus size={20} />
          Add User
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* User Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalUsers}</h3>
          <p>Total Users</p>
        </div>
        <div className="stat-card">
          <h3>{stats.activeUsers}</h3>
          <p>Active Users</p>
        </div>
        <div className="stat-card">
          <h3>{stats.adminUsers}</h3>
          <p>Administrators</p>
        </div>
        <div className="stat-card">
          <h3>{stats.studentUsers}</h3>
          <p>Students</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.firstName} {user.lastName}</td>
                <td>{user.email}</td>
                <td>{user.username}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="actions">
                  <Link 
                    to={`/admin/users/edit/${user.id}`}
                    className="btn btn-sm btn-outline"
                    title="Edit User"
                  >
                    <Edit size={16} />
                  </Link>
                  <button
                    onClick={() => toggleUserStatus(user.id, user.isActive)}
                    className={`btn btn-sm ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                    title={user.isActive ? 'Deactivate User' : 'Activate User'}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && !loading && (
          <div className="no-data">
            <p>No users found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminUserForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: 'student',
    phone: '',
    dateOfBirth: '',
    isActive: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEditing) {
      fetchUser();
    }
  }, [id, isEditing]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user');
      }
      
      const data = await response.json();
      const user = data.user;
      
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        username: user.username || '',
        password: '', // Don't populate password for security
        role: user.role || 'student',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
        isActive: user.isActive !== undefined ? user.isActive : true
      });
      
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!formData.username.trim()) return 'Username is required';
    if (!isEditing && !formData.password.trim()) return 'Password is required';
    if (!formData.role) return 'Role is required';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Invalid email format';
    
    // Password validation for new users
    if (!isEditing && formData.password.length < 6) return 'Password must be at least 6 characters';
    
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const submitData = { ...formData };
      
      // Remove password if editing and no new password provided
      if (isEditing && !submitData.password.trim()) {
        delete submitData.password;
      }
      
      const url = isEditing ? `/api/users/${id}` : '/api/users';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save user');
      }
      
      setSuccess(isEditing ? 'User updated successfully!' : 'User created successfully!');
      
      // Redirect after success
      setTimeout(() => {
        navigate('/admin/users');
      }, 2000);
      
    } catch (error) {
      console.error('Error saving user:', error);
      setError(error.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return <div className="loading">Loading user data...</div>;
  }

  return (
    <div className="admin-form-page">
      <div className="page-header">
        <h1>{isEditing ? 'Edit User' : 'Create New User'}</h1>
        <Link to="/admin/users" className="btn btn-outline">
          <ArrowLeft size={20} />
          Back to Users
        </Link>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-section">
          <h3>Personal Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Account Settings</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                required
                disabled={loading}
              >
                <option value="student">Student</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="password">
                {isEditing ? 'New Password (leave blank to keep current)' : 'Password *'}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!isEditing}
                disabled={loading}
                placeholder={isEditing ? 'Enter new password to change' : ''}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                disabled={loading}
              />
              <span>Account Active</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="btn btn-outline"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : (isEditing ? 'Update User' : 'Create User')}
          </button>
        </div>
      </form>
    </div>
  );
};

// Detailed Result Modal Component
const DetailedResultModal = ({ isOpen, onClose, resultId }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && resultId) {
      fetchDetailedResult();
    }
  }, [isOpen, resultId]);

  const fetchDetailedResult = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await resultService.getDetailedResult(resultId);
      setResult(response.result);
    } catch (error) {
      console.error('Error fetching detailed result:', error);
      setError('Failed to load detailed result');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Detailed Quiz Result</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {loading && <div className="loading">Loading detailed result...</div>}
          {error && <div className="error-message">{error}</div>}
          
          {result && (
            <div className="detailed-result">
              {/* Student and Quiz Info */}
              <div className="result-summary">
                <div className="summary-grid">
                  <div className="summary-item">
                    <label>Student:</label>
                    <span>{result.student?.firstName} {result.student?.lastName}</span>
                  </div>
                  <div className="summary-item">
                    <label>Quiz:</label>
                    <span>{result.quiz?.title}</span>
                  </div>
                  <div className="summary-item">
                    <label>Course:</label>
                    <span>{result.course?.title}</span>
                  </div>
                  <div className="summary-item">
                    <label>Score:</label>
                    <span className={result.isPassed ? 'passed' : 'failed'}>
                      {result.score}/{result.quiz?.totalPoints} ({result.percentage}%)
                    </span>
                  </div>
                  <div className="summary-item">
                    <label>Status:</label>
                    <span className={`status-badge ${result.isPassed ? 'passed' : 'failed'}`}>
                      {result.isPassed ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <div className="summary-item">
                    <label>Completed:</label>
                    <span>{new Date(result.completedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Question by Question Breakdown */}
              {result.questionBreakdown && result.questionBreakdown.length > 0 && (
                <div className="question-breakdown">
                  <h3>Question by Question Analysis</h3>
                  <div className="questions-list">
                    {result.questionBreakdown.map((question, index) => (
                      <div key={index} className={`question-item ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                        <div className="question-header">
                          <span className="question-number">Question {question.questionNumber}</span>
                          <span className={`question-status ${question.isCorrect ? 'correct' : 'incorrect'}`}>
                            {question.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                            {question.points}/{question.maxPoints} pts
                          </span>
                        </div>
                        
                        <div className="question-content">
                          <p className="question-text"><strong>Q:</strong> {question.question}</p>
                          
                          {question.type === 'multiple-choice' && question.options && (
                            <div className="question-options">
                              <strong>Options:</strong>
                              <ul>
                                {question.options.map((option, optIndex) => {
                                  const isSelected = question.studentAnswer === option;
                                  const isCorrect = question.correctAnswer === option;
                                  return (
                                    <li key={optIndex} className={`
                                      ${isSelected ? 'selected' : ''} 
                                      ${isCorrect ? 'correct-answer' : ''}
                                    `}>
                                      {option}
                                      {isSelected && <span className="badge">Selected</span>}
                                      {isCorrect && <span className="badge correct">Correct</span>}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                          
                          <div className="answer-comparison">
                            <div className="student-answer">
                              <strong>Student Answer:</strong> 
                              <span className={question.isCorrect ? 'correct' : 'incorrect'}>
                                {question.studentAnswer || 'No answer'}
                              </span>
                            </div>
                            <div className="correct-answer">
                              <strong>Correct Answer:</strong> 
                              <span className="correct">{question.correctAnswer}</span>
                            </div>
                          </div>
                          
                          {question.timeSpent > 0 && (
                            <div className="time-spent">
                              <Clock size={14} />
                              Time spent: {Math.floor(question.timeSpent / 60)}:{(question.timeSpent % 60).toString().padStart(2, '0')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// Question Analytics Modal Component
const QuestionAnalyticsModal = ({ isOpen, onClose, quizId, quizTitle }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && quizId) {
      fetchQuestionAnalytics();
    }
  }, [isOpen, quizId]);

  const fetchQuestionAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await resultService.getQuestionAnalytics(quizId);
      setAnalytics(response);
    } catch (error) {
      console.error('Error fetching question analytics:', error);
      setError('Failed to load question analytics');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content extra-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Question Analytics - {quizTitle}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {loading && <div className="loading">Loading question analytics...</div>}
          {error && <div className="error-message">{error}</div>}
          
          {analytics && (
            <div className="question-analytics">
              {/* Overall Stats */}
              <div className="analytics-summary">
                <h3>Overall Quiz Performance</h3>
                <div className="stats-grid">
                  <div className="stat-card">
                    <h4>{analytics.overallStats.totalQuestions}</h4>
                    <p>Total Questions</p>
                  </div>
                  <div className="stat-card">
                    <h4>{analytics.overallStats.totalAttempts}</h4>
                    <p>Student Attempts</p>
                  </div>
                  <div className="stat-card">
                    <h4>{analytics.overallStats.averageSuccessRate?.toFixed(1)}%</h4>
                    <p>Average Success Rate</p>
                  </div>
                  <div className="stat-card">
                    <h4>Q{analytics.overallStats.hardestQuestion?.questionNumber}</h4>
                    <p>Hardest Question</p>
                  </div>
                  <div className="stat-card">
                    <h4>Q{analytics.overallStats.easiestQuestion?.questionNumber}</h4>
                    <p>Easiest Question</p>
                  </div>
                </div>
              </div>

              {/* Individual Question Analytics */}
              <div className="questions-analytics">
                <h3>Question-by-Question Analysis</h3>
                <div className="questions-grid">
                  {analytics.questionAnalytics.map((question, index) => (
                    <div key={index} className={`question-analytics-item ${question.difficulty.toLowerCase()}`}>
                      <div className="question-header">
                        <span className="question-number">Question {question.questionNumber}</span>
                        <span className={`difficulty-badge ${question.difficulty.toLowerCase()}`}>
                          {question.difficulty}
                        </span>
                      </div>
                      
                      <div className="question-text">
                        <p>{question.question}</p>
                      </div>
                      
                      <div className="question-stats">
                        <div className="stat-row">
                          <span>Success Rate:</span>
                          <span className="success-rate">{question.successRate}%</span>
                        </div>
                        <div className="stat-row">
                          <span>Attempts:</span>
                          <span>{question.correctAttempts}/{question.totalAttempts}</span>
                        </div>
                        <div className="stat-row">
                          <span>Avg Time:</span>
                          <span>{Math.floor(question.averageTime / 60)}:{(question.averageTime % 60).toString().padStart(2, '0')}</span>
                        </div>
                        <div className="stat-row">
                          <span>Avg Points:</span>
                          <span>{question.averagePoints}/{question.maxPoints}</span>
                        </div>
                      </div>
                      
                      {/* Option Statistics for Multiple Choice */}
                      {question.type === 'multiple-choice' && question.optionStats && (
                        <div className="option-statistics">
                          <h5>Answer Distribution:</h5>
                          <div className="options-stats">
                            {Object.entries(question.optionStats).map(([option, stats]) => {
                              const isCorrect = option === question.correctAnswer;
                              return (
                                <div key={option} className={`option-stat ${isCorrect ? 'correct' : ''}`}>
                                  <span className="option-text">{option}</span>
                                  <div className="stat-bar">
                                    <div 
                                      className="stat-fill" 
                                      style={{ width: `${stats.percentage}%` }}
                                    ></div>
                                    <span className="stat-label">{stats.percentage}% ({stats.count})</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export const AdminResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalAttempts: 0,
    averageScore: 0,
    passRate: 0,
    totalStudents: 0
  });
  const [filters, setFilters] = useState({
    courseId: '',
    quizId: '',
    studentId: '',
    passed: ''
  });
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [selectedResultId, setSelectedResultId] = useState(null);
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [selectedQuizTitle, setSelectedQuizTitle] = useState('');
  const [enrolledUsers, setEnrolledUsers] = useState([]);
  const [loadingEnrolled, setLoadingEnrolled] = useState(false);

  useEffect(() => {
    fetchResults();
    fetchCourses();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/results/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      
      const data = await response.json();
      const resultsData = data.results || [];
      setResults(resultsData);
      
      // Calculate stats
      if (resultsData.length > 0) {
        const totalAttempts = resultsData.length;
        const averageScore = resultsData.reduce((sum, result) => sum + result.percentage, 0) / totalAttempts;
        const passedResults = resultsData.filter(result => result.isPassed);
        const passRate = (passedResults.length / totalAttempts) * 100;
        const uniqueStudents = [...new Set(resultsData.map(result => result.studentId))].length;
        
        setStats({
          totalAttempts,
          averageScore: averageScore.toFixed(1),
          passRate: passRate.toFixed(1),
          totalStudents: uniqueStudents
        });
      }
      
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to load quiz results');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      console.log('Fetching courses for AdminResults...');
      const response = await courseService.getAllCourses();
      console.log('Courses response:', response);
      const coursesList = response.courses || response || [];
      console.log('Setting courses:', coursesList);
      setCourses(coursesList);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const fetchEnrolledUsers = async (courseId) => {
    try {
      setLoadingEnrolled(true);
      console.log('Fetching enrolled users for course:', courseId);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/courses/${courseId}/enrolled-users-quiz-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Enrolled users response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch enrolled users:', response.status, errorText);
        throw new Error(`Failed to fetch enrolled users: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Enrolled users data:', data);
      
      setEnrolledUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching enrolled users:', error);
      setEnrolledUsers([]);
      setError(`Failed to load enrolled users: ${error.message}`);
    } finally {
      setLoadingEnrolled(false);
    }
  };

  const filteredResults = results.filter(result => {
    return (
      (!filters.courseId || result.courseId?.toString() === filters.courseId) &&
      (!filters.quizId || result.quizId?.toString() === filters.quizId) &&
      (!filters.passed || (filters.passed === 'true' ? result.isPassed : !result.isPassed))
    );
  });

  if (loading) return <div className="loading">Loading quiz results...</div>;

  return (
    <div className="admin-results">
      <div className="admin-header">
        <h1>Quiz Results & Analytics</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Course Statistics Grid */}
      <div className="course-stats-section">
        <h2>Course Analytics</h2>
        <div className="course-stats-grid">
          {courses && courses.length > 0 ? courses.map(course => {
            const courseResults = results.filter(result => result.courseId === course.id);
            const totalAttempts = courseResults.length;
            const passedAttempts = courseResults.filter(result => result.isPassed).length;
            const passRate = totalAttempts > 0 ? ((passedAttempts / totalAttempts) * 100).toFixed(1) : '0';
            
            return (
              <div key={course.id} className="course-stat-card">
                <div className="course-info">
                  <h4>{course.title}</h4>
                  <div className="course-stats">
                    <span className="stat"><strong>{totalAttempts}</strong> attempts</span>
                    <span className="stat"><strong>{passRate}%</strong> pass rate</span>
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-outline"
                  title="Course Analytics"
                  onClick={() => {
                    // Find the quiz for this course - check multiple ways
                    let quizId = null;
                    let quizTitle = 'Quiz';
                    
                    // Method 1: From course results
                    const courseQuiz = courseResults.find(result => result.quiz)?.quiz;
                    if (courseQuiz) {
                      quizId = courseResults[0].quizId;
                      quizTitle = courseQuiz.title;
                    } else {
                      // Method 2: From course object if it has quiz info
                      if (course.quiz) {
                        quizId = course.quiz.id;
                        quizTitle = course.quiz.title;
                      } else if (course.quizId) {
                        quizId = course.quizId;
                      }
                    }
                    
                    if (quizId) {
                      setSelectedQuizId(quizId);
                      setSelectedQuizTitle(`${course.title} - ${quizTitle}`);
                      setShowAnalyticsModal(true);
                    } else {
                      alert('No quiz found for this course');
                    }
                  }}
                  disabled={false}
                >
                  <TrendingUp size={16} />
                </button>
              </div>
            );
          }) : (
            <div className="no-courses-message">
              <p>Loading courses...</p>
              {!loading && <p>No courses found. <button onClick={fetchCourses} className="btn btn-outline btn-sm">Retry</button></p>}
            </div>
          )}
        </div>
      </div>

      {/* Overall Analytics Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalAttempts}</h3>
          <p>Total Attempts</p>
        </div>
        <div className="stat-card">
          <h3>{stats.averageScore}%</h3>
          <p>Average Score</p>
        </div>
        <div className="stat-card">
          <h3>{stats.passRate}%</h3>
          <p>Pass Rate</p>
        </div>
        <div className="stat-card">
          <h3>{stats.totalStudents}</h3>
          <p>Students</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="filter-group">
            <label>Course:</label>
            <select
              value={filters.courseId}
              onChange={(e) => {
                handleFilterChange('courseId', e.target.value);
                if (e.target.value) {
                  fetchEnrolledUsers(e.target.value);
                }
              }}
            >
              <option value="">All Courses</option>
              {courses && courses.length > 0 ? courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              )) : (
                <option disabled>Loading courses...</option>
              )}
              {/* Debug info */}
              {console.log('Courses in filter:', courses)}
            </select>
          </div>
          
          <div className="filter-group">
            <label>Status:</label>
            <select
              value={filters.passed}
              onChange={(e) => handleFilterChange('passed', e.target.value)}
            >
              <option value="">All Results</option>
              <option value="true">Passed</option>
              <option value="false">Failed</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>View:</label>
            <select
              value={filters.viewMode || 'results'}
              onChange={(e) => handleFilterChange('viewMode', e.target.value)}
            >
              <option value="results">Quiz Results</option>
              <option value="pending">Enrolled but Not Taken</option>
            </select>
          </div>
          
          <button 
            onClick={() => {
              setFilters({ courseId: '', quizId: '', studentId: '', passed: '', viewMode: 'results' });
              setEnrolledUsers([]);
            }}
            className="btn btn-outline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results or Enrolled Users Table */}
      <div className="results-table">
        {filters.viewMode === 'pending' ? (
          /* Enrolled Users Who Haven't Taken Quiz */
          <>
            <h3>Enrolled Users Who Haven't Taken the Quiz</h3>
            {loadingEnrolled ? (
              <div className="loading">Loading enrolled users...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Enrollment Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledUsers.filter(user => !user.hasTakenQuiz).map(user => (
                    <tr key={user.id}>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>{user.email}</td>
                      <td>{new Date(user.enrolledAt).toLocaleDateString()}</td>
                      <td>
                        <span className="status-badge pending">
                          Not Started
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {!loadingEnrolled && enrolledUsers.filter(user => !user.hasTakenQuiz).length === 0 && (
              <div className="no-data">
                <p>
                  {!filters.courseId 
                    ? 'Please select a course to view enrolled users.' 
                    : enrolledUsers.length === 0 
                      ? 'No enrolled users found for this course.' 
                      : 'All enrolled users have taken the quiz.'
                  }
                </p>
                {/* Debug info */}
                <p><small>Debug: Total enrolled users: {enrolledUsers.length}, Course ID: {filters.courseId}</small></p>
              </div>
            )}
          </>
        ) : (
          /* Regular Quiz Results */
          <>
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Quiz</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Time Spent</th>
                  <th>Completed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map(result => (
                  <tr key={result.id}>
                    <td>
                      {result.student ? 
                        `${result.student.firstName} ${result.student.lastName}` : 
                        'Unknown Student'
                      }
                    </td>
                    <td>{result.course?.title || 'Unknown Course'}</td>
                    <td>{result.quiz?.title || 'Unknown Quiz'}</td>
                    <td>{result.score}/{result.totalPoints}</td>
                    <td>
                      <span className={`percentage ${result.isPassed ? 'passed' : 'failed'}`}>
                        {result.percentage}%
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${result.isPassed ? 'passed' : 'failed'}`}>
                        {result.isPassed ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td>{Math.floor(result.timeSpent / 60)}:{(result.timeSpent % 60).toString().padStart(2, '0')}</td>
                    <td>{new Date(result.completedAt).toLocaleDateString()}</td>
                    <td className="actions">
                      <button
                        className="btn btn-sm btn-outline"
                        title="View Detailed Result"
                        onClick={() => {
                          setSelectedResultId(result.id);
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn btn-sm btn-outline"
                        title="Question Analytics"
                        onClick={() => {
                          setSelectedQuizId(result.quizId);
                          setSelectedQuizTitle(result.quiz?.title || 'Quiz');
                          setShowAnalyticsModal(true);
                        }}
                      >
                        <TrendingUp size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredResults.length === 0 && !loading && (
              <div className="no-data">
                <p>No quiz results found.</p>
                {Object.values(filters).some(filter => filter) && (
                  <p>Try adjusting your filters or <button onClick={() => setFilters({ courseId: '', quizId: '', studentId: '', passed: '', viewMode: 'results' })} className="link-button">clear all filters</button>.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Modals */}
      <DetailedResultModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedResultId(null);
        }}
        resultId={selectedResultId}
      />
      
      <QuestionAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => {
          setShowAnalyticsModal(false);
          setSelectedQuizId(null);
          setSelectedQuizTitle('');
        }}
        quizId={selectedQuizId}
        quizTitle={selectedQuizTitle}
      />
    </div>
  );
};