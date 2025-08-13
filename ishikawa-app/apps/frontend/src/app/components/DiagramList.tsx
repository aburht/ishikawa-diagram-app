// filepath: c:\Users\work\project\kla\ishikawa-app\apps\frontend\src\app\components\DiagramList.tsx
import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Diagram } from '../../../../backend/src/app/diagrams/diagram.interface';
import { motion, AnimatePresence } from 'framer-motion';
import './DiagramList.css';

const DiagramList: React.FC = () => {
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user, logout, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios
      .get<{ data: Diagram[], total: number, page: number, limit: number, totalPages: number }>('http://localhost:3001/api/diagrams', { headers })
      .then(res => {
        // Handle paginated response - diagrams are in res.data.data
        const diagrams = res.data.data || [];
        console.log('Raw API response:', res.data);
        console.log('Processed diagrams:', diagrams);
        console.log('Diagrams length:', diagrams.length);
        setDiagrams(diagrams);
      })
      .catch(err => {
        console.error('Failed to fetch diagrams:', err);
        setDiagrams([]); // Ensure we set an empty array on error
        if (err.response?.status === 401) {
          navigate('/login');
        }
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate, token]);

  const filteredDiagrams = useMemo(() => {
    // Ensure diagrams is always an array
    const diagramsArray = Array.isArray(diagrams) ? diagrams : [];

    if (!searchTerm.trim()) return diagramsArray;

    return diagramsArray.filter(diagram =>
      diagram.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      diagram.creator?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [diagrams, searchTerm]);

  const deleteDiagram = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent navigation when clicking delete

    if (window.confirm('Are you sure you want to delete this diagram?')) {
      try {
        await axios.delete(`http://localhost:3001/api/diagrams/${id}`);
        setDiagrams(diagrams.filter(diagram => diagram.id !== id));
      } catch (error) {
        console.error('Error deleting diagram:', error);
        alert('Failed to delete diagram. Please try again.');
      }
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-blue-500 border-t-blue-600 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <p className="text-xl font-semibold text-gray-700">Loading diagrams...</p>
        </motion.div>
      </div>
    );
  }

  // Debug: Log the current state before rendering
  console.log('About to render - diagrams:', diagrams, 'length:', diagrams.length, 'loading:', loading);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <motion.div
                className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, duration: 0.6, type: "spring" }}
              >
                <span className="text-white font-bold text-xl">KLA</span>
              </motion.div>
              <motion.h1
                className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                Ishikawa Diagrams
              </motion.h1>
            </div>

            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => navigate('/new')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 text-sm"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <span>+</span>
                <span>Create New Diagram</span>
              </motion.button>

              {/* User Menu */}
              <div className="bg-gray-100/70 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200/50">
                <span className="text-gray-700 text-sm font-medium">Welcome, {user?.name || user?.email}</span>
              </div>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <motion.div
        className="max-w-7xl mx-auto px-6 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="flex items-center justify-center">
          <div className="relative w-full max-w-lg">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Search diagrams by name or creator..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/90 backdrop-blur-sm placeholder-gray-500 text-gray-900 shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {searchTerm && (
          <p className="mt-3 text-center text-sm text-gray-600 font-medium">
            Found {filteredDiagrams.length} diagram{filteredDiagrams.length !== 1 ? 's' : ''}
          </p>
        )}
      </motion.div>

      {/* Diagrams Grid */}
      <motion.div
        className="max-w-7xl mx-auto px-6 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        {diagrams.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-6xl mb-6 animate-pulse">📊</div>
            <h3 className="text-2xl font-bold text-gray-700 mb-3">No diagrams yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start creating your first Ishikawa diagram using the "Create New Diagram" button in the header above.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Array.isArray(filteredDiagrams) ? filteredDiagrams : []).map((diagram, index) => (
                <motion.div
                  key={diagram.id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200/50 relative group cursor-pointer"
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 25
                  }}
                  onClick={() => navigate(`/edit/${diagram.id}`)}
                >
                  {/* Delete button */}
                  <motion.button
                    onClick={(e) => deleteDiagram(diagram.id, e)}
                    className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    ✕
                  </motion.button>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                          {diagram.name}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center">
                          <span className="mr-2">👤</span>
                          {diagram.creator}
                        </p>
                      </div>
                      {/* Status indicator */}
                      <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm" title="Available"></div>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <span className="text-yellow-400 mr-2">🎯</span>
                        <span className="text-sm font-semibold text-gray-700">Effect:</span>
                      </div>
                      <p className="text-gray-800 font-medium">{diagram.effectLabel}</p>
                      {diagram.effectInfo && (
                        <p className="text-gray-600 text-sm mt-1">{diagram.effectInfo}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center">
                        <span className="mr-1">🦴</span>
                        <span className="text-sm font-semibold text-gray-700">
                          {diagram.roots.length} main categories
                        </span>
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-3">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/svg/${diagram.id}`);
                        }}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title="View diagram in read-only mode"
                      >
                        👁️ View
                      </motion.button>
                      {/* Only show Edit button if current user is the creator */}
                      {(user?.email === diagram.creator || user?.name === diagram.creator) && (
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/interactive/${diagram.id}`);
                          }}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          title="Edit diagram - add categories, edit bones, and manage structure"
                        >
                          ✏️ Edit
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {/* Hover gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </motion.div>
    </div>
  );
};

export default DiagramList;