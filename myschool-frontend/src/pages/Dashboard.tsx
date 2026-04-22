import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import { getUser, scoreClass } from '../utils/auth';
import type { DashboardStats } from '../types';

export default function Dashboard() {
  const user = getUser();
  const role = user?.role ?? 'Student';

  return (
    <Layout>
      <header className="top-header">
        <div>
          <div className="top-header-title">Dashboard</div>
          <div className="top-header-sub">Good day, {user?.name}</div>
        </div>
      </header>
      <div className="page-content">
        {role === 'Principal' || role === 'Teacher'
          ? <StaffDashboard role={role} />
          : <StudentDashboard />}
      </div>
    </Layout>
  );
}

function StaffDashboard({ role }: { role: string }) {
  const [stats, setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get<DashboardStats>('/Dashboard/stats')
      .then((r) => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;
  if (!stats)  return null;

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">👥</div>
          <div><div className="stat-value">{stats.totalStudents}</div><div className="stat-label">Total Students</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon teal">🏫</div>
          <div><div className="stat-value">{stats.totalClasses}</div><div className="stat-label">Classes</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">📊</div>
          <div><div className="stat-value">{stats.totalMarks}</div><div className="stat-label">Marks Recorded</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">🏆</div>
          <div><div className="stat-value">{stats.totalAchievements}</div><div className="stat-label">Achievements</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📈</div>
          <div><div className="stat-value">{stats.averageScore}%</div><div className="stat-label">School Average</div></div>
        </div>
      </div>

      {role === 'Principal' && stats.topStudents.length > 0 && (
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="card-header">
            <div>
              <div className="card-title">🏅 Top Performers</div>
              <div className="card-subtitle">Highest average scores</div>
            </div>
          </div>
          <div className="card-body">
            {stats.topStudents.map((s, i) => (
              <div key={s.id} className="top-student-row">
                <div className={`top-student-rank rank-${i + 1}`}>{i + 1}</div>
                <div className="avatar">{s.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="font-bold truncate">{s.name}</div>
                  <div className="text-sm text-muted">{s.className}</div>
                </div>
                <span className={`badge badge-${scoreClass(s.average) === 'high' ? 'success' : scoreClass(s.average) === 'medium' ? 'warning' : 'danger'}`}>
                  {s.average}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function StudentDashboard() {
  const user = getUser();
  const role = user?.role;
  return (
    <div className="card" style={{ maxWidth: 520 }}>
      <div className="card-body">
        <div className="empty-state">
          <div className="empty-state-icon">{role === 'Parent' ? '👨‍👩‍👧' : '🎓'}</div>
          <div className="empty-state-title">
            {role === 'Parent' ? "Your Child's Portal" : 'Your Student Portal'}
          </div>
          <div className="empty-state-text">
            {role === 'Parent'
              ? "Use the sidebar to view your child's marks and achievements."
              : 'Use the sidebar to view your marks and school achievements.'}
          </div>
        </div>
      </div>
    </div>
  );
}
