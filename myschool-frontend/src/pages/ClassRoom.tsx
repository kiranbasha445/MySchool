import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../api/axios';
import { getInitials, scoreClass, isAuthenticated, getRole } from '../utils/auth';
import type { PublicClassDetail } from '../types';

const CAPACITY = 40;

interface ClassStudent {
  id: number;
  name: string;
  profileImage?: string;
  averageScore: number | null;
}

interface ClassDetail {
  id: number;
  name: string;
  capacity: number;
  students: ClassStudent[];
}

interface StudentFull {
  id: number;
  name: string;
  class: { id: number; name: string };
  marks: { id: number; subject: string; score: number; term?: string }[];
  achievements: { id: number; title: string }[];
}

interface AttendanceRec { status: string }

const AVATAR_COLORS = [
  '#3b82f6','#8b5cf6','#ec4899','#06b6d4',
  '#10b981','#f59e0b','#6366f1','#14b8a6',
  '#ef4444','#a855f7','#0ea5e9','#84cc16',
];

/* ── Public nav wrapper ── */
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
      {children}
    </div>
  );
}

/* ── Enquiry modal (public use) ── */
function EnquiryModal({
  classId,
  className,
  onClose,
}: {
  classId: number;
  className: string;
  onClose: () => void;
}) {
  const [form, setForm]     = useState({ parentName: '', parentEmail: '', studentName: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [done,   setDone]   = useState(false);
  const [error,  setError]  = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.parentName || !form.parentEmail || !form.studentName) {
      setError('Please fill in all required fields.'); return;
    }
    setSaving(true);
    try {
      await API.post('/Public/enquiry', { classId, ...form });
      setDone(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Failed to submit enquiry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <div className="modal-title">Admission Enquiry — {className}</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {done ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Enquiry Submitted!</div>
              <div className="text-muted text-sm">The school will contact you at {form.parentEmail} soon.</div>
            </div>
          ) : (
            <>
              {error && <div className="login-error" style={{ marginBottom: 12 }}>⚠ {error}</div>}
              <div className="form-group">
                <label className="form-label">Your Name *</label>
                <input className="form-input" placeholder="Parent / Guardian name" value={form.parentName} onChange={set('parentName')} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input className="form-input" type="email" placeholder="your@email.com" value={form.parentEmail} onChange={set('parentEmail')} />
              </div>
              <div className="form-group">
                <label className="form-label">Student Name *</label>
                <input className="form-input" placeholder="Your child's full name" value={form.studentName} onChange={set('studentName')} />
              </div>
              <div className="form-group">
                <label className="form-label">Message (optional)</label>
                <textarea
                  className="form-input"
                  placeholder="Any additional details…"
                  value={form.message}
                  onChange={set('message')}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
            </>
          )}
        </div>
        {!done && (
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={saving}>
              {saving ? 'Submitting…' : 'Submit Enquiry'}
            </button>
          </div>
        )}
        {done && (
          <div className="modal-footer">
            <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Student detail popup (staff only) ── */
function StudentDetailPanel({
  student,
  onClose,
}: {
  student: ClassStudent;
  onClose: () => void;
}) {
  const [full, setFull]         = useState<StudentFull | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRec[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      API.get<StudentFull>(`/Students/${student.id}`),
      API.get<AttendanceRec[]>(`/Attendance/student/${student.id}`),
    ])
      .then(([s, a]) => { setFull(s.data); setAttendance(a.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [student.id]);

  const avgScore = student.averageScore;
  const color    = AVATAR_COLORS[student.id % AVATAR_COLORS.length];

  const presentRate = attendance.length > 0
    ? Math.round(attendance.filter(a => a.status === 'Present' || a.status === 'Late').length / attendance.length * 100)
    : null;

  // Group marks by term
  const byTerm = full?.marks.reduce<Record<string, typeof full.marks>>((acc, m) => {
    const k = m.term ?? 'General'; (acc[k] ??= []).push(m); return acc;
  }, {}) ?? {};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, maxHeight: '85vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <div className="modal-title">Student Profile</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 18, flexShrink: 0,
            }}>
              {getInitials(student.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 17 }}>{student.name}</div>
              <div className="text-muted text-sm">{full?.class?.name ?? '…'}</div>
            </div>
            {avgScore !== null && (
              <div style={{ textAlign: 'right' }}>
                <div className={`badge badge-${scoreClass(avgScore) === 'high' ? 'success' : scoreClass(avgScore) === 'medium' ? 'warning' : 'danger'}`}
                  style={{ fontSize: 15, padding: '4px 12px' }}>
                  {avgScore}%
                </div>
                <div className="text-muted" style={{ fontSize: 10, marginTop: 2 }}>avg score</div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="spinner-wrap" style={{ padding: '20px 0' }}><div className="spinner" /></div>
          ) : (
            <>
              {/* Quick stats */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                {[
                  { icon: '📊', label: 'Marks', val: full?.marks.length ?? 0 },
                  { icon: '🏆', label: 'Awards', val: full?.achievements.length ?? 0 },
                  { icon: '📋', label: 'Attendance', val: presentRate !== null ? `${presentRate}%` : 'N/A' },
                ].map(s => (
                  <div key={s.label} style={{
                    flex: 1, textAlign: 'center', padding: '10px 6px',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 10,
                  }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{s.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{s.val}</div>
                    <div className="text-muted" style={{ fontSize: 10 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Marks by term */}
              {Object.entries(byTerm).map(([term, marks]) => {
                const termAvg = Math.round(marks.reduce((a, m) => a + m.score, 0) / marks.length);
                return (
                  <div key={term} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{term}</div>
                      <span className={`badge badge-${scoreClass(termAvg) === 'high' ? 'success' : scoreClass(termAvg) === 'medium' ? 'warning' : 'danger'}`}
                        style={{ fontSize: 11 }}>avg {termAvg}%</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {marks.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ flex: 1, fontSize: 12, color: 'var(--text-muted)' }}>{m.subject}</span>
                          <div style={{ width: 80, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                            <div style={{
                              width: `${m.score}%`, height: '100%', borderRadius: 2,
                              background: scoreClass(m.score) === 'high' ? '#10b981' : scoreClass(m.score) === 'medium' ? '#f59e0b' : '#ef4444',
                            }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, width: 32, textAlign: 'right' }}>{m.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Achievements */}
              {(full?.achievements.length ?? 0) > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>🏆 Achievements</div>
                  {full!.achievements.map(a => (
                    <div key={a.id} style={{
                      padding: '6px 10px', marginBottom: 4,
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 6, fontSize: 12,
                    }}>
                      {a.title}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   Main ClassRoom component
═══════════════════════════════════════════════════════════════════════ */
export default function ClassRoom() {
  const { id }      = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const authed      = isAuthenticated();
  const role        = getRole();
  const isStaff     = role === 'Principal' || role === 'Teacher';

  const [authCls,   setAuthCls]   = useState<ClassDetail | null>(null);
  const [publicCls, setPublicCls] = useState<PublicClassDetail | null>(null);
  const [loading,   setLoading]   = useState(true);

  // Modals
  const [enquiryTarget,    setEnquiryTarget]    = useState<number | null>(null); // seat index
  const [selectedStudent,  setSelectedStudent]  = useState<ClassStudent | null>(null);

  useEffect(() => {
    if (!id) return;
    if (authed) {
      API.get<ClassDetail>(`/Classes/${id}`)
        .then(r => setAuthCls(r.data))
        .catch(() => navigate('/classes'))
        .finally(() => setLoading(false));
    } else {
      API.get<PublicClassDetail>(`/Public/classes/${id}`)
        .then(r => setPublicCls(r.data))
        .catch(() => navigate('/classes'))
        .finally(() => setLoading(false));
    }
  }, [id, authed, navigate]);

  if (loading) {
    const Wrap = authed ? Layout : PublicWrap;
    return (
      <Wrap>
        <div className="spinner-wrap" style={{ paddingTop: 80 }}><div className="spinner" /></div>
      </Wrap>
    );
  }

  /* ── PUBLIC VIEW ─────────────────────────────────────────────────── */
  if (!authed && publicCls) {
    const { name, occupied, available, enquiries, seats, capacity } = publicCls;

    return (
      <PublicWrap>
        {/* Back link */}
        <div style={{ padding: '16px 0 0' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/classes')}
            style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 0 }}
          >
            ← All Classes
          </button>
        </div>

        <div className="classroom-room" style={{ marginTop: 16, background: 'transparent' }}>
          {/* Blackboard */}
          <div className="blackboard">
            <div className="blackboard-title">{name}</div>
            <div className="blackboard-subtitle">
              {occupied} seat{occupied !== 1 ? 's' : ''} occupied · {available} available
            </div>
            <div className="blackboard-chalk" />
          </div>

          {/* Meta */}
          <div className="classroom-meta">
            <div className="seat-legend">
              <div className="legend-item">
                <div className="legend-dot occupied" />
                Occupied
              </div>
              <div className="legend-item">
                <div className="legend-dot empty" />
                Available — click to enquire
              </div>
            </div>
            <div className="seat-stats">
              <div className="seat-stat">
                <div className="seat-stat-val occupied">{occupied}</div>
                <div className="seat-stat-label">Occupied</div>
              </div>
              <div className="seat-stat">
                <div className="seat-stat-val empty">{available}</div>
                <div className="seat-stat-label">Available</div>
              </div>
              <div className="seat-stat">
                <div className="seat-stat-val" style={{ color: '#6b7280' }}>{capacity}</div>
                <div className="seat-stat-label">Total</div>
              </div>
              {enquiries > 0 && (
                <div className="seat-stat">
                  <div className="seat-stat-val" style={{ color: '#6366f1' }}>{enquiries}</div>
                  <div className="seat-stat-label">Enquiries</div>
                </div>
              )}
            </div>
          </div>

          {/* Teacher desk */}
          <div className="teacher-area">
            <div className="teacher-desk">📋 Teacher's Desk</div>
          </div>

          {/* Seats grid */}
          <div className="seats-grid">
            {seats.map((isOccupied, i) =>
              isOccupied ? (
                <div
                  key={`occ-${i}`}
                  className="seat seat-occupied seat-anon"
                  style={{ animationDelay: `${i * 0.035}s` }}
                >
                  <div className="seat-avatar-sm" style={{ background: '#64748b', opacity: 0.8 }}>
                    👤
                  </div>
                  <div className="seat-name-sm" style={{ color: '#94a3b8' }}>Occupied</div>
                </div>
              ) : (
                <div
                  key={`empty-${i}`}
                  className="seat seat-empty seat-enquire"
                  style={{ animationDelay: `${i * 0.035}s` }}
                  title="Click to submit admission enquiry"
                  onClick={() => setEnquiryTarget(i)}
                >
                  <div className="seat-empty-icon">🪑</div>
                  <div className="seat-empty-label">Enquire</div>
                </div>
              )
            )}
          </div>
        </div>

        {/* Enquiry modal */}
        {enquiryTarget !== null && (
          <EnquiryModal
            classId={publicCls.id}
            className={name}
            onClose={() => setEnquiryTarget(null)}
          />
        )}
      </PublicWrap>
    );
  }

  /* ── AUTHENTICATED VIEW ──────────────────────────────────────────── */
  if (!authCls) return null;

  const occupied = authCls.students.length;
  const empty    = CAPACITY - occupied;
  const slots    = Array.from({ length: CAPACITY }, (_, i) =>
    i < occupied ? authCls.students[i] : null
  );

  return (
    <Layout>
      <header className="top-header">
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/classes')}>← Back</button>
        <div className="top-header-title" style={{ flex: 1 }}>{authCls.name}</div>
      </header>

      <div className="page-content" style={{ background: '#f0ebe3', minHeight: 'calc(100vh - 64px)' }}>
        <div className="classroom-room">

          {/* Blackboard */}
          <div className="blackboard">
            <div className="blackboard-title">{authCls.name}</div>
            <div className="blackboard-subtitle">
              {occupied} student{occupied !== 1 ? 's' : ''} enrolled · {empty} seat{empty !== 1 ? 's' : ''} available
            </div>
            <div className="blackboard-chalk" />
          </div>

          {/* Meta */}
          <div className="classroom-meta">
            <div className="seat-legend">
              <div className="legend-item"><div className="legend-dot occupied" />Occupied</div>
              <div className="legend-item"><div className="legend-dot empty" />Available</div>
            </div>
            <div className="seat-stats">
              <div className="seat-stat">
                <div className="seat-stat-val occupied">{occupied}</div>
                <div className="seat-stat-label">Occupied</div>
              </div>
              <div className="seat-stat">
                <div className="seat-stat-val empty">{empty}</div>
                <div className="seat-stat-label">Available</div>
              </div>
              <div className="seat-stat">
                <div className="seat-stat-val" style={{ color: '#6b7280' }}>{CAPACITY}</div>
                <div className="seat-stat-label">Total</div>
              </div>
            </div>
          </div>

          {/* Teacher's desk */}
          <div className="teacher-area">
            <div className="teacher-desk">📋 Teacher's Desk</div>
          </div>

          {/* Seat grid */}
          <div className="seats-grid">
            {slots.map((student, i) =>
              student ? (
                <OccupiedSeat
                  key={student.id}
                  student={student}
                  index={i}
                  color={AVATAR_COLORS[student.id % AVATAR_COLORS.length]}
                  showScore={isStaff}
                  clickable={isStaff}
                  onClick={isStaff ? () => setSelectedStudent(student) : undefined}
                />
              ) : (
                <EmptySeat key={`empty-${i}`} index={i} number={i + 1} />
              )
            )}
          </div>
        </div>
      </div>

      {/* Staff: student detail popup */}
      {selectedStudent && (
        <StudentDetailPanel
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </Layout>
  );
}

/* ── Occupied seat ── */
function OccupiedSeat({
  student, index, color, showScore, clickable, onClick,
}: {
  student: ClassStudent;
  index: number;
  color: string;
  showScore: boolean;
  clickable: boolean;
  onClick?: () => void;
}) {
  const sc = student.averageScore !== null ? scoreClass(student.averageScore) : null;

  return (
    <div
      className={`seat seat-occupied${clickable ? ' seat-clickable' : ''}`}
      style={{ animationDelay: `${index * 0.035}s` }}
      onClick={onClick}
      title={clickable ? `${student.name} — click to view details` : student.name}
    >
      {/* Tooltip */}
      <div className="seat-tooltip">
        <div className="seat-tooltip-name">{student.name}</div>
        <div className="seat-tooltip-score">
          {student.averageScore !== null
            ? `Avg: ${student.averageScore}%`
            : 'No marks yet'}
        </div>
        {clickable && <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>Click for full details</div>}
      </div>

      <div className="seat-avatar-sm" style={{ background: color }}>
        {getInitials(student.name)}
      </div>
      <div className="seat-name-sm" title={student.name}>
        {student.name.split(' ')[0]}
      </div>
      {showScore && student.averageScore !== null && sc && (
        <div className={`seat-score-sm ${sc}`}>
          {student.averageScore}%
        </div>
      )}
    </div>
  );
}

function EmptySeat({ index, number }: { index: number; number: number }) {
  return (
    <div
      className="seat seat-empty"
      style={{ animationDelay: `${index * 0.035}s` }}
      title={`Seat ${number} — Available`}
    >
      <div className="seat-empty-icon">🪑</div>
      <div className="seat-empty-label">Seat {number}</div>
    </div>
  );
}
