import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../api/axios';
import { isAuthenticated, getRole } from '../utils/auth';
import type { Class, PublicClass } from '../types';

/* ── Public wrapper (no sidebar) ── */
function PublicWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-page" style={{ minHeight: '100vh' }}>
      <nav className="landing-nav">
        <a href="/" className="landing-nav-brand">
          <div className="landing-nav-icon">🎓</div>
          MySchool
        </a>
        <Link to="/login" className="btn-hero-primary" style={{ padding: '9px 20px', fontSize: 14 }}>
          Staff Login →
        </Link>
      </nav>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        {children}
      </div>
    </div>
  );
}

export default function Classes() {
  const navigate  = useNavigate();
  const authed    = isAuthenticated();
  const role      = getRole();
  const isPrincipal = role === 'Principal';

  const [authClasses,   setAuthClasses]   = useState<Class[]>([]);
  const [publicClasses, setPublicClasses] = useState<PublicClass[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [showModal,     setShowModal]     = useState(false);
  const [deleting,      setDeleting]      = useState<number | null>(null);

  const fetchAuthClasses = () => {
    API.get<Class[]>('/Classes')
      .then(r => setAuthClasses(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const fetchPublicClasses = () => {
    API.get<PublicClass[]>('/Public/classes')
      .then(r => setPublicClasses(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (authed) fetchAuthClasses();
    else fetchPublicClasses();
  }, [authed]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this class? Students in it will lose their class assignment.')) return;
    setDeleting(id);
    try {
      await API.delete(`/Classes/${id}`);
      fetchAuthClasses();
    } catch {
      alert('Failed to delete class.');
    } finally {
      setDeleting(null);
    }
  };

  // ── PUBLIC VIEW ───────────────────────────────────────────────────────
  if (!authed) {
    return (
      <PublicWrap>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
            School Classrooms
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>
            Browse available seats and submit an admission enquiry for any class.
          </p>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : (
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {publicClasses.map(c => (
              <div
                key={c.id}
                onClick={() => navigate(`/classes/${c.id}`)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16,
                  padding: '20px 22px',
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: 28 }}>🏫</div>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 18 }}>{c.name}</div>
                </div>

                {/* Seat bar */}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Seats filled</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                      {c.occupied} / {c.capacity}
                    </span>
                  </div>
                  <div style={{ height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(c.occupied / c.capacity) * 100}%`,
                      background: c.available > 0 ? '#10b981' : '#ef4444',
                      borderRadius: 3,
                    }} />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {c.available > 0 ? (
                    <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>
                      ✓ {c.available} seats available
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Full</span>
                  )}
                  {c.enquiries > 0 && (
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      {c.enquiries} enquir{c.enquiries === 1 ? 'y' : 'ies'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PublicWrap>
    );
  }

  // ── AUTHENTICATED VIEW ────────────────────────────────────────────────
  return (
    <Layout>
      <header className="top-header">
        <div className="top-header-title">Classes</div>
        {isPrincipal && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Class
          </button>
        )}
      </header>

      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Class Management</h1>
            <p>{authClasses.length} classes configured</p>
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : authClasses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏫</div>
              <div className="empty-state-title">No classes yet</div>
              <div className="empty-state-text">Create your first class to start enrolling students.</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Class Name</th>
                    <th>Students</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {authClasses.map((c, i) => (
                    <tr
                      key={c.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/classes/${c.id}`)}
                    >
                      <td className="text-muted text-sm">{i + 1}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: 20 }}>🏫</span>
                          <span className="font-bold" style={{ color: 'var(--primary)' }}>{c.name}</span>
                          <span className="text-muted text-sm">→ View classroom</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">{c.studentCount} / 40 seats filled</span>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        {isPrincipal ? (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(c.id)}
                            disabled={deleting === c.id}
                          >
                            {deleting === c.id ? '…' : 'Delete'}
                          </button>
                        ) : (
                          <span className="text-muted text-sm">View only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <AddClassModal
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchAuthClasses(); }}
        />
      )}
    </Layout>
  );
}

function AddClassModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name,   setName]   = useState('');
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { setError('Class name is required.'); return; }
    setSaving(true);
    try {
      await API.post('/Classes', { name: name.trim() });
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Failed to save class.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">New Class</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="login-error" style={{ marginBottom: 14 }}>⚠ {error}</div>}
          <div className="form-group">
            <label className="form-label">Class Name</label>
            <input
              className="form-input"
              placeholder="e.g. Grade 10-A"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Create Class'}
          </button>
        </div>
      </div>
    </div>
  );
}
