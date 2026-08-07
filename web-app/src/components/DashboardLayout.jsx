import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BellRing,
  UtensilsCrossed,
  Hotel,
  ClipboardList,
  BarChart3,
  Users,
  Menu as MenuIcon,
  X,
  Gem,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';
import NotificationBell from './NotificationBell';
import '../styles/layout.scss';

const NAV_ITEMS = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/requests', label: 'Requests', icon: BellRing },
  { to: '/admin/orders', label: 'Food Orders', icon: UtensilsCrossed },
  { to: '/admin/rooms', label: 'Rooms', icon: Hotel },
  { to: '/admin/menu', label: 'Menu', icon: ClipboardList },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/customers', label: 'Customers', icon: Users }
];

export default function DashboardLayout() {
  const { username, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const handleSignOut = () => {
    signOut();
    navigate('/admin/login');
  };

  return (
    <NotificationProvider>
      <div className="dashboard-layout">
        <NotificationBell />
        <header className="mobile-topbar">
        <button className="hamburger-btn" onClick={() => setNavOpen(true)} aria-label="Open menu">
          <MenuIcon size={22} />
        </button>
        <span className="mobile-topbar-title">
          <Gem size={16} /> Grand Sapphire
        </span>
      </header>

      {navOpen && <div className="sidebar-backdrop" onClick={() => setNavOpen(false)} />}

      <div className="dashboard-body">
        <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
          <div className="brand">
            <span className="brand-icon"><Gem size={22} /></span>
            <div>
              <div className="brand-title">Grand Sapphire</div>
              <div className="brand-sub">Staff Dashboard</div>
            </div>
            <button className="sidebar-close-btn" onClick={() => setNavOpen(false)} aria-label="Close menu">
              <X size={18} />
            </button>
          </div>

          <nav className="nav-list">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <span className="nav-icon"><item.icon size={17} /></span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-chip">
              <span className="user-avatar">{username?.[0]?.toUpperCase() || 'A'}</span>
              <span>{username}</span>
            </div>
            <button className="btn btn-outline" onClick={handleSignOut}>
              <LogOut size={15} /> Sign Out
            </button>
          </div>
        </aside>

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
    </NotificationProvider>
  );
}