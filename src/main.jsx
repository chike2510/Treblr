import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const root = document.getElementById('root');
if (root) ReactDOM.createRoot(root).render(<ErrorBoundary><App /></ErrorBoundary>);
