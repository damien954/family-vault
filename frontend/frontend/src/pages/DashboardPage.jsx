import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/client';
import { Package, Users, Shield, TrendingUp, TrendingDown, Clock, Calendar, Activity } from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  Active:      { bg: 'var(--success-bg)',              text: 'var(--success)',  border: 'rgba(90,158,110,0.3)' },
  Sold:        { bg: 'var(--info-bg)',                 text: 'var(--info)',     border: 'rgba(74,127,168,0.3)' },
  Transferred: { bg: 'rgba(155,114,200,0.12)',         text: '#9b72c8',         border: 'rgba(155,114,200,0.3)' },
  Lost:        { bg: 'var(--warning-bg)',              text: 'var(--warning)',  border: 'rgba(196,135,58,0.3)' },
  Stolen:      { bg: 'var(--danger-bg)',               text: 'var(--danger)',   border: 'rgba(196,90,78,0.3)' },
};

const BLOCK_PALETTE = [
  '#c8a96e', '#5a9e6e', '#4a7fa8', '#9b72c8',
  '#c4873a', '#c45a4e', '#7ab8a0', '#a07ac8',
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ageLabel(years, months) {
  const y = parseInt(years || 0);
  const m = parseInt(months || 0);
  if (y === 0 && m === 0) return '< 1 mo';
  if (y === 0) return `${m} mo`;
  if (m === 0) return `${y} yr`;
  return `${y} yr ${m} mo`;
}

function firearmLabel(item) {
  return [item.make, item.model].filter(Boolean).join(' ') || '—';
}

// ─── small components ────────────────────────────────────────────────────────

function Card({ children, style = {} }) {
  return <div className="card" style={{ ...style }}>{children}</div>;
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}>
      {Icon && <Icon size={13} color="var(--accent)" />}
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {children}
      </span>
    </div>
  );
}

// Big number stat card
function StatCard({ icon: Icon, label, value, color = 'var(--accent)', note }) {
  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      {note && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{note}</div>}
    </Card>
  );
}

// Square block grid — each item = a colored square with count + label
function BlockGrid({ items, colorKey = 'label', emptyMsg = 'No data yet.' }) {
  if (!items?.length) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{emptyMsg}</p>;
  const max = Math.max(...items.map(i => parseInt(i.count)));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, idx) => {
        const count = parseInt(item.count);
        const pct   = max > 0 ? count / max : 0;
        const color = BLOCK_PALETTE[idx % BLOCK_PALETTE.length];
        const label = item[colorKey] || '—';
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Square block that scales with count */}
            <div style={{ display: 'flex', gap: 3, flexShrink: 0, width: 80, justifyContent: 'flex-end' }}>
              {Array.from({ length: Math.max(1, Math.round(pct * 5)) }).map((_, i) => (
                <div key={i} style={{
                  width: 14, height: 14,
                  borderRadius: 3,
                  background: color,
                  opacity: 0.4 + (i / 5) * 0.6,
                }} />
              ))}
            </div>
            {/* Label */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }} className="truncate">{label}</span>
            </div>
            {/* Count badge */}
            <div style={{
              fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
              color, background: `${color}18`,
              padding: '1px 8px', borderRadius: 100,
              border: `1px solid ${color}30`,
              flexShrink: 0,
            }}>
              {count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Status squares — each status shown as a pill block
function StatusBlocks({ byStatus }) {
  if (!byStatus?.length) return <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data.</p>;
  const total = byStatus.reduce((s, r) => s + parseInt(r.count), 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {byStatus.map(row => {
        const colors = STATUS_COLORS[row.status] || STATUS_COLORS.Active;
        const pct    = total > 0 ? ((parseInt(row.count) / total) * 100).toFixed(0) : 0;
        return (
          <div key={row.status} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: 2, flexShrink: 0,
              background: colors.text,
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, width: 90, flexShrink: 0 }}>{row.status}</span>
            <div style={{ flex: 1, height: 8, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: colors.text, borderRadius: 2, transition: 'width 0.5s ease' }} />
            </div>
            <span style={{
              fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
              color: colors.text, background: colors.bg,
              padding: '1px 8px', borderRadius: 100, border: `1px solid ${colors.border}`,
              flexShrink: 0, minWidth: 28, textAlign: 'center',
            }}>{row.count}</span>
          </div>
        );
      })}
    </div>
  );
}

// Timeline row for recently acquired / longest owned
function TimelineRow({ item, right, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 12px', borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-elevated)', cursor: 'pointer',
      border: '1px solid var(--border-subtle)',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-dim)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13 }} className="truncate">{firearmLabel(item)}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
          {item.caliber && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.caliber}</span>
          )}
          {item.category_name && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.category_name}</span>
          )}
          {item.owner_name && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>· {item.owner_name}</span>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{right}</div>
        {item.status && item.status !== 'Active' && (
          <span className={`badge badge-${item.status?.toLowerCase()}`} style={{ fontSize: 10, marginTop: 3 }}>{item.status}</span>
        )}
      </div>
    </div>
  );
}

// Recently added table row
function RecentRow({ item, onClick }) {
  return (
    <tr onClick={onClick} style={{ cursor: 'pointer' }}>
      <td style={{ fontWeight: 600 }}>{firearmLabel(item)}</td>
      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
        {item.caliber || <span style={{ color: 'var(--text-muted)' }}>—</span>}
      </td>
      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{item.category_name || '—'}</td>
      <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{item.owner_name}</td>
      <td><span className={`badge badge-${item.status?.toLowerCase()}`}>{item.status}</span></td>
      <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatDate(item.created_at)}</td>
    </tr>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

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
    summary          = {},
    by_status        = [],
    by_category      = [],
    by_location      = [],
    top_makes        = [],
    least_makes      = [],
    top_calibers     = [],
    least_calibers   = [],
    recently_acquired = [],
    longest_owned    = [],
    recent_items     = [],
  } = data || {};

  const inactiveCount = parseInt(summary.inactive_items || 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Active collection stats · all other sections include all statuses</p>
        </div>
      </div>

      {/* ── Row 1: top stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard icon={Package} label="Total Firearms"  value={summary.total_items  || 0} />
        <StatCard icon={Shield}  label="Active"          value={summary.active_items || 0} color="var(--success)"
          note={inactiveCount > 0 ? `${inactiveCount} inactive` : 'all active'} />
        <StatCard icon={Users}   label="Owners"          value={summary.total_owners || 0} color="var(--info)" />
        {by_category.map((c, i) => (
          <StatCard key={c.category} icon={Activity} label={c.category}
            value={c.count} color={BLOCK_PALETTE[i % BLOCK_PALETTE.length]} note="active" />
        ))}
      </div>

      {/* ── Row 2: Brands + Calibers ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        <Card>
          <SectionLabel icon={TrendingUp}>Brands — Active Collection</SectionLabel>
          {!top_makes.length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet.</p>
          ) : (
            <>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10 }}>MOST</div>
              <BlockGrid items={top_makes} colorKey="make" />

              {least_makes.filter(m => !top_makes.slice(0, 3).find(t => t.make === m.make)).length > 0 && (
                <>
                  <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <TrendingDown size={11} /> LEAST
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {least_makes.filter(m => !top_makes.slice(0, 3).find(t => t.make === m.make)).map(m => (
                      <div key={m.make} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{m.make}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{m.count} ×</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </Card>

        <Card>
          <SectionLabel icon={TrendingUp}>Calibers — Active Collection</SectionLabel>
          {!top_calibers.length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No data yet.</p>
          ) : (
            <>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10 }}>MOST</div>
              <BlockGrid items={top_calibers} colorKey="caliber" />

              {least_calibers.filter(c => !top_calibers.slice(0, 3).find(t => t.caliber === c.caliber)).length > 0 && (
                <>
                  <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <TrendingDown size={11} /> LEAST
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {least_calibers.filter(c => !top_calibers.slice(0, 3).find(t => t.caliber === c.caliber)).map(c => (
                      <div key={c.caliber} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{c.caliber}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.count} ×</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </Card>

      </div>

      {/* ── Row 3: Recently acquired + Longest owned ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        <Card>
          <SectionLabel icon={Calendar}>Recently Acquired</SectionLabel>
          {!recently_acquired.length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No purchase dates recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recently_acquired.map(item => (
                <TimelineRow key={item.id} item={item} right={formatDate(item.purchase_date)} onClick={() => navigate(`/inventory/${item.id}`)} />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <SectionLabel icon={Clock}>Longest Owned (Active)</SectionLabel>
          {!longest_owned.length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No purchase dates recorded.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {longest_owned.map(item => (
                <TimelineRow key={item.id} item={item} right={ageLabel(item.years_owned, item.months_owned)} onClick={() => navigate(`/inventory/${item.id}`)} />
              ))}
            </div>
          )}
        </Card>

      </div>

      {/* ── Row 4: Status + Location ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

        <Card>
          <SectionLabel icon={Activity}>Status Breakdown — All Items</SectionLabel>
          <StatusBlocks byStatus={by_status} />
        </Card>

        <Card>
          <SectionLabel icon={Package}>By Storage Location (Active)</SectionLabel>
          {!by_location.length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No locations assigned.</p>
          ) : (
            <BlockGrid items={by_location} colorKey="location" />
          )}
        </Card>

      </div>

      {/* ── Row 5: Recently added table ── */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <Activity size={13} color="var(--accent)" />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Recently Added to System
          </span>
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
                <th>Added</th>
              </tr>
            </thead>
            <tbody>
              {!recent_items.length && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>No items yet.</td></tr>
              )}
              {recent_items.map(item => (
                <RecentRow key={item.id} item={item} onClick={() => navigate(`/inventory/${item.id}`)} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
}
