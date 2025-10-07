import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <header className="header">
      <h1>Education Portal</h1>
      <div className="header-right">
        <div className="user-info">
          <div className="user-avatar">
            {getInitials(user?.firstName, user?.lastName)}
          </div>
          <span>{user?.firstName} {user?.lastName}</span>
          <span className="user-role">({user?.role})</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;