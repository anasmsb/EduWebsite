import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import resultService from '../../services/resultService';

const StudentResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showResultModal, setShowResultModal] = useState(false);
  const [newResult, setNewResult] = useState(null);
  
  const location = useLocation();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await resultService.getMyResults();
        setResults(response || []);
        
        // Check if we have a new result from quiz submission
        if (location.state?.newResult && location.state?.showModal) {
          setNewResult(location.state.newResult);
          setShowResultModal(true);
        }
      } catch (error) {
        setError('Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [location.state]);

  const getResultBadge = (result) => {
    if (result.isPassed) {
      return <span className="badge badge-success">Passed</span>;
    } else {
      return <span className="badge badge-danger">Failed</span>;
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'average';
    return 'poor';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <div className="loading">Loading results...</div>;

  return (
    <div className="results-page">
      <h1 className="page-title">My Quiz Results</h1>
      
      {error && <div className="alert alert-danger">{error}</div>}
      
      {/* Result Modal */}
      {showResultModal && newResult && (
        <div className="modal-overlay">
          <div className="result-modal">
            <div className="modal-header">
              <h2>Quiz Completed!</h2>
              <button 
                className="modal-close"
                onClick={() => setShowResultModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="result-summary">
                <div className={`score-circle ${newResult.isPassed ? 'passed' : 'failed'}`}>
                  <span className="score-percentage">{newResult.percentage}%</span>
                  <span className="score-status">
                    {newResult.isPassed ? 'Passed' : 'Failed'}
                  </span>
                </div>
                
                <div className="result-details">
                  <div className="detail-item">
                    <span className="label">Score:</span>
                    <span className="value">{newResult.score} / {newResult.totalPoints}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Correct Answers:</span>
                    <span className="value">{newResult.correctAnswers} / {newResult.totalQuestions}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Passing Score:</span>
                    <span className="value">{newResult.passingScore}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-primary"
                onClick={() => setShowResultModal(false)}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!results || results.length === 0 ? (
        <div className="empty-state">
          <p>You haven't completed any quizzes yet.</p>
          <Link to="/student/courses" className="btn btn-primary">
            Browse Courses
          </Link>
        </div>
      ) : (
        <>
          {/* Statistics */}
          <div className="results-stats">
            <div className="stat-card">
              <h3>Total Quizzes</h3>
              <div className="stat-number">{results ? results.length : 0}</div>
            </div>
            <div className="stat-card">
              <h3>Passed</h3>
              <div className="stat-number">
                {results ? results.filter(r => r.isPassed).length : 0}
              </div>
            </div>
            <div className="stat-card">
              <h3>Average Score</h3>
              <div className="stat-number">
                {results && results.length > 0 
                  ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
                  : 0
                }%
              </div>
            </div>
          </div>
          
          {/* Results List */}
          <div className="results-list">
            {results && results.map((result) => (
              <div key={result._id} className="result-card">
                <div className="result-header">
                  <div className="result-info">
                    <h3>{result.quiz.title}</h3>
                    <p className="course-name">{result.course.title}</p>
                  </div>
                  <div className="result-status">
                    {getResultBadge(result)}
                  </div>
                </div>
                
                <div className="result-details">
                  <div className="result-score">
                    <span className={`score-display ${getScoreColor(result.percentage)}`}>
                      {result.percentage}%
                    </span>
                    <span className="score-fraction">
                      {result.correctAnswers}/{result.totalQuestions} correct
                    </span>
                  </div>
                  
                  <div className="result-meta">
                    <span>Attempt #{result.attemptNumber}</span>
                    <span>Completed: {formatDate(result.completedAt)}</span>
                    <span>
                      Time: {Math.floor(result.timeSpent / 60)}m {result.timeSpent % 60}s
                    </span>
                  </div>
                </div>
                
                <div className="result-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${result.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StudentResults;