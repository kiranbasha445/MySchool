import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

export default function ForgotPassword() {
  const [email,     setEmail]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setError('');
    try {
      await API.post('/Auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left branding panel */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-icon">🎓</div>
          <span className="login-brand-name">MySchool</span>
        </div>
        <h1 className="login-headline">Reset your password</h1>
        <p className="login-tagline">
          Enter your registered email address and we'll send you a secure link to reset your password.
        </p>
      </div>

      {/* Right form panel */}
      <div className="login-right">
        <div className="login-form-box">
          {submitted ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
              <h2 className="login-form-title">Check your email</h2>
              <p className="login-form-sub" style={{ marginBottom: 24 }}>
                If <strong>{email}</strong> is registered, a reset link has been sent.
                Check your inbox (and spam folder).
              </p>

              <Link to="/login" className="btn btn-primary btn-lg w-full">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="login-form-title">Forgot password?</h2>
              <p className="login-form-sub">Enter your email to receive a reset link.</p>

              {error && <div className="login-error">⚠ {error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="you@school.edu"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    autoComplete="email"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-full"
                  disabled={loading}
                  style={{ marginTop: 8 }}
                >
                  {loading ? 'Sending…' : 'Send reset link →'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <Link to="/login" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  ← Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
