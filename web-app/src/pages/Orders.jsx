import { useEffect, useState } from 'react';
import { getOrders, approveOrder, rejectOrder } from '../api/client';
import { useSocket } from '../api/socket';
import '../styles/table-page.scss';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
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

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('pending');
  const [busyId, setBusyId] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = () => {
    const params = tab === 'all' ? { page } : { status: tab, page };
    getOrders(params).then((res) => {
      setOrders(res.data);
      setPages(res.pages);
    });
  };

  useEffect(load, [tab, page]);
  useEffect(() => setPage(1), [tab]);

  useSocket({
    onNewOrder: () => load(),
    onOrderUpdated: () => load()
  });

  const handleApprove = async (id) => {
    setBusyId(id);
    try {
      await approveOrder(id);
      load();
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Reason for rejecting this order (optional):') || '';
    setBusyId(id);
    try {
      await rejectOrder(id, reason);
      load();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="table-page">
      <div className="page-header">
        <div>
          <h1>Food Orders</h1>
          <p className="muted">Approve or reject orders before they're added to a guest's bill.</p>
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
              <th>Guest</th>
              <th>Items</th>
              <th>Total</th>
              <th>Received</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={7} className="empty-row">No orders here.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id}>
                <td><strong>Room {o.roomNumber}</strong></td>
                <td>
                  <div>{o.guestName}</div>
                  <div className="sub-text">{o.guestEmail}</div>
                </td>
                <td className="message-cell">
                  {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </td>
                <td><strong>£{o.totalPrice.toFixed(2)}</strong></td>
                <td className="sub-text">{timeAgo(o.createdAt)}</td>
                <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                <td>
                  {o.status === 'pending' && (
                    <div className="action-buttons">
                      <button className="btn btn-success" disabled={busyId === o.id} onClick={() => handleApprove(o.id)}>
                        Approve
                      </button>
                      <button className="btn btn-danger" disabled={busyId === o.id} onClick={() => handleReject(o.id)}>
                        Reject
                      </button>
                    </div>
                  )}
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
