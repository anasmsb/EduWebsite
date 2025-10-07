import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const quizService = {
  getAllQuizzes: async () => {
    const response = await api.get('/quizzes');
    return response.data;
  },

  getQuiz: async (id) => {
    const response = await api.get(`/quizzes/${id}`);
    return response.data;
  },

  getQuizForTaking: async (id) => {
    const response = await api.get(`/quizzes/${id}/take`);
    return response.data;
  },

  createQuiz: async (quizData) => {
    const response = await api.post('/quizzes', quizData);
    return response.data;
  },

  updateQuiz: async (id, quizData) => {
    const response = await api.put(`/quizzes/${id}`, quizData);
    return response.data;
  },

  deleteQuiz: async (id) => {
    const response = await api.delete(`/quizzes/${id}`);
    return response.data;
  },

  submitQuiz: async (id, submissionData) => {
    const response = await api.post(`/quizzes/${id}/submit`, submissionData);
    return response.data;
  },

  // Session-based quiz methods
  startQuizSession: async (id) => {
    const response = await api.post(`/quizzes/${id}/session/start`);
    return response.data;
  },

  updateQuizSession: async (id, sessionData) => {
    const response = await api.put(`/quizzes/${id}/session/update`, sessionData);
    return response.data;
  },

  completeQuizSession: async (id, sessionData) => {
    const response = await api.post(`/quizzes/${id}/session/complete`, sessionData);
    return response.data;
  },

  // Check retake eligibility
  checkRetakeEligibility: async (id) => {
    try {
      const response = await api.post(`/quizzes/${id}/session/start`);
      return { canRetake: true, ...response.data };
    } catch (error) {
      if (error.response && error.response.status === 403) {
        return { 
          canRetake: false, 
          message: error.response.data.message,
          retakeAvailableAt: error.response.data.retakeAvailableAt,
          cooldownHours: error.response.data.cooldownHours
        };
      }
      throw error;
    }
  }
};

export default quizService;