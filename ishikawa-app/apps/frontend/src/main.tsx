import React from 'react';
import ReactDOM from 'react-dom/client';

import './index.css';
import App from './app/app';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found. Please ensure #root exists in index.html');

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);