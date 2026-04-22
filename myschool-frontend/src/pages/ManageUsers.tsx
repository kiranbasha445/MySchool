import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import { getRole } from '../utils/auth';
import type { ManagedUser, UnlinkedStudent } from '../types';

type Tab = 'staff' | 'portals';

const ROLE_BADGE: Record<string, string> = {
  Principal: 'badge-danger',
  Teacher:   'badge-warning',
  Student:   'badge-info',
  Parent:    'badge-success',
};

export default function ManageUsers() {
  const role        = getRole();
  const isPrincipal = role === 'Principal';

  const [tab,      setTab]      = useState<Tab>('staff');
  const [users,    setUsers]    = useState<ManagedUser[]>([]);
  const [loading,  setLoading]  = useState(true);

  // Modals
  const [showAddStaff,   setShowAddStaff]   = useState(false);
  const [showAddPortal,  setShowAddPortal]  = useState<'student' | 'parent' | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    API.get<ManagedUser[]>('/Users')
      .then(r => setUsers(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggle = async (u: ManagedUser) => {
    if (!confirm(`${u.isActive ? 'Deactivate' : 'Activate'} ${u.name}?`)) return;
    await API.patch(`/Users/${u.id}/toggle-active`);
    fetchUsers();
  };

  const handleDelete = async (u: ManagedUser) => {
    if (!confirm(`Permanently delete ${u.name}'s account? This cannot be undone.`)) return;
    try {
      await API.delete(`/Users/${u.id}`);
      fetchUsers();
    } catch { alert('Failed to delete account.'); }
  };

  const staff   = users.filter(u => u.role === 'Teacher' || u.role === 'Principal');
  const portals = users.filter(u => u.role === 'Student' || u.role === 'Parent');

  return (
    <Layout>
      <header className="top-header">
        <div className="top-header-title">Manage Accounts</div>
        {tab === 'staff' && isPrincipal && (
          <button className="btn btn-primary" onClick={() => setShowAddStaff(true)}>
            + Add Staff
          </button>
        )}
        {tab === 'portals' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={() => setShowAddPortal('student')}>
              + Student Account
            </button>
            <button className="btn btn-ghost" onClick={() => setShowAddPortal('parent')}>
              + Parent Account
            </button>
          </div>
        )}
      </header>

      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>User Management</h1>
            <p>Control who can log in to the school portal and with what permissions</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button
            className={`btn ${tab === 'staff' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('staff')}
          >
            Staff ({staff.length})
          </button>
          <button
            className={`btn ${tab === 'portals' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('portals')}
          >
            Student &amp; Parent Portals ({portals.length})
          </button>
        </div>

        <div className="card">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : (
            <UserTable
              users={tab === 'staff' ? staff : portals}
              isPrincipal={isPrincipal}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      {showAddStaff && (
        <AddStaffModal
          onClose={() => setShowAddStaff(false)}
          onSaved={() => { setShowAddStaff(false); fetchUsers(); }}
        />
      )}

      {showAddPortal && (
        <AddPortalModal
          type={showAddPortal}
          onClose={() => setShowAddPortal(null)}
          onSaved={() => { setShowAddPortal(null); fetchUsers(); }}
        />
      )}
    </Layout>
  );
}

/* ── User table ── */
function UserTable({
  users, isPrincipal, onToggle, onDelete,
}: {
  users: ManagedUser[];
  isPrincipal: boolean;
  onToggle: (u: ManagedUser) => void;
  onDelete: (u: ManagedUser) => void;
}) {
  if (users.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">👤</div>
        <div className="empty-state-title">No accounts yet</div>
        <div className="empty-state-text">Use the buttons above to create accounts.</div>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Linked To</th>
            <th>Status</th>
            <th>Created</th>
            {isPrincipal && <th style={{ textAlign: 'right' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ opacity: u.isActive ? 1 : 0.45 }}>
              <td className="font-bold">{u.name}</td>
              <td className="text-muted text-sm">{u.email}</td>
              <td><span className={`badge ${ROLE_BADGE[u.role] ?? 'badge-info'}`}>{u.role}</span></td>
              <td className="text-muted text-sm">{u.linkedStudentName ?? '—'}</td>
              <td>
                <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                  {u.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="text-muted text-sm">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              {isPrincipal && (
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => onToggle(u)}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onDelete(u)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Add Staff modal ── */
function AddStaffModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form,    setForm]    = useState({ name: '', email: '', password: '' });
  const [result,  setResult]  = useState<{ name: string; email: string; tempPassword: string } | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.name || !form.email) { setError('Name and email are required.'); return; }
    setSaving(true);
    try {
      const res = await API.post<{ user: { name: string; email: string }; tempPassword: string }>(
        '/Users/staff',
        { name: form.name, email: form.email, password: form.password || undefined }
      );
      setResult({ name: res.data.user.name, email: res.data.user.email, tempPassword: res.data.tempPassword });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Failed to create account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div className="modal-title">Add Staff Account</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {result ? (
            <CredentialsCard
              name={result.name}
              email={result.email}
              password={result.tempPassword}
              role="Teacher"
            />
          ) : (
            <>
              {error && <div className="login-error" style={{ marginBottom: 12 }}>⚠ {error}</div>}
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" placeholder="e.g. Ms. Jane Smith" value={form.name} onChange={set('name')} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-input" type="email" placeholder="teacher@school.edu" value={form.email} onChange={set('email')} />
              </div>
              <div className="form-group">
                <label className="form-label">Password (leave blank to auto-generate)</label>
                <input className="form-input" type="text" placeholder="Auto-generated if empty" value={form.password} onChange={set('password')} />
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          {result ? (
            <button className="btn btn-primary" onClick={onSaved} style={{ width: '100%' }}>Done</button>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Creating…' : 'Create Account'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Add Student / Parent portal modal ── */
function AddPortalModal({
  type, onClose, onSaved,
}: {
  type: 'student' | 'parent';
  onClose: () => void;
  onSaved: () => void;
}) {
  const [students, setStudents] = useState<UnlinkedStudent[]>([]);
  const [form, setForm]         = useState({ studentId: '', name: '', email: '', password: '' });
  const [result, setResult]     = useState<{ name: string; email: string; tempPassword: string } | null>(null);
  const [saving,  setSaving]    = useState(false);
  const [error,   setError]     = useState('');

  useEffect(() => {
    API.get<UnlinkedStudent[]>('/Users/unlinked-students').then(r => setStudents(r.data));
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const selectedStudent = students.find(s => s.id === Number(form.studentId));

  const handleSave = async () => {
    if (!form.studentId) { setError('Please select a student.'); return; }
    if (!form.email)      { setError('Email is required.'); return; }
    if (type === 'parent' && !form.name) { setError('Parent name is required.'); return; }

    setSaving(true);
    try {
      const endpoint = type === 'student' ? '/Users/student-account' : '/Users/parent-account';
      const res = await API.post<{ user: { name: string; email: string }; tempPassword: string }>(
        endpoint,
        {
          studentId: Number(form.studentId),
          name:      form.name || undefined,
          email:     form.email,
          password:  form.password || undefined,
        }
      );
      setResult({ name: res.data.user.name, email: res.data.user.email, tempPassword: res.data.tempPassword });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Failed to create account.');
    } finally {
      setSaving(false);
    }
  };

  const title = type === 'student' ? 'Create Student Portal Account' : 'Create Parent Portal Account';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {result ? (
            <CredentialsCard
              name={result.name}
              email={result.email}
              password={result.tempPassword}
              role={type === 'student' ? 'Student' : 'Parent'}
            />
          ) : (
            <>
              {error && <div className="login-error" style={{ marginBottom: 12 }}>⚠ {error}</div>}

              <div className="form-group">
                <label className="form-label">Student *</label>
                <select className="form-input" value={form.studentId} onChange={set('studentId')}>
                  <option value="">— Select student —</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.className}){s.hasStudentAccount ? ' · has student login' : ''}
                    </option>
                  ))}
                </select>
                {selectedStudent && (
                  <div className="text-muted text-sm" style={{ marginTop: 4 }}>
                    Linked account will have access to {selectedStudent.name}'s marks and progress.
                  </div>
                )}
              </div>

              {type === 'parent' && (
                <div className="form-group">
                  <label className="form-label">Parent / Guardian Name *</label>
                  <input className="form-input" placeholder="e.g. Mr. Hassan Ahmed" value={form.name} onChange={set('name')} />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-input" type="email" placeholder="parent@email.com" value={form.email} onChange={set('email')} />
              </div>

              <div className="form-group">
                <label className="form-label">Password (leave blank to auto-generate)</label>
                <input className="form-input" type="text" placeholder="Auto-generated if empty" value={form.password} onChange={set('password')} />
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          {result ? (
            <button className="btn btn-primary" onClick={onSaved} style={{ width: '100%' }}>Done</button>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Creating…' : 'Create Account'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Credentials display card shown after successful account creation ── */
function CredentialsCard({
  name, email, password, role,
}: {
  name: string; email: string; password: string; role: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(`Email: ${email}\nPassword: ${password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>✅</div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{role} account created for {name}</div>
        <div className="text-muted text-sm">Share these credentials with them — the password can be changed via "Forgot Password".</div>
      </div>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '14px 16px', fontFamily: 'monospace',
        fontSize: 13, lineHeight: 1.8,
      }}>
        <div><span className="text-muted">Email:    </span><strong>{email}</strong></div>
        <div><span className="text-muted">Password: </span><strong>{password}</strong></div>
      </div>
      <button
        className="btn btn-ghost"
        onClick={copy}
        style={{ width: '100%', marginTop: 10 }}
      >
        {copied ? '✓ Copied!' : '📋 Copy credentials'}
      </button>
    </div>
  );
}
