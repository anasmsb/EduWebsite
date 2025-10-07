import React, { useState, useEffect } from 'react';
import languageService from '../../services/languageService';
import './AdminComponents.css';

const AdminLanguages = () => {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    nativeName: '',
    direction: 'ltr',
    flag: '',
    isActive: true,
    isDefault: false
  });

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      const response = await languageService.getLanguages(false); // Get all languages, not just active
      setLanguages(response.languages);
    } catch (error) {
      setError(error.message || 'Failed to fetch languages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLanguage) {
        await languageService.updateLanguage(editingLanguage.id, formData);
      } else {
        await languageService.createLanguage(formData);
      }
      
      fetchLanguages();
      resetForm();
      setError('');
    } catch (error) {
      setError(error.message || 'Failed to save language');
    }
  };

  const handleEdit = (language) => {
    setEditingLanguage(language);
    setFormData({
      name: language.name,
      code: language.code,
      nativeName: language.nativeName,
      direction: language.direction,
      flag: language.flag || '',
      isActive: language.isActive,
      isDefault: language.isDefault
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this language? This action cannot be undone.')) {
      try {
        await languageService.deleteLanguage(id);
        fetchLanguages();
        setError('');
      } catch (error) {
        setError(error.message || 'Failed to delete language');
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await languageService.setDefaultLanguage(id);
      fetchLanguages();
      setError('');
    } catch (error) {
      setError(error.message || 'Failed to set default language');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      nativeName: '',
      direction: 'ltr',
      flag: '',
      isActive: true,
      isDefault: false
    });
    setEditingLanguage(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading">Loading languages...</div>;
  }

  return (
    <div className="admin-languages">
      <div className="admin-header">
        <h2>Language Packs</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          Add New Language
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingLanguage ? 'Edit Language' : 'Add New Language'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">English Name *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="e.g., Spanish"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="code">Language Code *</label>
                  <input
                    type="text"
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toLowerCase()})}
                    required
                    placeholder="e.g., es"
                    maxLength="10"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="nativeName">Native Name *</label>
                  <input
                    type="text"
                    id="nativeName"
                    value={formData.nativeName}
                    onChange={(e) => setFormData({...formData, nativeName: e.target.value})}
                    required
                    placeholder="e.g., Español"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="direction">Text Direction</label>
                  <select
                    id="direction"
                    value={formData.direction}
                    onChange={(e) => setFormData({...formData, direction: e.target.value})}
                  >
                    <option value="ltr">Left to Right (LTR)</option>
                    <option value="rtl">Right to Left (RTL)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="flag">Flag (Emoji or Image URL)</label>
                <input
                  type="text"
                  id="flag"
                  value={formData.flag}
                  onChange={(e) => setFormData({...formData, flag: e.target.value})}
                  placeholder="e.g., 🇺🇸 or /flags/us.png"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    />
                    Active
                  </label>
                </div>

                {!editingLanguage?.isDefault && (
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
                      />
                      Set as Default Language
                    </label>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingLanguage ? 'Update Language' : 'Create Language'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Flag</th>
              <th>Name</th>
              <th>Code</th>
              <th>Native Name</th>
              <th>Direction</th>
              <th>Status</th>
              <th>Default</th>
              <th>Created By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {languages.map((language) => (
              <tr key={language.id}>
                <td>
                  {language.flag ? (
                    language.flag.startsWith('/') || language.flag.startsWith('http') ? (
                      <img 
                        src={language.flag} 
                        alt={`${language.name} flag`}
                        className="flag-icon"
                        onError={(e) => {e.target.style.display = 'none'}}
                      />
                    ) : (
                      <span className="flag-emoji">{language.flag}</span>
                    )
                  ) : (
                    <span className="no-flag">🏳️</span>
                  )}
                </td>
                <td>{language.name}</td>
                <td>
                  <code className="language-code">{language.code}</code>
                </td>
                <td className={`native-name ${language.direction}`}>
                  {language.nativeName}
                </td>
                <td>
                  <span className={`direction-badge ${language.direction}`}>
                    {language.direction.toUpperCase()}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${language.isActive ? 'active' : 'inactive'}`}>
                    {language.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  {language.isDefault ? (
                    <span className="default-badge">Default</span>
                  ) : (
                    <button
                      className="btn btn-small btn-secondary"
                      onClick={() => handleSetDefault(language.id)}
                      title="Set as default language"
                    >
                      Set Default
                    </button>
                  )}
                </td>
                <td>{language.creator?.name || 'Unknown'}</td>
                <td className="actions">
                  <button
                    className="btn btn-small btn-primary"
                    onClick={() => handleEdit(language)}
                  >
                    Edit
                  </button>
                  {!language.isDefault && (
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(language.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {languages.length === 0 && (
        <div className="empty-state">
          <p>No languages configured yet.</p>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            Add First Language
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminLanguages;