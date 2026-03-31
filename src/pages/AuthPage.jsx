import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useStore from '../store/gameStore';

const GENRES = ['Pop','Hip-Hop','R&B','Rock','Electronic','Afrobeats','Latin','Country','Indie','Alternative'];

export default function AuthPage({ mode }) {
  const [form, setForm] = useState({ username:'', email:'', password:'', artistName:'', genre:'Afrobeats' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useStore();
  const nav = useNavigate();
  const isReg = mode === 'register';

  const upd = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      if (isReg) await register(form); else await login(form.email, form.password);
      nav('/');
    } catch (err) { setError(err.response?.data?.error || 'Something went wrong'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-t-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[300px] bg-purple-800/8 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="text-4xl">🎵</span>
            <h1 className="text-5xl font-display font-black tracking-tight bg-gradient-to-br from-violet-300 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Treblr
            </h1>
          </div>
          <p className="text-t-muted text-sm">Build your music empire, one week at a time.</p>
        </div>

        <div className="card p-7 slide-up">
          <h2 className="text-lg font-display font-bold text-t-text mb-6">
            {isReg ? '🎤 Create your artist' : '👋 Welcome back'}
          </h2>

          {error && (
            <div className="bg-red-950/50 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {isReg && (
              <Field label="Stage Name" value={form.artistName} onChange={upd('artistName')} placeholder="Your artist name" required />
            )}
            {isReg && (
              <Field label="Username" value={form.username} onChange={upd('username')} placeholder="@username" required />
            )}
            <Field label="Email" type="email" value={form.email} onChange={upd('email')} placeholder="you@example.com" required />
            <Field label="Password" type="password" value={form.password} onChange={upd('password')} placeholder="••••••••" required />
            {isReg && (
              <div>
                <label className="label block mb-1.5">Primary Genre</label>
                <select
                  className="w-full bg-t-surface border border-t-border rounded-xl px-4 py-2.5 text-t-text focus:outline-none focus:border-t-accent transition-colors"
                  value={form.genre} onChange={upd('genre')}
                >
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-pri w-full py-3 mt-2">
              {loading ? '⏳ Loading...' : isReg ? '🚀 Start Career' : '🎵 Enter Treblr'}
            </button>
          </form>

          <p className="text-center text-t-muted text-sm mt-6">
            {isReg ? 'Already have an account? ' : 'New here? '}
            <Link to={isReg ? '/login' : '/register'} className="text-violet-400 hover:text-violet-300 transition-colors">
              {isReg ? 'Sign in' : 'Create account'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="label block mb-1.5">{label}</label>
      <input
        className="w-full bg-t-surface border border-t-border rounded-xl px-4 py-2.5 text-t-text placeholder-t-muted focus:outline-none focus:border-t-accent transition-colors"
        {...props}
      />
    </div>
  );
}
