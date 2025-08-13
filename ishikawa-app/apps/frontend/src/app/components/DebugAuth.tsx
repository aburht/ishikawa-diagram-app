import React from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const DebugAuth: React.FC = () => {
  const { user, token, isAuthenticated, loading } = useAuth();

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-sm">
      <h4 className="font-bold mb-2">Auth Debug</h4>
      <div>Loading: {loading ? 'Yes' : 'No'}</div>
      <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
      <div>Token: {token ? `${token.substring(0, 20)}...` : 'None'}</div>
      <div>User: {user ? user.name : 'None'}</div>
      <div>Axios Header: {axios.defaults.headers.common['Authorization'] || 'None'}</div>
    </div>
  );
};

export default DebugAuth;
