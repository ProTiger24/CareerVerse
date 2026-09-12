import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: '📊 Dashboard' },
    { path: '/tasks', label: '✅ Tasks' },
    { path: '/routine', label: '📅 Routine' },
    { path: '/analytics', label: '📈 Analytics' },
    { path: '/ai', label: '🤖 AI' },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-xl shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <span className="text-2xl">🚀</span>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CareerVerse
            </span>
          </Link>

          {user ? (
            <>
              <div className="hidden md:flex items-center space-x-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-sm transition-colors ${
                      location.pathname === link.path
                        ? 'text-blue-600 font-semibold'
                        : 'text-gray-600 hover:text-blue-600'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="h-6 w-px bg-gray-200"></div>
                <span className="text-sm text-gray-700">
                  👋 {user.displayName || user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all text-sm"
                >
                  Logout
                </button>
              </div>

              <button
                className="md:hidden text-gray-600"
                onClick={() => setIsOpen(!isOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </>
          ) : (
            <Link to="/login" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all">
              Login
            </Link>
          )}
        </div>

        {isOpen && user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden pb-4 border-t border-gray-100 pt-4 space-y-2"
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`block py-2 text-sm transition-colors ${
                  location.pathname === link.path
                    ? 'text-blue-600 font-semibold'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl transition-all text-sm"
            >
              Logout
            </button>
          </motion.div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
