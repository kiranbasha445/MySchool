import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import { getUser, getInitials, scoreClass } from '../utils/auth';
import type { Mark, StudentDetail } from '../types';

export default function MyMarks() {
  const user = getUser();
  const studentId = user?.linkedStudentId;

  const [marks, setMarks] = useState<Mark[]>([]);
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(!!studentId);

  useEffect(() => {
    if (!studentId) return;
    Promise.all([
      API.get<Mark[]>(`/Marks/student/${studentId}`),
      API.get<StudentDetail>(`/Students/${studentId}`),
    ])
      .then(([m, s]) => { setMarks(m.data); setStudent(s.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  const average =
    marks.length > 0
      ? Math.round(marks.reduce((acc, m) => acc + m.score, 0) / marks.length)
      : null;

  if (!studentId) {
    return (
      <Layout>
        <header className="top-header"><div className="top-header-title">My Marks</div></header>
        <div className="page-content">
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🔗</div>
              <div className="empty-state-title">No student profile linked</div>
              <div className="empty-state-text">
                Ask your administrator to link your account to a student profile.
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <header className="top-header">
        <div className="top-header-title">My Marks</div>
      </header>

      <div className="page-content">
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : (
          <>
            {/* Student info card */}
            {student && (
              <div className="card mb-6">
                <div className="card-body">
                  <div className="flex items-center gap-3">
                    <div className="avatar avatar-lg">{getInitials(student.name)}</div>
                    <div>
                      <div className="font-bold" style={{ fontSize: 18 }}>{student.name}</div>
                      <div className="text-muted text-sm">{student.class.name}</div>
                    </div>
                    {average !== null && (
                      <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div style={{ fontSize: 28, fontWeight: 900 }} className={scoreClass(average) === 'high' ? '' : ''}>
                          {average}%
                        </div>
                        <div className="text-muted text-sm">Overall Average</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {marks.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <div className="empty-state-title">No marks recorded yet</div>
                  <div className="empty-state-text">Your marks will appear here once your teacher adds them.</div>
                </div>
              </div>
            ) : (
              <div className="marks-grid">
                {marks.map((m) => (
                  <div key={m.id} className="mark-card">
                    <div className="mark-card-subject">{m.subject}</div>
                    <div className={`mark-card-score ${scoreClass(m.score)}`}>{m.score}</div>
                    <div className="score-bar-track" style={{ marginTop: 10 }}>
                      <div
                        className={`score-bar-fill ${scoreClass(m.score)}`}
                        style={{ width: `${m.score}%` }}
                      />
                    </div>
                    {m.term && <div className="mark-card-term">{m.term}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
