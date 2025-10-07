import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/student/Dashboard';
import StudentCourses from './pages/student/Courses';
import StudentCourse from './pages/student/Course';
import StudentQuiz from './pages/student/Quiz';
import StudentResults from './pages/student/Results';
import StudentProfile from './pages/student/Profile';

import {
  AdminDashboard,
  AdminCourses,
  AdminCourseForm,
  AdminQuizzes,
  AdminQuizForm,
  AdminUsers,
  AdminUserForm,
  AdminResults,
  AdminLanguages,
  AdminQuizTranslations,
  AdminTranslationsOverview
} from './pages/admin';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* Student routes */}
            <Route path="student">
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="courses" element={<StudentCourses />} />
              <Route path="courses/:id" element={<StudentCourse />} />
              <Route path="quiz/:id" element={<StudentQuiz />} />
              <Route path="results" element={<StudentResults />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>
            
            {/* Admin routes */}
            <Route path="admin">
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="courses" element={<AdminCourses />} />
              <Route path="courses/new" element={<AdminCourseForm />} />
              <Route path="courses/edit/:id" element={<AdminCourseForm />} />
              <Route path="quizzes" element={<AdminQuizzes />} />
              <Route path="quizzes/new" element={<AdminQuizForm />} />
              <Route path="quizzes/edit/:id" element={<AdminQuizForm />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="users/new" element={<AdminUserForm />} />
              <Route path="users/edit/:id" element={<AdminUserForm />} />
              <Route path="results" element={<AdminResults />} />
              <Route path="languages" element={<AdminLanguages />} />
              <Route path="translations" element={<AdminTranslationsOverview />} />
              <Route path="translations/quiz/:quizId" element={<AdminQuizTranslations />} />
            </Route>
            
            {/* Default redirect based on user role */}
            <Route index element={<Navigate to="/student/dashboard" replace />} />
          </Route>
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;