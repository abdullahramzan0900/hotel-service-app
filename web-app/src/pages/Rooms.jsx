import { useEffect, useState } from 'react';
import { Hotel, Download, QrCode, LogIn, LogOut, Trash2, X, Plus } from 'lucide-react';
import { getRooms, createRoom, getRoomQr, checkinRoom, checkoutRoom, deleteRoom } from '../api/client';
import '../styles/rooms.scss';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [qrModal, setQrModal] = useState(null); // { roomNumber, qrDataUrl, url }
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const load = () => getRooms().then(setRooms);

  useEffect(() => { load(); }, []);

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!newRoomNumber) return;
    setError('');
    try {
      await createRoom(Number(newRoomNumber));
      setNewRoomNumber('');
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not add room.');
    }
  };

  const handleViewQr = async (id) => {
    const data = await getRoomQr(id);
    setQrModal(data);
  };

  const handleCheckin = async (id) => {
    setBusyId(id);
    try { await checkinRoom(id); load(); } finally { setBusyId(null); }
  };

  const handleCheckout = async (id) => {
    if (!window.confirm('Check out this room? This resets the bill and marks it inactive.')) return;
    setBusyId(id);
    try { await checkoutRoom(id); load(); } finally { setBusyId(null); }
  };

  const handleDelete = async (id, roomNumber) => {
    if (!window.confirm(`Delete Room ${roomNumber}? Its QR code will stop working immediately. This cannot be undone.`)) return;
    setBusyId(id);
    try { await deleteRoom(id); load(); } finally { setBusyId(null); }
  };

  return (
    <div className="rooms-page">
      <div className="page-header">
        <div>
          <h1>Rooms</h1>
          <p className="muted">Add your hotel's real rooms here — each one gets its own permanent, downloadable QR code.</p>
        </div>
        <form className="add-room-form" onSubmit={handleAddRoom}>
          <input
            type="number"
            placeholder="Room number"
            value={newRoomNumber}
            onChange={(e) => setNewRoomNumber(e.target.value)}
          />
          <button className="btn btn-primary" type="submit"><Plus size={16} /> Add Room</button>
        </form>
      </div>

      {error && <div className="room-error">{error}</div>}

      {rooms.length === 0 ? (
        <div className="card empty-state">
          <Hotel size={40} className="empty-state-icon" />
          <h3>No rooms yet</h3>
          <p className="muted">Add your first room above (e.g. "101") to generate its QR code.</p>
        </div>
      ) : (
        <div className="room-grid">
          {rooms.map((r) => (
            <div className="room-card card" key={r.id}>
              <div className="room-card-top">
                <span className="room-number">Room {r.roomNumber}</span>
                <span className={`badge ${r.status}`}>{r.status}</span>
              </div>
              <div className="room-bill">
                Current bill: <strong>£{r.currentBillTotal.toFixed(2)}</strong>
              </div>
              <div className="room-actions">
                <button className="btn btn-outline" onClick={() => handleViewQr(r.id)}>
                  <QrCode size={15} /> View QR
                </button>
                {r.status === 'inactive' ? (
                  <button className="btn btn-success" disabled={busyId === r.id} onClick={() => handleCheckin(r.id)}>
                    <LogIn size={15} /> Check In
                  </button>
                ) : (
                  <button className="btn btn-danger" disabled={busyId === r.id} onClick={() => handleCheckout(r.id)}>
                    <LogOut size={15} /> Check Out
                  </button>
                )}
              </div>
              <button
                className="room-delete-link"
                disabled={busyId === r.id}
                onClick={() => handleDelete(r.id, r.roomNumber)}
              >
                <Trash2 size={13} /> Delete room
              </button>
            </div>
          ))}
        </div>
      )}

      {qrModal && (
        <div className="qr-modal-backdrop" onClick={() => setQrModal(null)}>
          <div className="qr-modal card" onClick={(e) => e.stopPropagation()}>
            <button className="qr-modal-close" onClick={() => setQrModal(null)} aria-label="Close">
              <X size={18} />
            </button>
            <h3>Room {qrModal.roomNumber} QR Code</h3>
            <img src={qrModal.qrDataUrl} alt={`QR code for Room ${qrModal.roomNumber}`} />
            <p className="qr-url">{qrModal.url}</p>
            <p className="qr-note">This code is permanent — print once, it never needs to change.</p>
            <a
              className="btn btn-primary"
              href={qrModal.qrDataUrl}
              download={`room-${qrModal.roomNumber}-qr-code.png`}
            >
              <Download size={16} /> Download QR Code
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
