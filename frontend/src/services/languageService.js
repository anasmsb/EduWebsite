import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const languageService = {
  // Get all languages
  getLanguages: async (activeOnly = true) => {
    try {
      const response = await axios.get(`${API_URL}/languages`, {
        params: { active: activeOnly },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch languages' };
    }
  },

  // Get language by ID
  getLanguage: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/languages/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to fetch language' };
    }
  },

  // Create new language (admin only)
  createLanguage: async (languageData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/languages`, languageData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create language' };
    }
  },

  // Update language (admin only)
  updateLanguage: async (id, languageData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/languages/${id}`, languageData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update language' };
    }
  },

  // Delete language (admin only)
  deleteLanguage: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/languages/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete language' };
    }
  },

  // Set default language (admin only)
  setDefaultLanguage: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API_URL}/languages/${id}/set-default`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to set default language' };
    }
  }
};

export default languageService;