import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/client';
import { Package, Users, Shield, TrendingUp, TrendingDown, Clock, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const STATUS_COLORS = {
  Active: 'var(--success)', Sold: 'var(--info)',
  Transferred: '#9b72c8', Lost: 'var(--warning)', Stolen: 'var(--danger)',
};
const BAR_COLORS = ['var(--accent)', '#7ab8a0', '#7a9cc8', '#c8a07a', '#a07ac8', '#c87a8a'];

// ── Tiny reusable pieces ──────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color = 'var(--accent)' }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--radius)', flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={17} color={color} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
      {children}
    </div>
  );
}

function RankBar({ label, count, max, color = 'var(--accent)', rank }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', width: 14, flexShrink: 0, fontWeight: 700, textAlign: 'right' }}>
        {rank}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, width: 140, flexShrink: 0, color: 'var(--text-primary)' }} className="truncate">
        {label}
      </div>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${(count / max) * 100}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', width: 20, textAlign: 'right', flexShrink: 0 }}>
        {count}
      </div>
    </div>
  );
}

function FirearmRow({ item, sub, onClick }) {
  const display = [item.make, item.model].filter(Boolean).join(' ') || item.name || '—';
  return (
    <div
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13 }} className="truncate">{display}</div>
        {item.caliber && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{item.caliber}</div>}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>{sub}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 3 }}>{label}</div>
      <div>Count: <strong>{payload[0]?.value}</strong></div>
    </div>
  );
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ageLabel(years, months) {
  const y = parseInt(years || 0);
  const m = parseInt(months || 0);
  if (y === 0 && m === 0) return '< 1 month';
  if (y === 0) return `${m}mo`;
  if (m === 0) return `${y}yr`;
  return `${y}yr ${m}mo`;
}

// ── Main component ────────────────────────────────────────────────────────────

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

  const {
    summary = {},
    by_status = [],
    by_category = [],
    by_location = [],
    top_makes = [],
    least_makes = [],
    top_calibers = [],
    least_calibers = [],
    recently_acquired = [],
    longest_owned = [],
    recent_items = [],
  } = data || {};

  const topMakeMax = parseInt(top_makes[0]?.count || 1);
  const topCaliberMax = parseInt(top_calibers[0]?.count || 1);
  const locationMax = parseInt(by_location[0]?.count || 1);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Collection at a glance</p>
        </div>
      </div>

      {/* ── Top stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard icon={Package} label="Total Firearms" value={summary.total_items || 0} />
        <StatCard icon={Shield} label="Active" value={summary.active_items || 0} color="var(--success)" />
        <StatCard icon={Users} label="Owners" value={summary.total_owners || 0} color="var(--info)" />
        {by_category.map((c, i) => (
          <StatCard key={c.category} icon={Shield} label={c.category} value={c.count} color={BAR_COLORS[i % BAR_COLORS.length]} />
        ))}
      </div>

      {/* ── Row 1: Make stats + Caliber stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Make breakdown */}
        <div className="card">
          <SectionTitle>Brands in Collection</SectionTitle>
          {top_makes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet.</p>
          ) : (
            <>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={12} color="var(--success)" /> Most
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                {top_makes.map((m, i) => (
                  <RankBar key={m.make} rank={i + 1} label={m.make} count={parseInt(m.count)} max={topMakeMax} color="var(--accent)" />
                ))}
              </div>
              {least_makes.length > 0 && least_makes[0].make !== top_makes[0]?.make && (
                <>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingDown size={12} color="var(--danger)" /> Least
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {least_makes
                      .filter(m => !top_makes.slice(0, 2).find(t => t.make === m.make))
                      .map(m => (
                        <div key={m.make} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{m.make}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.count} firearm{m.count > 1 ? 's' : ''}</span>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Caliber breakdown */}
        <div className="card">
          <SectionTitle>Calibers in Collection</SectionTitle>
          {top_calibers.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet.</p>
          ) : (
            <>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={12} color="var(--success)" /> Most
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
                {top_calibers.map((c, i) => (
                  <RankBar key={c.caliber} rank={i + 1} label={c.caliber} count={parseInt(c.count)} max={topCaliberMax} color="var(--info)" />
                ))}
              </div>
              {least_calibers.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingDown size={12} color="var(--danger)" /> Least
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {least_calibers
                      .filter(c => !top_calibers.slice(0, 2).find(t => t.caliber === c.caliber))
                      .map(c => (
                        <div key={c.caliber} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{c.caliber}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.count} firearm{c.count > 1 ? 's' : ''}</span>
                        </div>
                      ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

      </div>

      {/* ── Row 2: Recently acquired + Longest owned ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Recently acquired */}
        <div className="card">
          <SectionTitle><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={12} /> Recently Acquired</span></SectionTitle>
          {recently_acquired.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No purchase dates recorded.</p>
          ) : (
            recently_acquired.map(item => (
              <FirearmRow
                key={item.id}
                item={item}
                sub={formatDate(item.purchase_date)}
                onClick={() => navigate(`/inventory/${item.id}`)}
              />
            ))
          )}
        </div>

        {/* Longest in collection */}
        <div className="card">
          <SectionTitle><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={12} /> Longest Owned</span></SectionTitle>
          {longest_owned.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No purchase dates recorded.</p>
          ) : (
            longest_owned.map(item => (
              <FirearmRow
                key={item.id}
                item={item}
                sub={ageLabel(item.years_owned, item.months_owned)}
                onClick={() => navigate(`/inventory/${item.id}`)}
              />
            ))
          )}
        </div>

      </div>

      {/* ── Row 3: Status chart + Location bars ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Status chart */}
        <div className="card">
          <SectionTitle>Status Breakdown</SectionTitle>
          {by_status.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={by_status} margin={{ top: 4, right: 0, bottom: 0, left: -24 }}>
                <XAxis dataKey="status" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {by_status.map(entry => <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || 'var(--accent)'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Storage locations */}
        <div className="card">
          <SectionTitle>By Storage Location</SectionTitle>
          {by_location.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No locations assigned.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {by_location.map((loc, i) => (
                <RankBar key={loc.location} rank={i + 1} label={loc.location} count={parseInt(loc.count)} max={locationMax} color="var(--accent-dim)" />
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── Row 4: Recently added to system ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <SectionTitle style={{ marginBottom: 0 }}>Recently Added to System</SectionTitle>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Firearm</th>
                <th>Caliber</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent_items.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No items yet.</td></tr>
              )}
              {recent_items.map(item => (
                <tr key={item.id} onClick={() => navigate(`/inventory/${item.id}`)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>
                    {[item.make, item.model].filter(Boolean).join(' ') || item.name || '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{item.caliber || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{item.category_name || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{item.owner_name}</td>
                  <td><span className={`badge badge-${item.status?.toLowerCase()}`}>{item.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
