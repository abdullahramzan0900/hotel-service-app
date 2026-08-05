import { useEffect, useState } from 'react';
import { getRequests, updateRequestStatus } from '../api/client';
import { useSocket } from '../api/socket';
import '../styles/table-page.scss';

const TABS = [
  { key: 'new', label: 'New' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'all', label: 'All' }
];

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('new');
  const [updating, setUpdating] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = () => {
    const params = tab === 'all' ? { page } : { status: tab, page };
    getRequests(params).then((res) => {
      setRequests(res.data);
      setPages(res.pages);
    });
  };

  useEffect(load, [tab, page]);
  useEffect(() => setPage(1), [tab]);

  useSocket({
    onNewRequest: () => load(),
    onRequestUpdated: () => load()
  });

  const handleStatusChange = async (id, status) => {
    setUpdating(id);
    try {
      await updateRequestStatus(id, status);
      load();
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="table-page">
      <div className="page-header">
        <div>
          <h1>Guest Requests</h1>
          <p className="muted">Room service requests and reported issues.</p>
        </div>
      </div>

      <div className="filter-tabs">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Room</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Guest</th>
              <th>Message</th>
              <th>Received</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr><td colSpan={8} className="empty-row">No requests here.</td></tr>
            )}
            {requests.map((r) => (
              <tr key={r.id} className={r.priority === 'urgent' && r.status !== 'resolved' ? 'row-urgent' : ''}>
                <td><strong>Room {r.roomNumber}</strong></td>
                <td>{r.type === 'room_service' ? 'Room Service' : 'Issue'}</td>
                <td><span className={`badge ${r.priority}`}>{r.priority}</span></td>
                <td>
                  <div>{r.guestName}</div>
                  <div className="sub-text">{r.guestPhone}</div>
                </td>
                <td className="message-cell">{r.message}</td>
                <td className="sub-text">{timeAgo(r.createdAt)}</td>
                <td><span className={`badge ${r.status}`}>{r.status.replace('_', ' ')}</span></td>
                <td>
                  <select
                    value={r.status}
                    disabled={updating === r.id}
                    onChange={(e) => handleStatusChange(r.id, e.target.value)}
                    className="status-select"
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="pagination">
          <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="btn btn-outline" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
