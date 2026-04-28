import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth.jsx';
import { LayoutDashboard, Package, MapPin, Tag, Users, LogOut, Shield } from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { to: '/',           icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/inventory',  icon: Package,          label: 'Inventory' },
    { to: '/locations',  icon: MapPin,           label: 'Locations' },
    { to: '/categories', icon: Tag,              label: 'Categories' },
    ...(user?.is_admin ? [{ to: '/users', icon: Users, label: 'Users' }] : []),
  ];

  return (
    <div className="app-shell">

      {/* ── Desktop sidebar ── */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--r-sm)',
              background: 'var(--accent-bg)', border: '1px solid var(--accent-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Shield size={16} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', lineHeight: 1 }}>FamilyVault</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Inventory</div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 'var(--r-sm)',
              fontSize: 13, fontWeight: 600,
              color: isActive ? 'var(--accent)' : 'var(--text-2)',
              background: isActive ? 'var(--accent-bg)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.1s', textDecoration: 'none',
            })}>
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 1, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{user?.name}</div>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
            borderRadius: 'var(--r-sm)', background: 'transparent',
            color: 'var(--text-3)', fontSize: 12, fontWeight: 600,
            border: '1px solid var(--border)', width: '100%', cursor: 'pointer',
            transition: 'all 0.1s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="main-content">

        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={16} color="var(--accent)" />
            <span style={{ fontWeight: 800, fontSize: 15 }}>FamilyVault</span>
          </div>
          <button onClick={handleLogout} style={{
            background: 'none', border: 'none', color: 'var(--text-3)',
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, padding: '6px 8px',
          }}>
            <LogOut size={14} /> Out
          </button>
        </div>

        <Outlet />
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="mobile-nav">
        <div className="mobile-nav-items">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

    </div>
  );
}
