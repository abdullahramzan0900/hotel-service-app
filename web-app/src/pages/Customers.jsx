import { useEffect, useState } from 'react';
import { Users, Search, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { getCustomers, retryFailedCustomers } from '../api/client';
import '../styles/table-page.scss';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const SYNC_ICON = {
  synced: <CheckCircle2 size={14} />,
  failed: <XCircle size={14} />,
  pending: <Clock size={14} />
};

const SYNC_BADGE_CLASS = {
  synced: 'approved',
  failed: 'rejected',
  pending: 'pending'
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [retrying, setRetrying] = useState(false);
  const [retryResult, setRetryResult] = useState(null);

  const load = () => {
    const params = search ? { page, search } : { page };
    getCustomers(params).then((res) => {
      setCustomers(res.data);
      setPages(res.pages);
      setTotalCustomers(res.totalCustomers);
    });
  };

  useEffect(() => setPage(1), [search]);

  // Debounce so typing doesn't fire a request on every keystroke; page changes
  // (Prev/Next) still go through this same effect, just with a tiny delay.
  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  const failedCount = customers.filter((c) => c.mailchimpStatus === 'failed').length;

  const handleRetryFailed = async () => {
    setRetrying(true);
    setRetryResult(null);
    try {
      const result = await retryFailedCustomers();
      setRetryResult(result);
      load(); // refresh the table to show updated statuses
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="table-page">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p className="muted">
            Every unique guest who has contacted the hotel, deduplicated by email.
            {totalCustomers > 0 && ` ${totalCustomers} total.`}
          </p>
        </div>
        {failedCount > 0 && (
          <button className="btn btn-primary" onClick={handleRetryFailed} disabled={retrying}>
            {retrying ? <span className="spinner" /> : <RefreshCw size={15} />}
            {retrying ? 'Retrying...' : 'Retry All Failed'}
          </button>
        )}
      </div>

      {retryResult && (
        <div className="retry-result">
          Retried {retryResult.attempted} customer{retryResult.attempted !== 1 ? 's' : ''} —{' '}
          <strong>{retryResult.succeeded} succeeded</strong>
          {retryResult.stillFailed > 0 && <>, {retryResult.stillFailed} still failed</>}.
        </div>
      )}

      <div className="customer-search">
        <Search size={16} />
        <input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {customers.length === 0 ? (
        <div className="card empty-state">
          <Users size={40} className="empty-state-icon" />
          <h3>No customers yet</h3>
          <p className="muted">Guests will appear here as soon as they submit a request or order.</p>
        </div>
      ) : (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Visits</th>
                <th>First Seen</th>
                <th>Last Seen</th>
                <th>Mailchimp</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.totalRequests}</td>
                  <td className="sub-text">{formatDate(c.firstSeen)}</td>
                  <td className="sub-text">{formatDate(c.lastSeen)}</td>
                  <td>
                    <span className={`badge ${SYNC_BADGE_CLASS[c.mailchimpStatus]}`} title={c.mailchimpError || ''}>
                      {SYNC_ICON[c.mailchimpStatus]} {c.mailchimpStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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