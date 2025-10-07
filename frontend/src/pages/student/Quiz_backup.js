import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';
import './Quiz.css';

const StudentQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [quizTimeLeft, setQuizTimeLeft] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [results, setResults] = useState(null);
  const [startTime, setStartTime] = useState(null);

  const fetchQuiz = useCallback(async () => {
    try {
      setLoading(true);
      const response = await quizService.getQuizForTaking(id);
      setQuiz(response.quiz);
      setQuizTimeLeft(response.quiz.timeLimit * 60); // Convert to seconds
      if (response.quiz.questions && response.quiz.questions.length > 0) {
        setQuestionTimeLeft(response.quiz.questions[0]?.timeLimit || 30);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  // Quiz timer
  useEffect(() => {
    if (!quizStarted || quizCompleted || !quiz) return;

    const timer = setInterval(() => {
      setQuizTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, quizCompleted, quiz]);

  // Question timer
  useEffect(() => {
    if (!quizStarted || quizCompleted || !quiz) return;

    const timer = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          handleQuestionTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion, quizStarted, quizCompleted, quiz]);

    return () => clearInterval(quizTimer);
  }, [quizStarted, quiz]);

  useEffect(() => {
    if (!quizStarted || !quiz) return;

    // Question timer
    const questionTimer = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(questionTimer);
  }, [currentQuestion, quizStarted]);

  const startQuiz = () => {
    setQuizStarted(true);
    setStartTime(new Date());
    setQuestionStartTime(new Date());
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (!quiz) return;

    // Record time spent on current question
    const timeSpent = questionStartTime 
      ? Math.floor((new Date() - questionStartTime) / 1000)
      : 0;

    const currentQ = quiz.questions[currentQuestion];
    if (currentQ && !answers[currentQ._id]) {
      // Auto-select first option if no answer selected
      setAnswers(prev => ({
        ...prev,
        [currentQ._id]: currentQ.options[0]?.text || ''
      }));
    }

    if (currentQuestion < quiz.questions.length - 1) {
      const nextIndex = currentQuestion + 1;
      setCurrentQuestion(nextIndex);
      setQuestionTimeLeft(quiz.questions[nextIndex]?.timeLimit || 30);
      setQuestionStartTime(new Date());
    } else {
      handleSubmit();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      const prevIndex = currentQuestion - 1;
      setCurrentQuestion(prevIndex);
      setQuestionTimeLeft(quiz.questions[prevIndex]?.timeLimit || 30);
      setQuestionStartTime(new Date());
    }
  };

  const handleSubmit = async () => {
    if (submitting || !quiz) return;

    setSubmitting(true);

    try {
      const submissionData = {
        answers: quiz.questions.map(q => ({
          questionId: q._id,
          selectedAnswer: answers[q._id] || '',
          timeSpent: 0 // Calculate based on timing logic
        })),
        startedAt: startTime,
        timeSpent: Math.floor((new Date() - startTime) / 1000)
      };

      const response = await quizService.submitQuiz(id, submissionData);
      
      // Navigate to results with result data
      navigate('/student/results', { 
        state: { 
          newResult: response.result,
          showModal: true 
        }
      });
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit quiz');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="loading">Loading quiz...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!quiz) return <div className="alert alert-danger">Quiz not found</div>;

  if (!quizStarted) {
    return (
      <div className="quiz-intro">
        <div className="quiz-intro-card">
          <h1>{quiz.title}</h1>
          {quiz.description && <p>{quiz.description}</p>}
          
          <div className="quiz-info">
            <div className="quiz-stat">
              <strong>Questions:</strong> {quiz.questions.length}
            </div>
            <div className="quiz-stat">
              <strong>Time Limit:</strong> {quiz.timeLimit} minutes
            </div>
            <div className="quiz-stat">
              <strong>Passing Score:</strong> {quiz.passingScore}%
            </div>
          </div>
          
          <div className="quiz-instructions">
            <h3>Instructions:</h3>
            <ul>
              <li>You have {quiz.timeLimit} minutes to complete the quiz</li>
              <li>Each question has a time limit</li>
              <li>You cannot go back once you move to the next question</li>
              <li>Make sure you have a stable internet connection</li>
            </ul>
          </div>
          
          <button className="btn btn-success btn-large" onClick={startQuiz}>
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQuestion];

  return (
    <div className="quiz-taking">
      <div className="quiz-header">
        <div className="quiz-progress">
          Question {currentQuestion + 1} of {quiz.questions.length}
        </div>
        <div className="quiz-timers">
          <div className="quiz-timer">
            Total: {formatTime(timeLeft)}
          </div>
          <div className="question-timer">
            Question: {formatTime(questionTimeLeft)}
          </div>
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      <div className="question-container">
        <div className="question">
          <h2>{currentQ.question}</h2>
          
          <div className="question-options">
            {currentQ.type === 'multiple-choice' && (
              <div className="multiple-choice">
                {currentQ.options.map((option, index) => (
                  <label key={index} className="option-label">
                    <input
                      type="radio"
                      name={`question-${currentQ._id}`}
                      value={option.text}
                      checked={answers[currentQ._id] === option.text}
                      onChange={(e) => handleAnswerChange(currentQ._id, e.target.value)}
                    />
                    <span className="option-text">{option.text}</span>
                  </label>
                ))}
              </div>
            )}
            
            {currentQ.type === 'true-false' && (
              <div className="true-false">
                <label className="option-label">
                  <input
                    type="radio"
                    name={`question-${currentQ._id}`}
                    value="true"
                    checked={answers[currentQ._id] === 'true'}
                    onChange={(e) => handleAnswerChange(currentQ._id, e.target.value)}
                  />
                  <span className="option-text">True</span>
                </label>
                <label className="option-label">
                  <input
                    type="radio"
                    name={`question-${currentQ._id}`}
                    value="false"
                    checked={answers[currentQ._id] === 'false'}
                    onChange={(e) => handleAnswerChange(currentQ._id, e.target.value)}
                  />
                  <span className="option-text">False</span>
                </label>
              </div>
            )}
            
            {currentQ.type === 'dropdown' && (
              <select
                className="form-control"
                value={answers[currentQ._id] || ''}
                onChange={(e) => handleAnswerChange(currentQ._id, e.target.value)}
              >
                <option value="">Select an answer...</option>
                {currentQ.options.map((option, index) => (
                  <option key={index} value={option.text}>
                    {option.text}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="question-actions">
          <button
            className="btn btn-secondary"
            onClick={handlePreviousQuestion}
            disabled={currentQuestion === 0}
          >
            Previous
          </button>
          
          {currentQuestion === quiz.questions.length - 1 ? (
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              className="btn btn-primary"
              onClick={handleNextQuestion}
            >
              Next Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentQuiz;