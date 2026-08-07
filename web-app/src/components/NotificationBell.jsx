import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, UtensilsCrossed, TriangleAlert } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import '../styles/notifications.scss';

const TYPE_ICON = {
  room_service: <BellRing size={15} />,
  issue: <TriangleAlert size={15} />,
  order: <UtensilsCrossed size={15} />
};

const TYPE_LABEL = {
  room_service: 'Room Service',
  issue: 'Issue Reported',
  order: 'Food Order'
};

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) markAllRead(); // opening the panel = "seen", per the requested behavior
      return next;
    });
  };

  // Close when clicking outside the panel
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleNotificationClick = (item) => {
    setOpen(false);
    navigate(item.type === 'order' ? '/admin/orders' : '/admin/requests');
  };

  return (
    <div className="notification-bell" ref={panelRef}>
      <button className="bell-btn" onClick={toggleOpen} aria-label="Notifications">
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="bell-panel">
          <div className="bell-panel-header">Recent Activity</div>
          {notifications.length === 0 ? (
            <div className="bell-empty">Nothing yet - new requests and orders will show up here.</div>
          ) : (
            <div className="bell-list">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className={`bell-item ${n.priority === 'urgent' ? 'urgent' : ''}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <span className="bell-item-icon">{TYPE_ICON[n.type]}</span>
                  <span className="bell-item-body">
                    <span className="bell-item-title">
                      {TYPE_LABEL[n.type]} · Room {n.roomNumber}
                    </span>
                    <span className="bell-item-sub">{n.guestName} — {n.message}</span>
                  </span>
                  <span className="bell-item-time">{timeAgo(n.createdAt)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}