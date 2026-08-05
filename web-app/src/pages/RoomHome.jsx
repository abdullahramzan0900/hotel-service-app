import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Gem, BellRing, UtensilsCrossed, TriangleAlert } from 'lucide-react';
import { getRoom } from '../api/client';
import '../styles/roomHome.scss';

export default function RoomHome() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | inactive | invalid

  useEffect(() => {
    getRoom(token)
      .then((data) => {
        setRoom(data);
        setStatus(data.status === 'active' ? 'ok' : 'inactive');
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="page room-home">
        <div className="page-content center-content">
          <div className="loader-dot" />
          <p>Loading your room...</p>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="page room-home">
        <div className="page-content center-content">
          <h2>QR Code Not Recognized</h2>
          <p className="muted">Please contact reception for assistance.</p>
        </div>
      </div>
    );
  }

  if (status === 'inactive') {
    return (
      <div className="page room-home">
        <div className="page-content center-content">
          <div className="crest"><Gem size={38} /></div>
          <h2>Room Not Currently Active</h2>
          <p className="muted">
            This room isn't checked in yet. Please contact reception if you believe this is a mistake.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page room-home fade-in">
      <div className="hero">
        <span className="hero-eyebrow">Welcome to</span>
        <h1 className="hero-title">Grand Sapphire Hotel</h1>
        <div className="room-chip">Room {room.roomNumber}</div>
      </div>

      <div className="page-content">
        <p className="section-label">How can we help?</p>

        <div className="option-grid">
          <button className="option-card" onClick={() => navigate(`/r/${token}/service`)}>
            <span className="option-icon"><BellRing size={24} /></span>
            <span className="option-title">Room Service</span>
            <span className="option-sub">Towels, cleaning, amenities</span>
          </button>

          <button className="option-card" onClick={() => navigate(`/r/${token}/order`)}>
            <span className="option-icon"><UtensilsCrossed size={24} /></span>
            <span className="option-title">Order Food</span>
            <span className="option-sub">Browse our menu</span>
          </button>

          <button className="option-card" onClick={() => navigate(`/r/${token}/issue`)}>
            <span className="option-icon"><TriangleAlert size={24} /></span>
            <span className="option-title">Report an Issue</span>
            <span className="option-sub">Something not right?</span>
          </button>
        </div>

        <p className="footer-note">Our team typically responds within a few minutes.</p>
      </div>
    </div>
  );
}
