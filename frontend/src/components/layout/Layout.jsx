import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/auth.jsx';
import { LayoutDashboard, Package, MapPin, Tag, Users, LogOut, Shield, UserCircle } from 'lucide-react';

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

  const navLinkStyle = ({ isActive }) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: 'var(--r-sm)',
    fontSize: 13, fontWeight: 600,
    color: isActive ? 'var(--accent)' : 'var(--text-2)',
    background: isActive ? 'var(--accent-sub)' : 'transparent',
    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
    transition: 'all .1s', textDecoration: 'none',
  });

  return (
    <div className="app-shell">
      {/* Desktop sidebar */}
      <aside className="sidebar">
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', background: 'var(--accent-sub)', border: '1px solid var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={15} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-.01em', lineHeight: 1 }}>FamilyVault</div>
              <div style={{ fontSize: 9, color: 'var(--text-3)', marginTop: 2, letterSpacing: '.07em', textTransform: 'uppercase' }}>Inventory</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} style={navLinkStyle}>
              <Icon size={15} /> {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding: '12px 12px', borderTop: '1px solid var(--border)' }}>
          <NavLink to="/profile" style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
            borderRadius: 'var(--r-sm)', textDecoration: 'none', marginBottom: 8,
            background: isActive ? 'var(--accent-sub)' : 'transparent',
            transition: 'background .1s',
          })}>
            <UserCircle size={28} color="var(--text-3)" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)' }} className="truncate">{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--mono)' }} className="truncate">{user?.email}</div>
            </div>
          </NavLink>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
            borderRadius: 'var(--r-sm)', background: 'transparent', color: 'var(--text-3)',
            fontSize: 12, fontWeight: 600, border: '1px solid var(--border)', width: '100%', cursor: 'pointer',
          }}
            onMouseEnter={e => { e.currentTarget.style.color='var(--red)'; e.currentTarget.style.borderColor='var(--red)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='var(--text-3)'; e.currentTarget.style.borderColor='var(--border)'; }}
          >
            <LogOut size={13} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Mobile topbar */}
        <div className="mobile-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield size={15} color="var(--accent)" />
            <span style={{ fontWeight: 800, fontSize: 14 }}>FamilyVault</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <NavLink to="/profile" style={{ color: 'var(--text-3)', display: 'flex', padding: 4 }}><UserCircle size={20} /></NavLink>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-3)', display: 'flex', alignItems: 'center', padding: 4, cursor: 'pointer' }}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <Outlet />
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        <div className="mobile-nav-items">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
              <Icon size={20} /><span>{label}</span>
            </NavLink>
          ))}
          <NavLink to="/profile" className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}>
            <UserCircle size={20} /><span>Profile</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
