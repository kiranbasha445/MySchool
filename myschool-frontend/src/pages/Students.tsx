import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import { getRole, getInitials, scoreClass } from '../utils/auth';
import type { Student, Class } from '../types';

export default function Students() {
  const role = getRole();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const canEdit = role === 'Principal' || role === 'Teacher';

  const fetchAll = () => {
    Promise.all([
      API.get<Student[]>('/Students'),
      API.get<Class[]>('/Classes'),
    ])
      .then(([s, c]) => {
        setStudents(s.data);
        setClasses(c.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.className.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <header className="top-header">
        <div className="top-header-title">Students</div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Student
          </button>
        )}
      </header>

      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>All Students</h1>
            <p>{students.length} students enrolled</p>
          </div>
          <div className="search-wrap" style={{ width: 260 }}>
            <span className="search-icon">🔍</span>
            <input
              className="form-input"
              placeholder="Search by name or class…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">No students found</div>
              <div className="empty-state-text">
                {search ? 'Try a different search term.' : 'Add your first student to get started.'}
              </div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Marks</th>
                    <th>Average Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="avatar">{getInitials(s.name)}</div>
                          <span className="font-bold">{s.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">{s.className}</span>
                      </td>
                      <td className="text-muted">{s.marksCount}</td>
                      <td>
                        {s.averageScore !== null ? (
                          <div className="score-bar-wrap">
                            <div className="score-bar-track">
                              <div
                                className={`score-bar-fill ${scoreClass(s.averageScore)}`}
                                style={{ width: `${s.averageScore}%` }}
                              />
                            </div>
                            <span className="text-sm font-bold">{s.averageScore}%</span>
                          </div>
                        ) : (
                          <span className="text-muted text-sm">No marks</span>
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

      {showModal && canEdit && (
        <AddStudentModal
          classes={classes}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchAll(); }}
        />
      )}
    </Layout>
  );
}

function AddStudentModal({
  classes,
  onClose,
  onSaved,
}: {
  classes: Class[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [classId, setClassId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !classId) { setError('Name and class are required.'); return; }
    setSaving(true);
    try {
      await API.post('/Students', { name: name.trim(), classId: Number(classId) });
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Failed to save student.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Add Student</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="login-error" style={{ marginBottom: 14 }}>⚠ {error}</div>}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              placeholder="e.g. Ahmed Hassan"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Class</label>
            <select
              className="form-select"
              value={classId}
              onChange={(e) => { setClassId(e.target.value); setError(''); }}
            >
              <option value="">Select a class…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {classes.length === 0 && (
              <div className="form-hint">No classes available — add a class first.</div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Add Student'}
          </button>
        </div>
      </div>
    </div>
  );
}
