import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api/axios';
import type { LoginRequest, LoginResponse } from '../types';

export default function Login() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState<LoginRequest>({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    try {
      const res = await API.post<LoginResponse>('/Auth/login', form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ── Left branding panel ── */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">🎓</div>
          <span className="login-brand-name">MySchool</span>
        </div>
        <h1 className="login-headline">
          Empowering Students,<br />Inspiring Futures.
        </h1>
        <p className="login-tagline">
          A unified portal for students, parents, teachers and principals —
          track progress, celebrate achievements, and stay connected.
        </p>
        <div className="login-features">
          {[
            'Real-time marks and academic progress',
            'Role-based access for every stakeholder',
            'Achievement tracking and recognition',
            'Class and student management tools',
          ].map(f => (
            <div key={f} className="login-feature">
              <span className="login-feature-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="login-right">
        <div className="login-form-box">
          <h2 className="login-form-title">Welcome back</h2>
          <p className="login-form-sub">Sign in to your account to continue</p>

          {error && <div className="login-error">⚠ {error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email" name="email" type="email"
                placeholder="you@school.edu"
                className="form-input"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password" name="password" type="password"
                placeholder="••••••••"
                className="form-input"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
            <Link to="/" style={{ fontSize: 13, color: 'var(--text-muted)' }}>← Back to home</Link>
            <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
