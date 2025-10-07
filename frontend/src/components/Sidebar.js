import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Redirect to appropriate dashboard based on role
    if (user?.role === 'admin' && window.location.pathname === '/') {
      navigate('/admin/dashboard');
    } else if (user?.role === 'student' && window.location.pathname === '/') {
      navigate('/student/dashboard');
    }
  }, [user, navigate]);

  const studentNavItems = [
    { path: '/student/dashboard', label: 'Dashboard' },
    { path: '/student/courses', label: 'Courses' },
    { path: '/student/results', label: 'My Results' },
    { path: '/student/profile', label: 'Profile' }
  ];

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/courses', label: 'Courses' },
    { path: '/admin/quizzes', label: 'Quizzes' },
    { path: '/admin/users', label: 'Users' },
    { path: '/admin/results', label: 'Results' },
    { path: '/admin/languages', label: 'Languages' },
    { path: '/admin/translations', label: 'Translations' }
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : studentNavItems;

  return (
    <aside className="sidebar">
      <nav>
        <ul className="nav-menu">
          {navItems.map((item) => (
            <li key={item.path} className="nav-item">
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;