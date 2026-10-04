import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './rebuild/styles.css';

const root = document.getElementById('root');
if (root) ReactDOM.createRoot(root).render(<ErrorBoundary><App /></ErrorBoundary>);
