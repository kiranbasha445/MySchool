import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../api/axios';

export default function ResetPassword() {
  const [params]    = useSearchParams();
  const navigate    = useNavigate();
  const token       = params.get('token') ?? '';

  const [form,    setForm]    = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [done,    setDone]    = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.password) { setError('Please enter a new password.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    setError('');
    try {
      await API.post('/Auth/reset-password', { token, newPassword: form.password });
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Something went wrong. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="login-page">
        <div className="login-right" style={{ width: '100%', justifyContent: 'center' }}>
          <div className="login-form-box" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <h2 className="login-form-title">Invalid link</h2>
            <p className="login-form-sub">This reset link is missing a token. Please request a new one.</p>
            <Link to="/forgot-password" className="btn btn-primary btn-lg w-full" style={{ marginTop: 16 }}>
              Request new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">🎓</div>
          <span className="login-brand-name">MySchool</span>
        </div>
        <h1 className="login-headline">Set a new password</h1>
        <p className="login-tagline">
          Choose a strong password — at least 6 characters. You'll be redirected to login once it's saved.
        </p>
      </div>

      <div className="login-right">
        <div className="login-form-box">
          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 className="login-form-title">Password updated!</h2>
              <p className="login-form-sub">Redirecting you to login…</p>
              <Link to="/login" className="btn btn-primary btn-lg w-full" style={{ marginTop: 16 }}>
                Go to Login →
              </Link>
            </div>
          ) : (
            <>
              <h2 className="login-form-title">Set new password</h2>
              <p className="login-form-sub">Enter and confirm your new password below.</p>

              {error && <div className="login-error">⚠ {error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="password">New password</label>
                  <input
                    id="password"
                    type="password"
                    className="form-input"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={set('password')}
                    autoComplete="new-password"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confirm">Confirm password</label>
                  <input
                    id="confirm"
                    type="password"
                    className="form-input"
                    placeholder="Repeat your password"
                    value={form.confirm}
                    onChange={set('confirm')}
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-full"
                  disabled={loading}
                  style={{ marginTop: 8 }}
                >
                  {loading ? 'Saving…' : 'Save new password →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
