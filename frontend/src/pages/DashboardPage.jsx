import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/client';
import { Package, DollarSign, TrendingUp, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const STATUS_COLORS = {
  Active: 'var(--success)',
  Sold: 'var(--info)',
  Transferred: '#9b72c8',
  Lost: 'var(--warning)',
  Stolen: 'var(--danger)',
};

function fmt(n) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(n || 0);
}

function StatCard({ icon: Icon, label, value, sub, accent = false }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{
        width: 42, height: 42, borderRadius: 'var(--radius)',
        background: accent ? 'var(--success-bg)' : 'var(--accent-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        border: `1px solid ${accent ? 'rgba(90,158,110,0.2)' : 'rgba(200,169,110,0.15)'}`,
      }}>
        <Icon size={18} color={accent ? 'var(--success)' : 'var(--accent)'} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 11, color: 'var(--text-muted)', marginBottom: 4,
          fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '8px 12px', fontSize: 12,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div>Count: <strong>{payload[0]?.value}</strong></div>
      {payload[1] && <div>Value: <strong>{fmt(payload[1]?.value)}</strong></div>}
    </div>
  );
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get().then(r => r.data),
  });

  if (isLoading) {
    return (
      <div style={{ padding: 28, display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  const { summary, by_status, by_location, recent_items } = data || {};
  const gain = (summary?.total_value || 0) - (summary?.total_purchase_amount || 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your family inventory</p>
        </div>
      </div>

      {/* Stat grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <StatCard icon={Package} label="Total Items" value={summary?.total_items || 0} />
        <StatCard icon={DollarSign} label="Current Value" value={fmt(summary?.total_value)} />
        <StatCard icon={TrendingUp} label="Purchase Cost" value={fmt(summary?.total_purchase_amount)} />
        <StatCard
          icon={Activity}
          label="Value Change"
          value={fmt(Math.abs(gain))}
          sub={gain >= 0 ? '↑ Appreciated' : '↓ Depreciated'}
          accent={gain >= 0}
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Status breakdown */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Items by Status</h3>
          {by_status?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={by_status} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis
                  dataKey="status"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-display)' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false} tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {by_status?.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || 'var(--accent)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Location breakdown */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 700 }}>Items by Location</h3>
          {by_location?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No locations assigned yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {by_location?.slice(0, 7).map(loc => (
                <div key={loc.location} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    fontSize: 12, color: 'var(--text-secondary)', width: 130,
                    flexShrink: 0, fontWeight: 600,
                  }} className="truncate">
                    {loc.location || 'Unassigned'}
                  </div>
                  <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(loc.count / (by_location[0]?.count || 1)) * 100}%`,
                      background: 'var(--accent)', borderRadius: 3,
                      transition: 'width 0.6s ease',
                    }} />
                  </div>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                    width: 24, textAlign: 'right', flexShrink: 0,
                  }}>{loc.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent items */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Recently Updated</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Owner</th>
                <th>Current Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent_items?.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>No items yet.</td></tr>
              )}
              {recent_items?.map(item => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/inventory/${item.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{item.owner_name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{fmt(item.current_value)}</td>
                  <td>
                    <span className={`badge badge-${item.status?.toLowerCase()}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
