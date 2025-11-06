import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-purple-600">
              <span className="text-3xl">💧</span> DropSpot
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            <Link
              to="/"
              className="text-gray-700 hover:text-purple-600 font-medium transition"
            >
              Drops
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/my-waitlist"
                  className="text-gray-700 hover:text-purple-600 font-medium transition"
                >
                  My Waitlist
                </Link>
                <Link
                  to="/my-claims"
                  className="text-gray-700 hover:text-purple-600 font-medium transition"
                >
                  My Claims
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="text-gray-700 hover:text-purple-600 font-medium transition"
              >
                Admin Panel
              </Link>
            )}

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {user?.email}
                  {isAdmin && (
                    <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium transition"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;