import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      if (mode === 'login') {
        if (!form.email || !form.password) { setError('Fill all fields'); setLoading(false); return; }
        await login(form.email, form.password);
      } else {
        if (!form.name || !form.email || !form.password) { setError('Fill all fields'); setLoading(false); return; }
        if (form.password.length < 6) { setError('Password must be 6+ characters'); setLoading(false); return; }
        await register(form.name, form.email, form.password);
      }
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(79,142,247,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.07) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/favicon.png"
            alt="StockFlow"
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              margin: '0 auto 16px',
              display: 'block',
              objectFit: 'cover',
              boxShadow: '0 10px 30px rgba(79,142,247,0.25)',
            }}
          />
          <h1 style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>StockFlow</h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 6 }}>Warehouse management, simplified</p>
        </div>

        <div className="card">
          {/* Tabs */}
          <div style={{
            display: 'flex', background: 'var(--bg)', borderRadius: 10, padding: 3, gap: 3, marginBottom: 24,
          }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
                flex: 1, padding: '9px 0', border: 'none', cursor: 'pointer',
                borderRadius: 8, fontFamily: 'var(--font)', fontWeight: 600, fontSize: 14, transition: 'all 0.18s',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text2)',
              }}>
                {m === 'login' ? 'Login' : 'Register'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && (
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input className="input" placeholder="Your name" value={form.name} onChange={set('name')} onKeyDown={handleKey} />
              </div>
            )}
            <div className="input-group">
              <label className="input-label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} onKeyDown={handleKey} />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} onKeyDown={handleKey} />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 12px', color: '#f87171', fontSize: 13 }}>
                {error}
              </div>
            )}

            <button className="btn btn-primary w-full" onClick={handleSubmit} disabled={loading} style={{ marginTop: 4, height: 46, fontSize: 15 }}>
              {loading ? <span className="spinner" /> : mode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
