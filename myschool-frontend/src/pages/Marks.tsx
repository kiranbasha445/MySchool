import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import { scoreClass } from '../utils/auth';
import type { Mark, Student } from '../types';

const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Final'];

export default function Marks() {
  const [marks, setMarks] = useState<Mark[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchAll = () => {
    Promise.all([API.get<Mark[]>('/Marks'), API.get<Student[]>('/Students')])
      .then(([m, s]) => { setMarks(m.data); setStudents(s.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = marks.filter(
    (m) =>
      m.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.className?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this mark?')) return;
    await API.delete(`/Marks/${id}`);
    fetchAll();
  };

  return (
    <Layout>
      <header className="top-header">
        <div className="top-header-title">Marks</div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Mark
        </button>
      </header>

      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Academic Marks</h1>
            <p>{marks.length} marks recorded</p>
          </div>
          <div className="search-wrap" style={{ width: 280 }}>
            <span className="search-icon">🔍</span>
            <input
              className="form-input"
              placeholder="Search by student, subject, class…"
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
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">No marks yet</div>
              <div className="empty-state-text">Start recording marks for your students.</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Term</th>
                    <th>Score</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.id}>
                      <td className="font-bold">{m.studentName}</td>
                      <td><span className="badge badge-info">{m.className}</span></td>
                      <td>{m.subject}</td>
                      <td><span className="text-sm text-muted">{m.term ?? '—'}</span></td>
                      <td>
                        <div className="score-bar-wrap">
                          <div className="score-bar-track">
                            <div
                              className={`score-bar-fill ${scoreClass(m.score)}`}
                              style={{ width: `${m.score}%` }}
                            />
                          </div>
                          <span className="font-bold text-sm">{m.score}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>
                          Delete
                        </button>
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
        <AddMarkModal
          students={students}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchAll(); }}
        />
      )}
    </Layout>
  );
}

function AddMarkModal({
  students,
  onClose,
  onSaved,
}: {
  students: Student[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [studentId, setStudentId] = useState('');
  const [subject, setSubject] = useState('');
  const [score, setScore] = useState('');
  const [term, setTerm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!studentId || !subject.trim() || score === '') {
      setError('Student, subject and score are required.');
      return;
    }
    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 100) {
      setError('Score must be a number between 0 and 100.');
      return;
    }
    setSaving(true);
    try {
      await API.post('/Marks', {
        studentId: Number(studentId),
        subject: subject.trim(),
        score: numScore,
        term: term || undefined,
      });
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Failed to save mark.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Add Mark</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {error && <div className="login-error" style={{ marginBottom: 14 }}>⚠ {error}</div>}
          <div className="form-group">
            <label className="form-label">Student</label>
            <select
              className="form-select"
              value={studentId}
              onChange={(e) => { setStudentId(e.target.value); setError(''); }}
            >
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.className}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input
                className="form-input"
                placeholder="e.g. Mathematics"
                value={subject}
                onChange={(e) => { setSubject(e.target.value); setError(''); }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Score (0–100)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                max="100"
                placeholder="85"
                value={score}
                onChange={(e) => { setScore(e.target.value); setError(''); }}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Term <span className="text-muted text-sm">(optional)</span></label>
            <select
              className="form-select"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            >
              <option value="">— None —</option>
              {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Mark'}
          </button>
        </div>
      </div>
    </div>
  );
}
