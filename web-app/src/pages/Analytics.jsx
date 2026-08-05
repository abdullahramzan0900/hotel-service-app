import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getAnalytics } from '../api/client';
import '../styles/analytics.scss';

const RANGE_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '14 days', value: 14 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 }
];

const PRIORITY_COLORS = { urgent: '#e11d3c', normal: '#2c4675' };
const TYPE_COLORS = { room_service: '#c8a45e', issue: '#d98c2b' };

function formatDay(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export default function Analytics() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState(null);

  useEffect(() => {
    getAnalytics(days).then(setData);
  }, [days]);

  if (!data) return null;

  const revenueChartData = data.revenueByDay.map((d) => ({ date: formatDay(d._id), revenue: d.revenue }));
  const requestsChartData = data.requestsByDay.map((d) => ({ date: formatDay(d._id), count: d.count }));

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div>
          <h1>Analytics & Reports</h1>
          <p className="muted">Revenue and request trends across the hotel.</p>
        </div>
        <div className="range-select">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={days === opt.value ? 'active' : ''}
              onClick={() => setDays(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-box card">
          <div className="stat-box-label">Total Revenue (all time, approved orders)</div>
          <div className="stat-box-value">£{data.totalRevenueAllTime.toFixed(2)}</div>
        </div>
        <div className="stat-box card">
          <div className="stat-box-label">Requests in range</div>
          <div className="stat-box-value">{data.requestsByDay.reduce((s, d) => s + d.count, 0)}</div>
        </div>
        <div className="stat-box card">
          <div className="stat-box-label">Orders in range</div>
          <div className="stat-box-value">{data.ordersByStatus.reduce((s, d) => s + d.count, 0)}</div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-card card">
          <h3>Revenue by Day (Approved Orders)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `£${v}`} />
              <Tooltip formatter={(v) => [`£${v.toFixed(2)}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#c8a45e" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card card">
          <h3>Guest Requests by Day</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={requestsChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#16233d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card card">
          <h3>Requests by Type</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.requestsByType}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={75}
                label={(entry) => `${entry._id === 'room_service' ? 'Room Service' : 'Issue'}: ${entry.count}`}
              >
                {data.requestsByType.map((entry) => (
                  <Cell key={entry._id} fill={TYPE_COLORS[entry._id] || '#7a8290'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card card">
          <h3>Requests by Priority</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data.requestsByPriority}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={75}
                label={(entry) => `${entry._id}: ${entry.count}`}
              >
                {data.requestsByPriority.map((entry) => (
                  <Cell key={entry._id} fill={PRIORITY_COLORS[entry._id] || '#7a8290'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card top-items-card">
        <h3>Top Selling Items</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.topItems.length === 0 && (
              <tr><td colSpan={3} className="empty-row">No approved orders in this range yet.</td></tr>
            )}
            {data.topItems.map((item) => (
              <tr key={item._id}>
                <td><strong>{item._id}</strong></td>
                <td>{item.quantitySold}</td>
                <td>£{item.revenue.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
