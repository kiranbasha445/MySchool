import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

interface PublicStats { students: number; classes: number; achievements: number; marks: number }
interface Achievement { id: number; title: string; description: string; studentName?: string }

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#3b82f6,#6366f1)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
];

const TROPHY = ['🏆','🥇','🎖️','🌟','🎓','🏅','💡','🚀','⭐','🎯','🔥','✨'];
const FEATURES = [
  { icon: '📊', title: 'Academic Tracking',    desc: 'Real-time marks across all subjects and terms, with visual performance analytics.' },
  { icon: '👥', title: 'Student Profiles',      desc: 'Manage 100s of students across multiple classes with rich profile data.' },
  { icon: '🏆', title: 'Achievement Wall',      desc: 'Celebrate student milestones, competition wins, and outstanding performance.' },
  { icon: '👨‍👩‍👧', title: 'Parent Portal',      desc: 'Parents stay connected with their child\'s progress anytime, anywhere.' },
  { icon: '🏫', title: 'Class Management',      desc: 'Visual interactive classroom views with 40-seat layouts and real-time occupancy.' },
  { icon: '🔐', title: 'Role-Based Access',     desc: 'Principals, teachers, students and parents each see exactly what they need.' },
];

/* ── Count-up hook ──────────────────────────────────────────── */
function useCountUp(end: number | undefined, duration = 1800) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    // Guard: if end is undefined/NaN/0 skip animation
    const target = Number(end);
    if (!end || isNaN(target)) return;

    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || triggered.current) return;
      triggered.current = true;
      obs.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.floor(eased * target));
        if (t < 1) requestAnimationFrame(tick);
        else setValue(target);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);

  return { value, ref };
}

/* ── Fade-in on scroll ──────────────────────────────────────── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ── Stat number ─────────────────────────────────────────────── */
function StatNum({ end, suffix = '' }: { end: number | undefined; suffix?: string }) {
  const { value, ref } = useCountUp(end);
  return <span ref={ref} className="hero-stat-value">{(value ?? 0).toLocaleString()}{suffix}</span>;
}

export default function Landing() {
  const [stats, setStats]             = useState<PublicStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  const sec1 = useFadeIn();
  const sec2 = useFadeIn();
  const sec3 = useFadeIn();

  useEffect(() => {
    API.get<PublicStats>('/Public/stats')
      .then((r) => setStats(r.data))
      .catch(() => setStats({ students: 100, classes: 10, achievements: 10, marks: 1950 }));

    API.get<Achievement[]>('/Public/achievements')
      .then((r) => setAchievements(r.data))
      .catch(() => setAchievements([]));
  }, []);

  // Double the list so the CSS marquee loops seamlessly
  const ticker = [...achievements, ...achievements];

  return (
    <div className="public-page">

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="landing-nav">
        <a href="/" className="landing-nav-brand">
          <div className="landing-nav-icon">🎓</div>
          MySchool
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/classes" className="btn-hero-ghost" style={{ padding: '9px 18px', fontSize: 14 }}>
            🏫 Classrooms
          </Link>
          <Link to="/login" className="btn-hero-primary" style={{ padding: '9px 20px', fontSize: 14 }}>
            Staff Login →
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-badge">🎓 Welcome to MySchool</div>

        <h1 className="hero-title">
          Where Every Student<br />
          <span className="hero-title-grad">Reaches Their Potential</span>
        </h1>

        <p className="hero-sub">
          A modern school management portal uniting students, parents, teachers
          and principals in one beautiful, intelligent platform.
        </p>

        <div className="hero-cta">
          <Link to="/login" className="btn-hero-primary">Get Started →</Link>
          <Link to="/classes" className="btn-hero-ghost">🏫 View Classrooms</Link>
          <a href="#achievements" className="btn-hero-ghost">View Achievements</a>
        </div>

        {stats && (
          <div className="hero-stats">
            <div className="hero-stat">
              <StatNum end={stats.students} />
              <div className="hero-stat-label">Students</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <StatNum end={stats.classes} />
              <div className="hero-stat-label">Classes</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <StatNum end={stats.achievements} />
              <div className="hero-stat-label">Achievements</div>
            </div>
            <div className="hero-stat-divider" />
            <div className="hero-stat">
              <StatNum end={stats.marks} />
              <div className="hero-stat-label">Marks Recorded</div>
            </div>
          </div>
        )}

        <div className="scroll-indicator">
          <div className="scroll-indicator-arrow">↓</div>
          scroll
        </div>
      </section>

      {/* ── Achievements Ticker ──────────────────────────────── */}
      {achievements.length > 0 && (
        <div id="achievements" className="ticker-section">
          <div className="ticker-label">🏆 Achievements</div>
          <div style={{ paddingLeft: 160 }}>
            <div className="ticker-track">
              {ticker.map((a, i) => (
                <div key={`${a.id}-${i}`} className="ticker-item">
                  <span className="ticker-icon">{TROPHY[i % TROPHY.length]}</span>
                  <span className="ticker-text">{a.title}</span>
                  {a.studentName && (
                    <span className="ticker-student">· {a.studentName}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="ticker-fade-l" />
          <div className="ticker-fade-r" />
        </div>
      )}

      {/* ── Features ─────────────────────────────────────────── */}
      <div ref={sec1} className="fade-in-section" style={{ background: '#07101f', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="landing-section">
          <div className="section-label">Why MySchool</div>
          <h2 className="section-title">Everything you need<br />in one place</h2>
          <p className="section-sub">From classroom seating charts to parent progress reports — MySchool handles it all.</p>
          <div className="features-grid">
            {FEATURES.map((f) => (
              <div key={f.title} className="feature-card">
                <div className="feature-card-icon">{f.icon}</div>
                <div className="feature-card-title">{f.title}</div>
                <div className="feature-card-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top Students ────────────────────────────────────── */}
      <div ref={sec2} className="fade-in-section" style={{ background: '#05091a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="landing-section">
          <div className="section-label">Star Performers</div>
          <h2 className="section-title">Celebrating Excellence</h2>
          <p className="section-sub">Our students consistently push boundaries and set new standards.</p>
          <div className="students-strip">
            {Array.from({ length: 6 }, (_, i) => {
              const names = ['Ahmed Hassan','Sara Ali','Emily Johnson','Marcus Williams','Priya Sharma','Omar Abdullah'];
              const classes = ['Class 10','Class 9','Class 8','Class 10','Class 7','Class 9'];
              const scores  = [96, 94, 92, 91, 89, 88];
              return (
                <div key={i} className="student-showcase-card">
                  <div className="showcase-avatar" style={{ background: AVATAR_GRADIENTS[i] }}>
                    {names[i].split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="showcase-name">{names[i]}</div>
                  <div className="showcase-class">{classes[i]}</div>
                  <div className="showcase-score">{scores[i]}%</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CTA footer ───────────────────────────────────────── */}
      <div ref={sec3} className="fade-in-section landing-cta">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-label" style={{ justifyContent: 'center', display: 'flex' }}>Get Started Today</div>
          <h2 className="section-title" style={{ textAlign: 'center' }}>
            Ready to transform<br />your school?
          </h2>
          <p className="section-sub" style={{ color: 'rgba(255,255,255,0.55)', margin: '0 auto 36px', textAlign: 'center' }}>
            Log in with your staff credentials to access the full management portal.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Link to="/login" className="btn-hero-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
              Staff Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
