import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import { getRole } from '../utils/auth';
import type { Achievement, Student } from '../types';

const TROPHY_ICONS = ['🏆', '🥇', '🎖️', '🌟', '🎓', '🏅', '💡', '🚀'];

export default function Achievements() {
  const role = getRole();
  const canAdd = role === 'Principal' || role === 'Teacher';

  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchAchievements = () => {
    const base = API.get<Achievement[]>('/Achievements');
    if (canAdd) {
      Promise.all([base, API.get<Student[]>('/Students')])
        .then(([a, s]) => { setAchievements(a.data); setStudents(s.data); })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      base
        .then(a => setAchievements(a.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => { fetchAchievements(); }, []);

  const filtered = achievements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.studentName?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this achievement?')) return;
    await API.delete(`/Achievements/${id}`);
    fetchAchievements();
  };

  return (
    <Layout>
      <header className="top-header">
        <div className="top-header-title">Achievements</div>
        {canAdd && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            + Add Achievement
          </button>
        )}
      </header>

      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>School Achievements</h1>
            <p>{achievements.length} achievements recorded</p>
          </div>
          <div className="search-wrap" style={{ width: 260 }}>
            <span className="search-icon">🔍</span>
            <input
              className="form-input"
              placeholder="Search achievements…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🏆</div>
              <div className="empty-state-title">No achievements yet</div>
              <div className="empty-state-text">
                {canAdd
                  ? 'Start celebrating student achievements!'
                  : 'Check back soon for achievements.'}
              </div>
            </div>
          </div>
        ) : (
          <div className="achievement-grid">
            {filtered.map((a, i) => (
              <div key={a.id} className="achievement-card">
                <div className="achievement-card-icon">
                  {TROPHY_ICONS[i % TROPHY_ICONS.length]}
                </div>
                <div className="achievement-card-title">{a.title}</div>
                <div className="achievement-card-desc">{a.description}</div>
                <div className="achievement-card-footer">
                  <div className="flex items-center gap-2">
                    {a.studentName && (
                      <span className="badge badge-info">👤 {a.studentName}</span>
                    )}
                    {a.isPublic && (
                      <span className="badge badge-success">Public</span>
                    )}
                  </div>
                  {role === 'Principal' && (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDelete(a.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && canAdd && (
        <AddAchievementModal
          students={students}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchAchievements(); }}
        />
      )}
    </Layout>
  );
}

function AddAchievementModal({
  students,
  onClose,
  onSaved,
}: {
  students: Student[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setSaving(true);
    try {
      await API.post('/Achievements', {
        title: title.trim(),
        description: description.trim(),
        isPublic,
        studentId: studentId ? Number(studentId) : undefined,
      });
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Failed to save achievement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">🏆 New Achievement</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="login-error" style={{ marginBottom: 14 }}>⚠ {error}</div>}
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              placeholder="e.g. Science Olympiad Winner"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(''); }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              className="form-input"
              placeholder="Brief description of the achievement"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setError(''); }}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Student <span className="text-muted text-sm">(optional)</span></label>
              <select
                className="form-select"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              >
                <option value="">— School-wide —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Visibility</label>
              <select
                className="form-select"
                value={isPublic ? 'true' : 'false'}
                onChange={(e) => setIsPublic(e.target.value === 'true')}
              >
                <option value="true">Public</option>
                <option value="false">Private</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Add Achievement'}
          </button>
        </div>
      </div>
    </div>
  );
}
