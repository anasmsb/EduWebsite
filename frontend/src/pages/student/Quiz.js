import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import quizService from '../../services/quizService';
import languageService from '../../services/languageService';
import translationService from '../../services/translationService';
import './Quiz.css';

const StudentQuiz = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [session, setSession] = useState(null);
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
  const [lockedQuestions, setLockedQuestions] = useState(new Set());
  const [sessionUpdateInterval, setSessionUpdateInterval] = useState(null);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [languageLoading, setLanguageLoading] = useState(false);
  const [retakeInfo, setRetakeInfo] = useState(null);
  const [checkingRetake, setCheckingRetake] = useState(false);

  const fetchQuiz = useCallback(async (languageId = null) => {
    try {
      setLoading(true);
      let response;
      let originalResponse;
      
      // Always fetch the original quiz first
      originalResponse = await quizService.getQuizForTaking(id);
      
      if (languageId) {
        try {
          // Try to fetch translated quiz
          const translatedResponse = await translationService.getTranslatedQuiz(id, languageId);
          
          // Merge translated content with original structure
          const mergedQuestions = originalResponse.quiz.questions.map((originalQuestion) => {
            // Find the corresponding translated question by ID
            // Convert both IDs to strings for comparison to handle type mismatches
            const originalId = String(originalQuestion.id);
            const translatedQuestion = translatedResponse.quiz.questions.find(
              tq => String(tq.id) === originalId
            );
            
            if (translatedQuestion) {
              // Handle options merging based on structure
              let mergedOptions = originalQuestion.options;
              
              if (translatedQuestion.options && Array.isArray(translatedQuestion.options)) {
                // Check if translated options have the new structure (objects with text/isCorrect)
                if (translatedQuestion.options[0] && typeof translatedQuestion.options[0] === 'object' && 'text' in translatedQuestion.options[0]) {
                  // Extract just the text from the translated options
                  mergedOptions = translatedQuestion.options.map(opt => opt.text || opt);
                } else {
                  // Use translated options as-is if they're simple strings
                  mergedOptions = translatedQuestion.options;
                }
              }
              
              return {
                ...originalQuestion, // Keep original structure, type, correctAnswer, etc.
                question: translatedQuestion.question || originalQuestion.question,
                options: mergedOptions
              };
            }
            // If no translation found for this question, use original
            return originalQuestion;
          });
          
          response = {
            quiz: {
              ...originalResponse.quiz,
              title: translatedResponse.quiz.title || originalResponse.quiz.title,
              description: translatedResponse.quiz.description || originalResponse.quiz.description,
              questions: mergedQuestions,
              language: translatedResponse.quiz.language
            }
          };
        } catch (error) {
          // If translation doesn't exist, fall back to original quiz
          console.log('Translation not found, using original quiz');
          response = originalResponse;
        }
      } else {
        // Use original quiz
        response = originalResponse;
      }
      
      setQuiz(response.quiz);
      
      if (response.quiz.questions && response.quiz.questions.length > 0) {
        setQuestionTimeLeft(response.quiz.questions[0]?.timeLimit || 30);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchAvailableLanguages = useCallback(async () => {
    try {
      setLanguageLoading(true);
      const [languagesResponse, translationsResponse] = await Promise.all([
        languageService.getLanguages(true),
        translationService.getQuizTranslations(id)
      ]);
      
      // Get languages that have translations for this quiz, plus default language
      const translatedLanguageIds = translationsResponse.translations.map(t => t.language.id);
      const defaultLanguage = languagesResponse.languages.find(l => l.isDefault);
      const translatedLanguages = translationsResponse.translations.map(t => t.language);
      
      // Include default language and translated languages
      const available = [];
      if (defaultLanguage) {
        available.push({
          ...defaultLanguage,
          isOriginal: true
        });
        // Only set default language if no language is currently selected
        if (!selectedLanguage) {
          setSelectedLanguage(defaultLanguage.id);
        }
      }
      
      translatedLanguages.forEach(lang => {
        if (lang.id !== defaultLanguage?.id) {
          available.push({
            ...lang,
            isOriginal: false
          });
        }
      });
      
      setAvailableLanguages(available);
    } catch (error) {
      console.error('Failed to fetch languages:', error);
      // Continue with original quiz if language fetching fails
    } finally {
      setLanguageLoading(false);
    }
  }, [id]);

  const updateSession = useCallback(async () => {
    if (!session || quizCompleted) return;
    
    try {
      await quizService.updateQuizSession(id, {
        sessionToken: session.sessionToken,
        answers,
        lockedQuestions: Array.from(lockedQuestions),
        currentQuestion
      });
    } catch (error) {
      if (error.response?.status === 410) {
        // Session expired
        setError(error.response.data.message);
        setQuizCompleted(true);
        if (sessionUpdateInterval) {
          clearInterval(sessionUpdateInterval);
        }
      }
    }
  }, [id, session, answers, lockedQuestions, currentQuestion, quizCompleted, sessionUpdateInterval]);

  const startOrResumeSession = useCallback(async () => {
    try {
      const response = await quizService.startQuizSession(id);
      
      if (response.expired) {
        setError(response.message);
        return;
      }

      const sessionData = response.session;
      const quizData = response.quiz;
      
      // Debug: Log question order for consistency verification
      console.log('Quiz questions order:', quizData.questions.map((q, i) => `${i}: ${q.question.substring(0, 50)}...`));
      
      setSession(sessionData);
      
      // Check if we need to load translated content
      const defaultLanguage = availableLanguages.find(l => l.isDefault);
      if (selectedLanguage && selectedLanguage !== defaultLanguage?.id) {
        // Load translated quiz content
        try {
          const language = availableLanguages.find(l => l.id === selectedLanguage);
          let translatedResponse;
          
          if (language && !language.isOriginal) {
            translatedResponse = await translationService.getTranslatedQuiz(id, selectedLanguage);
            
            console.log('=== TRANSLATION MERGE DEBUG ===');
            console.log('Quiz data questions:', quizData.questions.length);
            console.log('Translation questions:', translatedResponse.quiz.questions.length);
            console.log('Sample original question:', quizData.questions[0]);
            console.log('Sample translated question:', translatedResponse.quiz.questions[0]);
            
            // Use translated content but preserve original question structure and IDs
            const mergedQuestions = quizData.questions.map((originalQuestion) => {
              // Find the corresponding translated question by ID
              // Convert both IDs to strings for comparison to handle type mismatches
              const originalId = String(originalQuestion.id);
              const translatedQuestion = translatedResponse.quiz.questions.find(
                tq => String(tq.id) === originalId
              );
              
              console.log(`Merging question ID ${originalQuestion.id}:`, {
                originalIdType: typeof originalQuestion.id,
                originalText: originalQuestion.question?.substring(0, 30),
                translatedText: translatedQuestion?.question?.substring(0, 30),
                found: !!translatedQuestion,
                translatedIds: translatedResponse.quiz.questions.map(q => ({ id: q.id, type: typeof q.id })),
                originalOptions: originalQuestion.options,
                translatedOptions: translatedQuestion?.options
              });
              
              if (translatedQuestion) {
                // Handle options merging based on structure
                let mergedOptions = originalQuestion.options;
                
                if (translatedQuestion.options && Array.isArray(translatedQuestion.options)) {
                  // Check if translated options have the new structure (objects with text/isCorrect)
                  if (translatedQuestion.options[0] && typeof translatedQuestion.options[0] === 'object' && 'text' in translatedQuestion.options[0]) {
                    // Extract just the text from the translated options
                    mergedOptions = translatedQuestion.options.map(opt => opt.text || opt);
                    console.log(`Extracted options for question ${originalQuestion.id}:`, mergedOptions);
                  } else {
                    // Use translated options as-is if they're simple strings
                    mergedOptions = translatedQuestion.options;
                  }
                }
                
                const merged = {
                  ...originalQuestion, // Keep original structure, type, correctAnswer, etc.
                  question: translatedQuestion.question || originalQuestion.question,
                  options: mergedOptions
                };
                
                console.log(`Merged question ${originalQuestion.id}:`, {
                  question: merged.question?.substring(0, 30),
                  options: merged.options
                });
                
                return merged;
              }
              // If no translation found for this question, use original
              console.log(`No translation for question ${originalQuestion.id}, using original`);
              return originalQuestion;
            });
            
            console.log('Final merged questions:', mergedQuestions);
            console.log('=== END TRANSLATION MERGE DEBUG ===');
            
            setQuiz({
              ...quizData,
              title: translatedResponse.quiz.title,
              description: translatedResponse.quiz.description,
              questions: mergedQuestions, // Use merged questions that preserve IDs
              language: translatedResponse.quiz.language
            });
          } else {
            setQuiz(quizData);
          }
        } catch (error) {
          console.log('Translation not found, using original quiz');
          setQuiz(quizData);
        }
      } else {
        setQuiz(quizData); // Set the consistently ordered quiz data
      }
      
      setAnswers(sessionData.answers || {});
      setLockedQuestions(new Set(sessionData.lockedQuestions || []));
      setCurrentQuestion(sessionData.currentQuestion || 0);
      setQuizTimeLeft(sessionData.timeRemaining || 0);
      setQuizStarted(true);

      // Start periodic session updates
      const updateInterval = setInterval(() => {
        updateSession();
      }, 10000); // Update every 10 seconds
      
      setSessionUpdateInterval(updateInterval);
      
      // Set question timer for current question
      if (quizData && quizData.questions) {
        const currentQ = quizData.questions[sessionData.currentQuestion || 0];
        if (currentQ && !sessionData.lockedQuestions?.includes(sessionData.currentQuestion || 0)) {
          setQuestionTimeLeft(currentQ.timeLimit || 30);
        } else {
          setQuestionTimeLeft(0);
        }
      }
    } catch (error) {
      if (error.response?.status === 410) {
        setError(error.response.data.message);
      } else if (error.response?.status === 403) {
        // Handle retake restrictions
        setRetakeInfo({
          canRetake: false,
          message: error.response.data.message,
          retakeAvailableAt: error.response.data.retakeAvailableAt,
          cooldownHours: error.response.data.cooldownHours
        });
        setError('');
      } else {
        setError(error.response?.data?.message || 'Failed to start quiz session');
      }
    }
  }, [id, updateSession, selectedLanguage, availableLanguages]);

  // Define callback functions first to avoid hoisting issues
  const handleSubmit = useCallback(async () => {
    try {
      setSubmitting(true);
      
      if (sessionUpdateInterval) {
        clearInterval(sessionUpdateInterval);
      }

      console.log('=== QUIZ SUBMISSION DEBUG ===');
      console.log('Session token:', session?.sessionToken);
      console.log('Answers being submitted:', JSON.stringify(answers, null, 2));
      console.log('Answer keys:', Object.keys(answers));
      console.log('==============================');

      const response = await quizService.completeQuizSession(id, {
        sessionToken: session?.sessionToken,
        answers
      });
      
      setResults(response.result);
      setQuizCompleted(true);
    } catch (error) {
      console.error('Quiz submission error:', error);
      if (error.response?.status === 410) {
        setError(error.response.data.message);
        setQuizCompleted(true);
      } else {
        setError(error.response?.data?.message || 'Failed to submit quiz');
      }
    } finally {
      setSubmitting(false);
    }
  }, [id, session, answers, sessionUpdateInterval]);

  const handleTimeUp = useCallback(async () => {
    // Auto submit when quiz time runs out
    await handleSubmit();
  }, [handleSubmit]);

  const handleQuestionTimeUp = useCallback(() => {
    // Lock the current question when time runs out
    setLockedQuestions(prev => {
      const newLocked = new Set(prev);
      newLocked.add(currentQuestion);
      return newLocked;
    });
    
    // Reset timer for current question (it's now locked)
    setQuestionTimeLeft(0);
  }, [currentQuestion]);



  useEffect(() => {
    // Fetch available languages first
    fetchAvailableLanguages();
  }, [fetchAvailableLanguages]);

  // Separate effect for loading quiz with selected language
  useEffect(() => {
    // Only fetch quiz data when:
    // 1. We have a selected language
    // 2. Quiz hasn't started yet
    // 3. Available languages are loaded
    if (selectedLanguage !== null && !quizStarted && availableLanguages.length > 0) {
      const language = availableLanguages.find(l => l.id === selectedLanguage);
      if (language) {
        if (language.isOriginal) {
          fetchQuiz();
        } else {
          fetchQuiz(selectedLanguage);
        }
      }
    }
  }, [fetchQuiz, selectedLanguage, quizStarted, availableLanguages.length]); // Use length to avoid re-renders when array content changes

  // Update session whenever state changes
  useEffect(() => {
    if (quizStarted && session && !quizCompleted) {
      const debounceTimeout = setTimeout(() => {
        updateSession();
      }, 1000); // Debounce updates
      
      return () => clearTimeout(debounceTimeout);
    }
  }, [answers, lockedQuestions, currentQuestion, quizStarted, session, quizCompleted, updateSession]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (sessionUpdateInterval) {
        clearInterval(sessionUpdateInterval);
      }
    };
  }, [sessionUpdateInterval]);

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
  }, [quizStarted, quizCompleted, quiz, handleTimeUp]);

  // Question timer
  useEffect(() => {
    if (!quizStarted || quizCompleted || !quiz || lockedQuestions.has(currentQuestion)) return;

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
  }, [currentQuestion, quizStarted, quizCompleted, quiz, handleQuestionTimeUp, lockedQuestions]);

  const handleLanguageChange = async (languageId) => {
    const numericLanguageId = typeof languageId === 'string' ? parseInt(languageId) : languageId;
    if (numericLanguageId === selectedLanguage) return;
    
    setSelectedLanguage(numericLanguageId);
    
    // Find the selected language
    const language = availableLanguages.find(l => l.id === numericLanguageId);
    
    if (quizStarted && session) {
      // If quiz is already started, we need to update only the display content
      // without affecting the session or quiz logic
      try {
        let response;
        if (language?.isOriginal) {
          response = await quizService.getQuizForTaking(id);
        } else {
          try {
            response = await translationService.getTranslatedQuiz(id, numericLanguageId);
          } catch (error) {
            console.log('Translation not found, using original quiz');
            response = await quizService.getQuizForTaking(id);
          }
        }
        
        // Update only the content (title, description, questions) but preserve session data and question IDs
        setQuiz(prevQuiz => {
          // Merge translated content with existing question structure
          const mergedQuestions = prevQuiz.questions.map((existingQuestion) => {
            // Find the corresponding translated question by ID
            // Convert both IDs to strings for comparison to handle type mismatches
            const existingId = String(existingQuestion.id);
            const newQuestion = response.quiz.questions.find(
              tq => String(tq.id) === existingId
            );
            
            if (newQuestion) {
              // Handle options merging based on structure
              let mergedOptions = existingQuestion.options;
              
              if (newQuestion.options && Array.isArray(newQuestion.options)) {
                // Check if translated options have the new structure (objects with text/isCorrect)
                if (newQuestion.options[0] && typeof newQuestion.options[0] === 'object' && 'text' in newQuestion.options[0]) {
                  // Extract just the text from the translated options
                  mergedOptions = newQuestion.options.map(opt => opt.text || opt);
                } else {
                  // Use translated options as-is if they're simple strings
                  mergedOptions = newQuestion.options;
                }
              }
              
              return {
                ...existingQuestion, // Preserve ID, type, options structure, etc.
                question: newQuestion.question || existingQuestion.question,
                options: mergedOptions
              };
            }
            return existingQuestion;
          });
          
          return {
            ...prevQuiz,
            title: response.quiz.title,
            description: response.quiz.description,
            questions: mergedQuestions, // Use merged questions that preserve IDs
            language: response.quiz.language
          };
        });
      } catch (error) {
        console.error('Failed to switch language during quiz:', error);
      }
    } else {
      // If quiz hasn't started yet, fetch normally
      if (language?.isOriginal) {
        await fetchQuiz();
      } else {
        await fetchQuiz(numericLanguageId);
      }
    }
  };

  const startQuiz = () => {
    startOrResumeSession();
  };

  const handleAnswerChange = (questionId, answer) => {
    // Don't allow changes to locked questions
    if (lockedQuestions.has(currentQuestion)) {
      console.log(`Question ${currentQuestion} is locked, ignoring answer change`);
      return;
    }
    
    console.log('Answer changing:', { questionId, answer, currentQuestion });
    
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: answer
      };
      console.log('New answers state:', newAnswers);
      return newAnswers;
    });
    
    // Don't lock immediately - let student think and change their mind
    // Answer will be locked when they click Next or time expires
  };

  const nextQuestion = () => {
    // Lock the current question when moving to next
    setLockedQuestions(prev => {
      const newLocked = new Set(prev);
      newLocked.add(currentQuestion);
      return newLocked;
    });

    if (quiz && currentQuestion < quiz.questions.length - 1) {
      const nextIndex = currentQuestion + 1;
      setCurrentQuestion(nextIndex);
      // Only set timer if question is not locked
      if (!lockedQuestions.has(nextIndex)) {
        setQuestionTimeLeft(quiz.questions[nextIndex]?.timeLimit || 30);
      } else {
        setQuestionTimeLeft(0);
      }
    }
  };

  const prevQuestion = () => {
    if (quiz && currentQuestion > 0) {
      const prevIndex = currentQuestion - 1;
      setCurrentQuestion(prevIndex);
      // Only set timer if question is not locked
      if (!lockedQuestions.has(prevIndex)) {
        setQuestionTimeLeft(quiz.questions[prevIndex]?.timeLimit || 30);
      } else {
        setQuestionTimeLeft(0);
      }
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestion(index);
    // Only set timer if question is not locked
    if (!lockedQuestions.has(index)) {
      setQuestionTimeLeft(quiz.questions[index]?.timeLimit || 30);
    } else {
      setQuestionTimeLeft(0);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question, index) => {
    const currentAnswer = answers[question.id];
    const isLocked = lockedQuestions.has(index);

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className={`question-options ${isLocked ? 'locked' : ''}`}>
            {isLocked && (
              <div className="locked-message">
                🔒 This question has been locked. {currentAnswer !== null && currentAnswer !== undefined ? 
                  `Your answer: "${question.options[parseInt(currentAnswer)]?.text || question.options[parseInt(currentAnswer)] || 'Unknown'}"` : 
                  'No answer was selected.'}
              </div>
            )}
            {question.options.map((option, optionIndex) => {
              // Handle empty objects and ensure we have valid strings
              let optionText;
              
              if (typeof option === 'string') {
                optionText = option;
              } else if (option && typeof option === 'object') {
                optionText = option.text || option.value || `Option ${optionIndex + 1}`;
              } else {
                optionText = `Option ${optionIndex + 1}`;
              }
              
              // Always use option index as the value for language independence
              const optionValue = optionIndex.toString();
              
              return (
                <label key={optionIndex} className={`option-label ${isLocked ? 'disabled' : ''}`}>
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={optionValue}
                    checked={currentAnswer === optionValue}
                    onChange={(e) => {
                      console.log('Multiple choice answer changed:', e.target.value, 'for question:', question.id);
                      handleAnswerChange(question.id, e.target.value);
                    }}
                    disabled={isLocked}
                  />
                  <span className="option-text">{optionText}</span>
                </label>
              );
            })}
          </div>
        );

      case 'true-false':
        return (
          <div className={`question-options ${isLocked ? 'locked' : ''}`}>
            {isLocked && (
              <div className="locked-message">
                🔒 This question has been locked. {currentAnswer !== null && currentAnswer !== undefined ? 
                  `Your answer: "${currentAnswer === '0' ? 'True' : 'False'}"` : 
                  'No answer was selected.'}
              </div>
            )}
            {question.options && question.options.map((option, optionIndex) => {
              // Handle empty objects and ensure we have valid strings
              let optionText;
              
              if (typeof option === 'string') {
                optionText = option;
              } else if (option && typeof option === 'object') {
                optionText = option.text || option.value || (optionIndex === 0 ? 'True' : 'False');
              } else {
                optionText = optionIndex === 0 ? 'True' : 'False';
              }
              
              // Use option index (0 for True, 1 for False) to match quiz creation format
              const optionValue = optionIndex.toString();
              
              return (
                <label key={optionIndex} className={`option-label ${isLocked ? 'disabled' : ''}`}>
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={optionValue}
                    checked={currentAnswer === optionValue}
                    onChange={(e) => {
                      console.log('True/false answer changed:', e.target.value, 'for question:', question.id);
                      handleAnswerChange(question.id, e.target.value);
                    }}
                    disabled={isLocked}
                  />
                  <span className="option-text">{optionText}</span>
                </label>
              );
            })}
          </div>
        );

      case 'dropdown':
        return (
          <div className={`question-options ${isLocked ? 'locked' : ''}`}>
            {isLocked && (
              <div className="locked-message">
                🔒 This question has been locked. {currentAnswer !== null && currentAnswer !== undefined && currentAnswer !== '' ? 
                  `Your answer: "${question.options[parseInt(currentAnswer)]?.text || question.options[parseInt(currentAnswer)] || 'Unknown'}"` : 
                  'No answer was selected.'}
              </div>
            )}
            <select
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              className={`dropdown-select ${isLocked ? 'disabled' : ''}`}
              disabled={isLocked}
              name={`question-${question.id}`}
            >
              <option value="">Select an answer...</option>
              {question.options.map((option, optionIndex) => {
                // Handle empty objects and ensure we have valid strings
                let optionText;
                
                if (typeof option === 'string') {
                  optionText = option;
                } else if (option && typeof option === 'object') {
                  optionText = option.text || option.value || `Option ${optionIndex + 1}`;
                } else {
                  optionText = `Option ${optionIndex + 1}`;
                }
                
                // Always use option index as the value for language independence
                const optionValue = optionIndex.toString();
                
                return (
                  <option key={optionIndex} value={optionValue}>
                    {optionText}
                  </option>
                );
              })}
            </select>
          </div>
        );

      default:
        return <div>Unknown question type</div>;
    }
  };

  if (loading || languageLoading) return <div className="loading">Loading quiz...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!quiz) return <div className="alert alert-danger">Quiz not found</div>;

  // Quiz completion screen
  if (quizCompleted && results) {
    return (
      <div className="quiz-container">
        <div className="quiz-results">
          <div className="results-header">
            <h1>🎉 Quiz Completed!</h1>
            <div className="score-display">
              <div className="score-circle">
                <span className="score-percentage">{results.percentage}%</span>
              </div>
            </div>
          </div>

          <div className="results-details">
            <div className="result-item">
              <strong>Score:</strong> {results.score} / {results.totalPoints} points
            </div>
            <div className="result-item">
              <strong>Correct Answers:</strong> {results.correctAnswers} / {results.totalQuestions}
            </div>
            <div className="result-item">
              <strong>Time Spent:</strong> {formatTime(results.timeSpent)}
            </div>
            <div className="result-item">
              <strong>Status:</strong> 
              <span className={`status ${results.isPassed ? 'passed' : 'failed'}`}>
                {results.isPassed ? ' ✅ Passed' : ' ❌ Failed'}
              </span>
            </div>
            {quiz.passingScore && (
              <div className="result-item">
                <strong>Passing Score:</strong> {quiz.passingScore}%
              </div>
            )}
          </div>

          <div className="results-actions">
            <button
              onClick={() => navigate('/student/courses')}
              className="btn btn-primary"
            >
              Back to Courses
            </button>
            {!results.isPassed && quiz.attempts > 1 && (
              <button
                onClick={() => window.location.reload()}
                className="btn btn-secondary"
              >
                Retake Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz start screen
  if (!quizStarted) {
    return (
      <div className="quiz-container">
        <div className="quiz-intro">
          {/* Instructions Section */}
          <div className="quiz-instructions">
            <h3>Instructions:</h3>
            <ul>
              <li>Each question has a time limit - think carefully before moving on</li>
              <li>You can change your answer as many times as you want until time expires or you click "Next"</li>
              <li>Questions become locked when you click "Next" or when time runs out</li>
              <li>Once locked, you cannot modify your answer</li>
              <li>Use the "Next" button to move between questions - no auto-advance</li>
              <li>Make sure to submit your quiz before the overall time limit expires</li>
            </ul>
          </div>

          {/* Quiz Details Section */}
          <div className="quiz-info-section">
            <h3>Quiz Details</h3>
            <div className="quiz-info">
              <div className="info-item">
                <strong>Questions:</strong> {quiz.questions.length}
              </div>
              <div className="info-item">
                <strong>Time Limit:</strong> {quiz.timeLimit} minutes
              </div>
              <div className="info-item">
                <strong>Passing Score:</strong> {quiz.passingScore}%
              </div>
              <div className="info-item">
                <strong>Attempts Allowed:</strong> {quiz.attempts}
              </div>
            </div>
          </div>
          
          {/* Language Selection */}
          {availableLanguages.length > 1 && (
            <div className="language-selection">
              <h3>Select Language / اختر اللغة / Choisir la langue</h3>
              <div className="language-options">
                {availableLanguages.map(language => (
                  <label key={language.id} className={`language-option ${selectedLanguage === language.id ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="quiz-language"
                      value={language.id}
                      checked={selectedLanguage === language.id}
                      onChange={(e) => handleLanguageChange(parseInt(e.target.value))}
                      disabled={languageLoading}
                    />
                    <div className="language-info">
                      {language.flag && (
                        language.flag.startsWith('/') || language.flag.startsWith('http') ? (
                          <img 
                            src={language.flag} 
                            alt={language.name}
                            className="language-flag"
                            onError={(e) => {e.target.style.display = 'none';}}
                          />
                        ) : (
                          <span className="language-flag-emoji">{language.flag}</span>
                        )
                      )}
                      <div className="language-names">
                        <span className="language-native">{language.nativeName}</span>
                        <span className="language-english">({language.name})</span>
                        {language.isOriginal && <span className="original-badge">Original</span>}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {languageLoading && (
                <div className="language-loading">Loading translation...</div>
              )}
            </div>
          )}

          {/* Quiz Title */}
          <div className="quiz-header-section">
            <h1>{quiz.title}</h1>
            {quiz.description && <p className="quiz-description">{quiz.description}</p>}
          </div>

          {retakeInfo && !retakeInfo.canRetake && (
            <div className="retake-info alert alert-warning">
              <h4>⏰ Retake Restriction</h4>
              <p>{retakeInfo.message}</p>
              {retakeInfo.retakeAvailableAt && (
                <p>
                  <strong>Retake available:</strong> {new Date(retakeInfo.retakeAvailableAt).toLocaleString()}
                </p>
              )}
              {retakeInfo.cooldownHours && (
                <p>
                  <small>Cooldown period: {retakeInfo.cooldownHours} hour(s)</small>
                </p>
              )}
            </div>
          )}

          {/* Start Button */}
          <button 
            onClick={startQuiz} 
            className="btn btn-success btn-lg"
            disabled={languageLoading || (retakeInfo && !retakeInfo.canRetake) || selectedLanguage === null}
          >
            {languageLoading ? 'Loading...' : (selectedLanguage && availableLanguages.find(l => l.id === selectedLanguage)?.code === 'ar' ? 'ابدأ الاختبار' : 'Start Quiz')}
          </button>
        </div>
      </div>
    );
  }

  // Quiz taking screen
  const currentQ = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div className="quiz-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <span className="progress-text">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </span>
        </div>
        
        <div className="quiz-timers">
          <div className="timer">
            <span className="timer-label">Quiz Time:</span>
            <span className={`timer-value ${quizTimeLeft < 300 ? 'warning' : ''}`}>
              {formatTime(quizTimeLeft)}
            </span>
          </div>
          <div className="timer">
            <span className="timer-label">Question Time:</span>
            {lockedQuestions.has(currentQuestion) ? (
              <span className="timer-value locked">🔒 LOCKED</span>
            ) : (
              <span className={`timer-value ${questionTimeLeft < 10 ? 'danger' : ''}`}>
                {formatTime(questionTimeLeft)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="quiz-content">
        <div className="question-container">
          <div className="question-header">
            <h2 className="question-text">{currentQ.question}</h2>
            <div className="question-meta">
              <span className="question-points">{currentQ.points} points</span>
              <span className="question-type">{currentQ.type.replace('-', ' ')}</span>
            </div>
          </div>

          {renderQuestion(currentQ, currentQuestion)}
        </div>

        <div className="quiz-navigation">
          <button
            onClick={prevQuestion}
            disabled={currentQuestion === 0}
            className="btn btn-secondary"
          >
            ← Previous
          </button>

          <div className="question-indicators">
            {quiz.questions.map((_, index) => {
              const currentQ = quiz.questions[index];
              const questionId = currentQ ? currentQ.id : index.toString();
              const hasAnswer = answers[questionId];
              
              return (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`question-indicator ${
                    index === currentQuestion ? 'current' : ''
                  } ${hasAnswer ? 'answered' : ''} ${
                    lockedQuestions.has(index) ? 'locked' : ''
                  }`}
                  title={
                    lockedQuestions.has(index) 
                      ? (hasAnswer ? 'Locked with answer' : 'Locked without answer')
                      : (hasAnswer ? 'Answered (can still change)' : 'Not answered')
                  }
                >
                  {index + 1}
                  {lockedQuestions.has(index) && <span className="lock-icon">🔒</span>}
                </button>
              );
            })}
          </div>

          {currentQuestion === quiz.questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn btn-success"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="btn btn-primary"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentQuiz;