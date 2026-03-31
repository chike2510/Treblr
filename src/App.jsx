import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useStore from './store/gameStore';
import AuthPage from './pages/AuthPage';
import GamePage from './pages/GamePage';
import Toast from './components/ui/Toast';

export default function App() {
  const { token, user, loadState, isLoading } = useStore();

  useEffect(() => { if (token && !user) loadState(); }, [token]);

  if (token && isLoading) return (
    <div className="min-h-screen bg-t-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-bounce">🎵</div>
        <p className="text-t-muted font-mono text-sm tracking-widest">LOADING TREBLR</p>
      </div>
    </div>
  );

  return (
    <>
      <Routes>
        <Route path="/login"    element={!token ? <AuthPage mode="login" />    : <Navigate to="/" />} />
        <Route path="/register" element={!token ? <AuthPage mode="register" /> : <Navigate to="/" />} />
        <Route path="/*"        element={token  ? <GamePage />                 : <Navigate to="/login" />} />
      </Routes>
      <Toast />
    </>
  );
}
