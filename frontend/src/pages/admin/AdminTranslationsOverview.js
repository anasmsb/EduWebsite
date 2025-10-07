import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import translationService from '../../services/translationService';
import languageService from '../../services/languageService';
import quizService from '../../services/quizService';
import './AdminComponents.css';

const AdminTranslationsOverview = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [translationMatrix, setTranslationMatrix] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all quizzes and languages
      const [quizzesResponse, languagesResponse] = await Promise.all([
        quizService.getAllQuizzes(),
        languageService.getLanguages(true)
      ]);

      setQuizzes(quizzesResponse.quizzes || []);
      setLanguages(languagesResponse.languages || []);

      // Build translation matrix
      const matrix = {};
      for (const quiz of quizzesResponse.quizzes || []) {
        try {
          const translationsResponse = await translationService.getQuizTranslations(quiz.id);
          matrix[quiz.id] = {};
          
          // Initialize all languages as not translated
          for (const lang of languagesResponse.languages || []) {
            matrix[quiz.id][lang.id] = null;
          }
          
          // Mark translated languages
          for (const translation of translationsResponse.translations || []) {
            matrix[quiz.id][translation.language.id] = translation;
          }
        } catch (error) {
          console.error(`Failed to fetch translations for quiz ${quiz.id}:`, error);
          matrix[quiz.id] = {};
        }
      }
      
      setTranslationMatrix(matrix);
    } catch (error) {
      setError(error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const getTranslationStatus = (quizId, languageId) => {
    return translationMatrix[quizId]?.[languageId];
  };

  const getQuizTranslationProgress = (quizId) => {
    const translations = translationMatrix[quizId] || {};
    const translatedCount = Object.values(translations).filter(t => t !== null).length;
    const totalLanguages = languages.length;
    
    if (totalLanguages === 0) return 0;
    return Math.round((translatedCount / totalLanguages) * 100);
  };

  const getTotalTranslationProgress = () => {
    if (quizzes.length === 0 || languages.length === 0) return 0;
    
    const totalPossible = quizzes.length * languages.length;
    let totalTranslated = 0;
    
    for (const quiz of quizzes) {
      totalTranslated += Object.values(translationMatrix[quiz.id] || {}).filter(t => t !== null).length;
    }
    
    return Math.round((totalTranslated / totalPossible) * 100);
  };

  const handleCellClick = (quiz, language) => {
    navigate(`/admin/translations/quiz/${quiz.id}`);
  };

  if (loading) {
    return <div className="loading">Loading translation overview...</div>;
  }

  return (
    <div className="admin-translations-overview">
      <div className="admin-header">
        <h2>Quiz Translations Overview</h2>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-number">{quizzes.length}</span>
            <span className="stat-label">Quizzes</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{languages.length}</span>
            <span className="stat-label">Languages</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">{getTotalTranslationProgress()}%</span>
            <span className="stat-label">Translated</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {quizzes.length === 0 ? (
        <div className="empty-state">
          <p>No quizzes found. Create some quizzes first before managing translations.</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/admin/quizzes')}
          >
            Manage Quizzes
          </button>
        </div>
      ) : languages.length === 0 ? (
        <div className="empty-state">
          <p>No languages configured. Add language packs first before creating translations.</p>
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/admin/languages')}
          >
            Manage Languages
          </button>
        </div>
      ) : (
        <div className="translation-matrix">
          <div className="matrix-container">
            <table className="translation-table">
              <thead>
                <tr>
                  <th className="quiz-column">Quiz</th>
                  {languages.map(lang => (
                    <th key={lang.id} className="language-column">
                      <div className="language-header">
                        {lang.flag && (
                          lang.flag.startsWith('/') || lang.flag.startsWith('http') ? (
                            <img 
                              src={lang.flag} 
                              alt={`${lang.name} flag`}
                              className="flag-icon-small"
                              onError={(e) => {e.target.style.display = 'none';}}
                            />
                          ) : (
                            <span className="flag-emoji-small">{lang.flag}</span>
                          )
                        )}
                        <span className="language-code">{lang.code}</span>
                      </div>
                      <div className="language-name">{lang.name}</div>
                    </th>
                  ))}
                  <th className="progress-column">Progress</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map(quiz => (
                  <tr key={quiz.id}>
                    <td className="quiz-info">
                      <div className="quiz-title">{quiz.title}</div>
                      <div className="quiz-meta">
                        {quiz.course?.title} • {quiz.questions?.length || 0} questions
                      </div>
                    </td>
                    {languages.map(lang => {
                      const translation = getTranslationStatus(quiz.id, lang.id);
                      return (
                        <td 
                          key={lang.id}
                          className={`translation-cell ${translation ? 'translated' : 'not-translated'}`}
                          onClick={() => handleCellClick(quiz, lang)}
                          title={translation 
                            ? `Translated by ${translation.creator?.name}` 
                            : `Click to translate to ${lang.name}`
                          }
                        >
                          {translation ? (
                            <div className="translation-status">
                              <span className="status-icon">✓</span>
                              <span className="status-text">Done</span>
                            </div>
                          ) : (
                            <div className="translation-status">
                              <span className="status-icon">○</span>
                              <span className="status-text">Pending</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="progress-cell">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${getQuizTranslationProgress(quiz.id)}%` }}
                        />
                      </div>
                      <span className="progress-text">
                        {getQuizTranslationProgress(quiz.id)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/admin/languages')}
          >
            Manage Languages
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/admin/quizzes')}
          >
            Manage Quizzes
          </button>
        </div>
      </div>

      <div className="legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="legend-icon translated">✓</span>
            <span>Translated</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon not-translated">○</span>
            <span>Not Translated</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTranslationsOverview;