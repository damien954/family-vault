import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth';
import {
  LayoutDashboard, Package, MapPin, Tag, Users, LogOut, Shield,
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/inventory', icon: Package, label: 'Inventory' },
    { to: '/locations', icon: MapPin, label: 'Locations' },
    { to: '/categories', icon: Tag, label: 'Categories' },
    ...(user?.is_admin ? [{ to: '/users', icon: Users, label: 'Users' }] : []),
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 'var(--sidebar-width)',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 20px 18px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-bg)', border: '1px solid var(--accent-dim)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Shield size={16} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em', lineHeight: 1 }}>FamilyVault</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Inventory</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: 600,
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-bg)' : 'transparent',
                transition: 'all 0.1s',
                textDecoration: 'none',
                borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              })}
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, fontFamily: 'var(--font-mono)' }}>{user?.email}</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>{user?.name}</div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
              borderRadius: 'var(--radius-sm)', background: 'transparent',
              color: 'var(--text-muted)', fontSize: 12, fontWeight: 600,
              border: '1px solid var(--border)', width: '100%', cursor: 'pointer',
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'var(--danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-base)' }}>
        <Outlet />
      </main>
    </div>
  );
}
