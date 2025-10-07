import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import translationService from '../../services/translationService';
import languageService from '../../services/languageService';
import quizService from '../../services/quizService';
import './AdminComponents.css';

const AdminQuizTranslations = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    questions: []
  });

  useEffect(() => {
    if (quizId) {
      fetchData();
    }
  }, [quizId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch quiz details, languages, and existing translations
      const [quizResponse, languagesResponse, translationsResponse] = await Promise.all([
        quizService.getQuiz(quizId),
        languageService.getLanguages(true),
        translationService.getQuizTranslations(quizId)
      ]);

      setQuiz(quizResponse.quiz);
      setLanguages(languagesResponse.languages);
      setTranslations(translationsResponse.translations);
      
      // Initialize form with original quiz data
      if (quizResponse.quiz) {
        setFormData({
          title: quizResponse.quiz.title,
          description: quizResponse.quiz.description || '',
          questions: quizResponse.quiz.questions || []
        });
      }
    } catch (error) {
      setError(error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTranslation = (languageId) => {
    const language = languages.find(l => l.id === parseInt(languageId));
    if (!language) return;

    setEditingTranslation(null);
    setSelectedLanguage(languageId);
    setFormData({
      title: quiz.title,
      description: quiz.description || '',
      questions: quiz.questions?.map(q => {
        let processedQuestion = {
          ...q,
          question: '',
          explanation: q.explanation ? '' : undefined
        };

        // Handle options based on question type
        if (q.type === 'true-false') {
          // For true/false questions, ensure we have proper true/false options
          processedQuestion.options = [
            { text: '', isCorrect: q.correctAnswer === 0 },
            { text: '', isCorrect: q.correctAnswer === 1 }
          ];
        } else if (q.options && Array.isArray(q.options)) {
          // For other question types, process options normally
          if (typeof q.options[0] === 'string') {
            // If options are strings, convert to objects
            processedQuestion.options = q.options.map((opt, index) => ({
              text: '',
              isCorrect: q.correctAnswer === index
            }));
          } else {
            // If options are already objects, just clear the text
            processedQuestion.options = q.options.map(opt => ({
              ...opt,
              text: ''
            }));
          }
        }

        return processedQuestion;
      }) || []
    });
    setShowForm(true);
  };

  const handleEditTranslation = (translation) => {
    setEditingTranslation(translation);
    setSelectedLanguage(translation.languageId.toString());
    setFormData({
      title: translation.title,
      description: translation.description || '',
      questions: translation.questions || []
    });
    setShowForm(true);
  };

  const handleDeleteTranslation = async (id) => {
    if (window.confirm('Are you sure you want to delete this translation?')) {
      try {
        await translationService.deleteTranslation(id);
        fetchData();
        setError('');
      } catch (error) {
        setError(error.message || 'Failed to delete translation');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const translationData = {
        quizId: parseInt(quizId),
        languageId: parseInt(selectedLanguage),
        title: formData.title,
        description: formData.description,
        questions: formData.questions
      };

      if (editingTranslation) {
        await translationService.updateTranslation(editingTranslation.id, translationData);
      } else {
        await translationService.saveTranslation(translationData);
      }

      fetchData();
      resetForm();
      setError('');
    } catch (error) {
      setError(error.message || 'Failed to save translation');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      questions: []
    });
    setSelectedLanguage('');
    setEditingTranslation(null);
    setShowForm(false);
  };

  const updateQuestion = (index, field, value) => {
    const newQuestions = [...formData.questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setFormData({ ...formData, questions: newQuestions });
  };

  const updateQuestionOption = (questionIndex, optionIndex, field, value) => {
    const newQuestions = [...formData.questions];
    if (!newQuestions[questionIndex].options) {
      newQuestions[questionIndex].options = [];
    }
    newQuestions[questionIndex].options[optionIndex] = {
      ...newQuestions[questionIndex].options[optionIndex],
      [field]: value
    };
    setFormData({ ...formData, questions: newQuestions });
  };

  const getAvailableLanguages = () => {
    const translatedLanguageIds = translations.map(t => t.language.id);
    return languages.filter(lang => !translatedLanguageIds.includes(lang.id));
  };

  if (loading) {
    return <div className="loading">Loading quiz translations...</div>;
  }

  if (!quiz) {
    return <div className="error">Quiz not found</div>;
  }

  return (
    <div className="admin-quiz-translations">
      <div className="admin-header">
        <div>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/admin/quizzes')}
          >
            ← Back to Quizzes
          </button>
          <h2>Translations for "{quiz.title}"</h2>
        </div>
        <div className="header-actions">
          <select
            value=""
            onChange={(e) => e.target.value && handleCreateTranslation(e.target.value)}
            className="language-select"
          >
            <option value="">Add Translation...</option>
            {getAvailableLanguages().map(lang => (
              <option key={lang.id} value={lang.id}>
                {lang.name} ({lang.nativeName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <h3>
                {editingTranslation ? 'Edit Translation' : 'Create Translation'} - {' '}
                {languages.find(l => l.id === parseInt(selectedLanguage))?.nativeName}
              </h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="form translation-form">
              <div className="form-group">
                <label htmlFor="title">Quiz Title *</label>
                <div className="translation-field-group">
                  <div className="original-text">
                    <span className="label">Original:</span>
                    <div className="original-content">{quiz.title}</div>
                  </div>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Enter translated title..."
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Quiz Description</label>
                <div className="translation-field-group">
                  <div className="original-text">
                    <span className="label">Original:</span>
                    <div className="original-content">{quiz.description || 'No description'}</div>
                  </div>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Enter translated description..."
                    rows="3"
                  />
                </div>
              </div>

              <div className="questions-section">
                <h4>Questions</h4>
                {formData.questions.map((question, qIndex) => (
                  <div key={qIndex} className="question-translation-item">
                    <div className="question-header">
                      <h5>Question {qIndex + 1} ({question.type})</h5>
                      <span className="points-badge">{question.points} points</span>
                    </div>

                    <div className="form-group">
                      <label>Question Text *</label>
                      <div className="translation-field-group">
                        <div className="original-text">
                          <span className="label">Original:</span>
                          <div className="original-content">{quiz.questions[qIndex]?.question || 'No question text'}</div>
                        </div>
                        <textarea
                          value={question.question || ''}
                          onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                          required
                          rows="2"
                          placeholder="Enter translated question text..."
                        />
                      </div>
                    </div>

                    {question.options && question.options.length > 0 && (
                      <div className="options-translation">
                        <label>Answer Options</label>
                        {question.type === 'true-false' ? (
                          // Special rendering for true/false questions
                          <div className="true-false-options">
                            <div className="option-item">
                              <div className="translation-field-group">
                                <div className="original-text">
                                  <span className="label">Original True:</span>
                                  <div className="original-content">True</div>
                                </div>
                                <div className="translation-input-wrapper">
                                  <label>True:</label>
                                  <input
                                    type="text"
                                    value={question.options[0]?.text || ''}
                                    onChange={(e) => updateQuestionOption(qIndex, 0, 'text', e.target.value)}
                                    placeholder="Translate 'True'"
                                    className={question.options[0]?.isCorrect ? 'correct-option' : ''}
                                  />
                                  {question.options[0]?.isCorrect && <span className="correct-indicator">✓ Correct Answer</span>}
                                </div>
                              </div>
                            </div>
                            <div className="option-item">
                              <div className="translation-field-group">
                                <div className="original-text">
                                  <span className="label">Original False:</span>
                                  <div className="original-content">False</div>
                                </div>
                                <div className="translation-input-wrapper">
                                  <label>False:</label>
                                  <input
                                    type="text"
                                    value={question.options[1]?.text || ''}
                                    onChange={(e) => updateQuestionOption(qIndex, 1, 'text', e.target.value)}
                                    placeholder="Translate 'False'"
                                    className={question.options[1]?.isCorrect ? 'correct-option' : ''}
                                  />
                                  {question.options[1]?.isCorrect && <span className="correct-indicator">✓ Correct Answer</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Normal rendering for multiple choice and dropdown questions
                          question.options.map((option, oIndex) => {
                            const originalOption = quiz.questions[qIndex]?.options?.[oIndex];
                            const originalText = typeof originalOption === 'string' 
                              ? originalOption 
                              : originalOption?.text || `Option ${oIndex + 1}`;
                            
                            return (
                              <div key={oIndex} className="option-item">
                                <div className="translation-field-group">
                                  <div className="original-text">
                                    <span className="label">Original Option {oIndex + 1}:</span>
                                    <div className="original-content">{originalText}</div>
                                  </div>
                                  <input
                                    type="text"
                                    value={option.text || ''}
                                    onChange={(e) => updateQuestionOption(qIndex, oIndex, 'text', e.target.value)}
                                    placeholder={`Translate option ${oIndex + 1}${option.isCorrect ? ' (Correct)' : ''}`}
                                    className={option.isCorrect ? 'correct-option' : ''}
                                  />
                                  {option.isCorrect && <span className="correct-indicator">✓</span>}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}

                    {question.explanation && (
                      <div className="form-group">
                        <label>Explanation</label>
                        <div className="translation-field-group">
                          <div className="original-text">
                            <span className="label">Original:</span>
                            <div className="original-content">{quiz.questions[qIndex]?.explanation || 'No explanation'}</div>
                          </div>
                          <textarea
                            value={question.explanation || ''}
                            onChange={(e) => updateQuestion(qIndex, 'explanation', e.target.value)}
                            rows="2"
                            placeholder="Enter translated explanation..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTranslation ? 'Update Translation' : 'Create Translation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="translations-grid">
        {translations.map((translation) => (
          <div key={translation.id} className="translation-card">
            <div className="translation-header">
              <div className="language-info">
                {translation.language.flag && (
                  translation.language.flag.startsWith('/') || translation.language.flag.startsWith('http') ? (
                    <img 
                      src={translation.language.flag} 
                      alt={`${translation.language.name} flag`} 
                      className="flag-icon"
                      onError={(e) => {e.target.style.display = 'none';}}
                    />
                  ) : (
                    <span className="flag-emoji">{translation.language.flag}</span>
                  )
                )}
                <div>
                  <h3>{translation.language.name}</h3>
                  <p className="native-name">{translation.language.nativeName}</p>
                </div>
              </div>
              <div className="translation-actions">
                <button
                  className="btn btn-small btn-primary"
                  onClick={() => handleEditTranslation(translation)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-small btn-danger"
                  onClick={() => handleDeleteTranslation(translation.id)}
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div className="translation-content">
              <h4>{translation.title}</h4>
              {translation.description && (
                <p className="description">{translation.description}</p>
              )}
              <div className="translation-stats">
                <span>{translation.questions?.length || 0} questions translated</span>
                <span>By {translation.creator?.name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {translations.length === 0 && (
        <div className="empty-state">
          <p>No translations available for this quiz.</p>
          {getAvailableLanguages().length > 0 ? (
            <p>Select a language from the dropdown above to create the first translation.</p>
          ) : (
            <p>All available languages have been translated. Add more languages to create additional translations.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminQuizTranslations;