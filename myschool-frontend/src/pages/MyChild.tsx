import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import { getUser, getInitials, scoreClass } from '../utils/auth';
import type { Mark, StudentDetail } from '../types';

export default function MyChild() {
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

  const byTerm = marks.reduce<Record<string, Mark[]>>((acc, m) => {
    const key = m.term ?? 'General';
    (acc[key] ??= []).push(m);
    return acc;
  }, {});

  if (!studentId) {
    return (
      <Layout>
        <header className="top-header"><div className="top-header-title">My Child's Progress</div></header>
        <div className="page-content">
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">🔗</div>
              <div className="empty-state-title">No child linked</div>
              <div className="empty-state-text">
                Ask the school administrator to link your account to your child's profile.
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
        <div className="top-header-title">My Child's Progress</div>
      </header>

      <div className="page-content">
        {loading ? (
          <div className="spinner-wrap"><div className="spinner" /></div>
        ) : (
          <>
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
                        <div style={{ fontSize: 28, fontWeight: 900 }}>
                          <span className={`badge badge-${scoreClass(average) === 'high' ? 'success' : scoreClass(average) === 'medium' ? 'warning' : 'danger'}`}
                            style={{ fontSize: 20, padding: '4px 14px' }}>
                            {average}%
                          </span>
                        </div>
                        <div className="text-muted text-sm mt-4">Overall Average</div>
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
                  <div className="empty-state-text">Marks will appear here once the teacher records them.</div>
                </div>
              </div>
            ) : (
              Object.entries(byTerm).map(([term, termMarks]) => (
                <div key={term} className="card mb-6">
                  <div className="card-header">
                    <div className="card-title">{term}</div>
                    <span className="badge badge-info">{termMarks.length} subjects</span>
                  </div>
                  <div className="card-body">
                    <div className="marks-grid">
                      {termMarks.map((m) => (
                        <div key={m.id} className="mark-card">
                          <div className="mark-card-subject">{m.subject}</div>
                          <div className={`mark-card-score ${scoreClass(m.score)}`}>{m.score}</div>
                          <div className="score-bar-track" style={{ marginTop: 10 }}>
                            <div
                              className={`score-bar-fill ${scoreClass(m.score)}`}
                              style={{ width: `${m.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
