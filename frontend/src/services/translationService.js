import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const translationService = {
  // Get translations for a specific quiz
  getQuizTranslations: async (quizId) => {
    try {
      const response = await axios.get(`${API_URL}/translations/quiz/${quizId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch quiz translations' };
    }
  },

  // Get all translations for a language
  getLanguageTranslations: async (languageId) => {
    try {
      const response = await axios.get(`${API_URL}/translations/language/${languageId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch language translations' };
    }
  },

  // Get specific translation
  getTranslation: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/translations/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch translation' };
    }
  },

  // Create or update translation (admin only)
  saveTranslation: async (translationData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/translations`, translationData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to save translation' };
    }
  },

  // Update translation (admin only)
  updateTranslation: async (id, translationData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/translations/${id}`, translationData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update translation' };
    }
  },

  // Delete translation (admin only)
  deleteTranslation: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/translations/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete translation' };
    }
  },

  // Get quiz with translation for taking
  getTranslatedQuiz: async (quizId, languageId) => {
    try {
      const response = await axios.get(`${API_URL}/translations/quiz/${quizId}/language/${languageId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch translated quiz' };
    }
  }
};

export default translationService;