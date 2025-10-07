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

const resultService = {
  getMyResults: async () => {
    const response = await api.get('/results/my-results');
    return response.data.results || [];
  },

  getResult: async (id) => {
    const response = await api.get(`/results/${id}`);
    return response.data;
  },

  getAllResults: async (params = {}) => {
    const response = await api.get('/results', { params });
    return response.data;
  },

  getResultsSummary: async () => {
    const response = await api.get('/results/admin/summary');
    return response.data;
  },

  getStudentPerformance: async (studentId) => {
    const response = await api.get(`/results/student/${studentId}`);
    return response.data;
  },

  deleteResult: async (id) => {
    const response = await api.delete(`/results/${id}`);
    return response.data;
  },

  getDetailedResult: async (id) => {
    const response = await api.get(`/results/admin/details/${id}`);
    return response.data;
  },

  getQuestionAnalytics: async (quizId) => {
    const response = await api.get(`/results/admin/question-analytics/${quizId}`);
    return response.data;
  },
};

export default resultService;