import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg">
              <span className="text-white font-bold text-sm">KLA</span>
            </div>
            <span className="text-white font-semibold text-lg">Ishikawa Diagrams</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/')
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Diagrams
            </Link>
            <Link
              to="/new"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/new')
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Create New
            </Link>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-3 text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden md:block text-sm font-medium">{user?.name}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl"
                >
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-sm font-medium text-white">{user?.name}</p>
                      <p className="text-xs text-slate-400">{user?.email}</p>
                    </div>

                    {/* Mobile Navigation Links */}
                    <div className="md:hidden">
                      <Link
                        to="/"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        📊 Diagrams
                      </Link>
                      <Link
                        to="/new"
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        ➕ Create New
                      </Link>
                      <div className="border-t border-white/10 mt-2 pt-2"></div>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
