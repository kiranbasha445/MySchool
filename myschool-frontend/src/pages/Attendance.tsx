import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import API from '../api/axios';
import type { Class, AttendanceRow, AttendanceSummaryRow, AttendanceStatus } from '../types';

const STATUS_OPTIONS: AttendanceStatus[] = ['Present', 'Absent', 'Late', 'Excused'];

const STATUS_STYLE: Record<AttendanceStatus, { badge: string; color: string }> = {
  Present: { badge: 'badge-success', color: '#10b981' },
  Absent:  { badge: 'badge-danger',  color: '#ef4444' },
  Late:    { badge: 'badge-warning', color: '#f59e0b' },
  Excused: { badge: 'badge-info',    color: '#6366f1' },
};

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

type Tab = 'mark' | 'summary';

export default function Attendance() {
  const [tab, setTab]               = useState<Tab>('mark');
  const [classes, setClasses]       = useState<Class[]>([]);
  const [classId, setClassId]       = useState<number | ''>('');
  const [date, setDate]             = useState(toDateInput(new Date()));

  // Mark attendance tab
  const [rows, setRows]             = useState<AttendanceRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);

  // Summary tab
  const [summary, setSummary]       = useState<AttendanceSummaryRow[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    API.get<Class[]>('/Classes').then(r => {
      setClasses(r.data);
      if (r.data.length > 0) setClassId(r.data[0].id);
    }).catch(console.error);
  }, []);

  // Load attendance rows when classId or date changes (mark tab)
  useEffect(() => {
    if (!classId || tab !== 'mark') return;
    setLoadingRows(true);
    setSaved(false);
    API.get<AttendanceRow[]>('/Attendance', { params: { classId, date } })
      .then(r => setRows(r.data))
      .catch(console.error)
      .finally(() => setLoadingRows(false));
  }, [classId, date, tab]);

  // Load summary when classId changes (summary tab)
  useEffect(() => {
    if (!classId || tab !== 'summary') return;
    setLoadingSummary(true);
    API.get<AttendanceSummaryRow[]>('/Attendance/summary', { params: { classId } })
      .then(r => setSummary(r.data))
      .catch(console.error)
      .finally(() => setLoadingSummary(false));
  }, [classId, tab]);

  const setStatus = (studentId: number, status: AttendanceStatus) => {
    setSaved(false);
    setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
  };

  const setNotes = (studentId: number, notes: string) => {
    setRows(prev => prev.map(r => r.studentId === studentId ? { ...r, notes } : r));
  };

  const markAll = (status: AttendanceStatus) => {
    setSaved(false);
    setRows(prev => prev.map(r => ({ ...r, status })));
  };

  const handleSave = async () => {
    if (!classId) return;
    setSaving(true);
    try {
      await API.post('/Attendance/bulk', {
        classId,
        date,
        records: rows.map(r => ({ studentId: r.studentId, status: r.status, notes: r.notes ?? null })),
      });
      setSaved(true);
    } catch {
      alert('Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = rows.filter(r => r.status === 'Present').length;
  const absentCount  = rows.filter(r => r.status === 'Absent').length;
  const lateCount    = rows.filter(r => r.status === 'Late').length;

  return (
    <Layout>
      <header className="top-header">
        <div className="top-header-title">Attendance</div>
        {tab === 'mark' && classId && (
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || rows.length === 0}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Attendance'}
          </button>
        )}
      </header>

      <div className="page-content">
        <div className="page-header">
          <div>
            <h1>Attendance Tracking</h1>
            <p>Mark and review daily attendance for your classes</p>
          </div>
        </div>

        {/* Controls */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: 20 }}>
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
            <div className="form-group" style={{ margin: 0, minWidth: 180 }}>
              <label className="form-label" style={{ marginBottom: 4 }}>Class</label>
              <select
                className="form-input"
                value={classId}
                onChange={e => setClassId(Number(e.target.value))}
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            {tab === 'mark' && (
              <div className="form-group" style={{ margin: 0, minWidth: 160 }}>
                <label className="form-label" style={{ marginBottom: 4 }}>Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            )}
            <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
              <button
                className={`btn ${tab === 'mark' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTab('mark')}
              >
                Mark Attendance
              </button>
              <button
                className={`btn ${tab === 'summary' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setTab('summary')}
              >
                Summary
              </button>
            </div>
          </div>
        </div>

        {/* Mark Attendance Tab */}
        {tab === 'mark' && (
          <>
            {/* Quick stats */}
            {rows.length > 0 && (
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Present', count: presentCount, color: '#10b981' },
                  { label: 'Absent',  count: absentCount,  color: '#ef4444' },
                  { label: 'Late',    count: lateCount,    color: '#f59e0b' },
                  { label: 'Total',   count: rows.length,  color: 'var(--primary)' },
                ].map(s => (
                  <div key={s.label} className="card" style={{ padding: '12px 20px', minWidth: 110, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.count}</div>
                    <div className="text-muted text-sm">{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="card">
              {loadingRows ? (
                <div className="spinner-wrap"><div className="spinner" /></div>
              ) : rows.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-title">No students</div>
                  <div className="empty-state-text">Select a class to start marking attendance.</div>
                </div>
              ) : (
                <>
                  <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className="text-muted text-sm" style={{ marginRight: 4 }}>Mark all:</span>
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s}
                        className="btn btn-ghost btn-sm"
                        style={{ color: STATUS_STYLE[s].color, borderColor: STATUS_STYLE[s].color + '44' }}
                        onClick={() => markAll(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student</th>
                          <th>Status</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={row.studentId}>
                            <td className="text-muted text-sm">{i + 1}</td>
                            <td className="font-bold">{row.studentName}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                {STATUS_OPTIONS.map(s => (
                                  <button
                                    key={s}
                                    onClick={() => setStatus(row.studentId, s)}
                                    style={{
                                      padding: '4px 10px',
                                      borderRadius: 'var(--radius-sm)',
                                      border: `1.5px solid ${row.status === s ? STATUS_STYLE[s].color : 'var(--border)'}`,
                                      background: row.status === s ? STATUS_STYLE[s].color + '22' : 'transparent',
                                      color: row.status === s ? STATUS_STYLE[s].color : 'var(--text-muted)',
                                      fontWeight: row.status === s ? 600 : 400,
                                      fontSize: 12,
                                      cursor: 'pointer',
                                      transition: 'all 0.12s',
                                    }}
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            </td>
                            <td>
                              <input
                                className="form-input"
                                style={{ padding: '4px 8px', fontSize: 13, minWidth: 140 }}
                                placeholder="Optional note…"
                                value={row.notes ?? ''}
                                onChange={e => setNotes(row.studentId, e.target.value)}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Attendance'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Summary Tab */}
        {tab === 'summary' && (
          <div className="card">
            {loadingSummary ? (
              <div className="spinner-wrap"><div className="spinner" /></div>
            ) : summary.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-title">No attendance data</div>
                <div className="empty-state-text">Mark attendance for this class first.</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Days Recorded</th>
                      <th>Present</th>
                      <th>Absent</th>
                      <th>Late</th>
                      <th>Excused</th>
                      <th>Attendance Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((row, i) => (
                      <tr key={row.studentId}>
                        <td className="text-muted text-sm">{i + 1}</td>
                        <td className="font-bold">{row.studentName}</td>
                        <td>{row.total}</td>
                        <td><span className="badge badge-success">{row.present}</span></td>
                        <td><span className="badge badge-danger">{row.absent}</span></td>
                        <td><span className="badge badge-warning">{row.late}</span></td>
                        <td><span className="badge badge-info">{row.excused}</span></td>
                        <td>
                          {row.rate !== null ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{
                                height: 6, width: 80, background: 'var(--border)', borderRadius: 3, overflow: 'hidden',
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${row.rate}%`,
                                  background: row.rate >= 90 ? '#10b981' : row.rate >= 75 ? '#f59e0b' : '#ef4444',
                                  borderRadius: 3,
                                  transition: 'width 0.4s',
                                }} />
                              </div>
                              <span style={{
                                fontWeight: 600,
                                color: row.rate >= 90 ? '#10b981' : row.rate >= 75 ? '#f59e0b' : '#ef4444',
                                fontSize: 13,
                              }}>
                                {row.rate}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
