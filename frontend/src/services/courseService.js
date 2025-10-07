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

const courseService = {
  getAllCourses: async () => {
    try {
      console.log('courseService: Making request to /api/courses');
      const response = await api.get('/courses');
      console.log('courseService: Response received:', response);
      console.log('courseService: Response data:', response.data);
      console.log('courseService: Response data type:', typeof response.data);
      console.log('courseService: Response data keys:', Object.keys(response.data || {}));
      if (response.data && response.data.courses) {
        console.log('courseService: Courses array:', response.data.courses);
        console.log('courseService: Courses count:', response.data.courses.length);
      }
      // Always return the backend response structure
      return response.data;
    } catch (error) {
      console.error('courseService: Error in getAllCourses:', error);
      throw error;
    }
  },

  getCourse: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  createCourse: async (courseData) => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  updateCourse: async (id, courseData) => {
    const response = await api.put(`/courses/${id}`, courseData);
    return response.data;
  },

  deleteCourse: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  enrollInCourse: async (id) => {
    const response = await api.post(`/courses/${id}/enroll`);
    return response.data;
  },

  getEnrolledCourses: async () => {
    const response = await api.get('/courses/student/enrolled');
    return response.data.courses || [];
  },

  uploadVideo: async (courseId, videoData) => {
    const formData = new FormData();
    formData.append('video', videoData.video);
    formData.append('title', videoData.title);
    formData.append('description', videoData.description || '');
    formData.append('duration', videoData.duration);
    formData.append('order', videoData.order);

    const response = await api.post(`/courses/${courseId}/videos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteVideo: async (courseId, videoIndex) => {
    const response = await api.delete(`/courses/${courseId}/videos/${videoIndex}`);
    return response.data;
  }
};

export default courseService;