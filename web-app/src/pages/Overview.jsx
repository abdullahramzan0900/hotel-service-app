import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, AlertCircle, UtensilsCrossed, Hotel, ArrowRight } from 'lucide-react';
import { getStats } from '../api/client';
import '../styles/overview.scss';

export default function Overview() {
  const [stats, setStats] = useState(null);

  const load = () => getStats().then(setStats);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000); // light polling backup to sockets
    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  const cards = [
    { label: 'New Requests', value: stats.newRequests, icon: BellRing, to: '/admin/requests', tone: 'navy' },
    { label: 'Urgent Items', value: stats.urgentRequests, icon: AlertCircle, to: '/admin/requests', tone: 'urgent' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: UtensilsCrossed, to: '/admin/orders', tone: 'gold' },
    { label: 'Active Rooms', value: `${stats.activeRooms} / ${stats.totalRooms}`, icon: Hotel, to: '/admin/rooms', tone: 'navy' }
  ];

  const quickLinks = [
    { to: '/admin/requests', label: 'Review guest requests' },
    { to: '/admin/orders', label: 'Approve pending food orders' },
    { to: '/admin/rooms', label: 'Check guests in / out' },
    { to: '/admin/menu', label: 'Manage the menu' },
    { to: '/admin/analytics', label: 'View analytics & reports' }
  ];

  return (
    <div className="overview-page">
      <div className="page-header">
        <div>
          <h1>Overview</h1>
          <p className="muted">Live snapshot of guest activity across the hotel.</p>
        </div>
      </div>

      <div className="stat-grid">
        {cards.map((c) => (
          <Link to={c.to} className={`stat-card tone-${c.tone}`} key={c.label}>
            <span className="stat-icon"><c.icon size={22} /></span>
            <div>
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="quick-links card">
        <h3>Quick Actions</h3>
        <div className="quick-links-grid">
          {quickLinks.map((q) => (
            <Link to={q.to} className="quick-link" key={q.to}>
              {q.label} <ArrowRight size={14} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
