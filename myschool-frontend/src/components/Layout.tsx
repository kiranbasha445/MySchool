import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { getUser, getInitials, logout } from '../utils/auth';

interface NavItem {
  to: string;
  icon: string;
  label: string;
}

const navByRole: Record<string, NavItem[]> = {
  Principal: [
    { to: '/dashboard',    icon: '▦',  label: 'Dashboard' },
    { to: '/students',     icon: '👥', label: 'Students' },
    { to: '/classes',      icon: '🏫', label: 'Classes' },
    { to: '/marks',        icon: '📊', label: 'Marks' },
    { to: '/attendance',   icon: '📋', label: 'Attendance' },
    { to: '/achievements', icon: '🏆', label: 'Achievements' },
    { to: '/users',        icon: '🔑', label: 'Manage Accounts' },
  ],
  Teacher: [
    { to: '/dashboard',    icon: '▦',  label: 'Dashboard' },
    { to: '/students',     icon: '👥', label: 'Students' },
    { to: '/marks',        icon: '📊', label: 'Marks' },
    { to: '/attendance',   icon: '📋', label: 'Attendance' },
    { to: '/achievements', icon: '🏆', label: 'Achievements' },
    { to: '/users',        icon: '🔑', label: 'Manage Accounts' },
  ],
  Student: [
    { to: '/dashboard',    icon: '▦',  label: 'Dashboard' },
    { to: '/classes',      icon: '🏫', label: 'Classrooms' },
    { to: '/my-marks',     icon: '📊', label: 'My Marks' },
    { to: '/achievements', icon: '🏆', label: 'Achievements' },
  ],
  Parent: [
    { to: '/dashboard',    icon: '▦',  label: 'Dashboard' },
    { to: '/classes',      icon: '🏫', label: 'Classrooms' },
    { to: '/my-child',     icon: '👧', label: "My Child's Progress" },
    { to: '/achievements', icon: '🏆', label: 'Achievements' },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const role = user?.role ?? 'Student';
  const navItems = navByRole[role] ?? navByRole.Student;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🎓</div>
          <div>
            <div className="sidebar-logo-text">MySchool</div>
            <div className="sidebar-logo-sub">Management Portal</div>
          </div>
        </div>

        {/* User info */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">{getInitials(user?.name ?? 'U')}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name truncate">{user?.name}</div>
            <span className={`role-badge ${role.toLowerCase()}`}>{role}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link${isActive || location.pathname === item.to ? ' active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="nav-link" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-area">
        {children}
      </div>
    </div>
  );
}
