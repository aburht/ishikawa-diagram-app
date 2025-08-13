import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CreateDiagram: React.FC = () => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();

  const handleCreate = () => {
    if (!isAuthenticated || !user) {
      setError('You must be logged in to create a diagram.');
      navigate('/login');
      return;
    }

    if (!name.trim()) {
      setError('Diagram name is required.');
      return;
    }

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    axios
      .post('http://localhost:3001/api/diagrams', {
        name: name.trim(),
        creator: user.email, // Use logged-in user's email
        effectLabel: 'Effect',
        effectInfo: '',
        roots: [],
      }, { headers })
      .then(res => navigate(`/interactive/${res.data.id}`))
      .catch(err => {
        console.error('Creation failed:', err);
        setError('Failed to create diagram. Try again.');
      });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-lg mx-auto">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create New Diagram
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Diagram Name</label>
            <input
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              placeholder="Enter diagram name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Creator</label>
            <div className="p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
              {user?.name || user?.email} (You)
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Diagram
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full mt-3 bg-gray-500 text-white p-3 rounded-lg hover:bg-gray-600 transition-all duration-300 font-medium"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateDiagram;