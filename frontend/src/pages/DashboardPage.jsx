import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '../api/client';
import { Package, Users, Shield, Clock, Calendar, Activity, TrendingDown } from 'lucide-react';

const STATUS_COLORS = { Active:'#5a9e6e', Sold:'#4a80a8', Transferred:'#9b72c8', Lost:'#c4873a', Stolen:'#c45a4e' };
const BAR_COLORS = ['#c8a96e','#5a9e6e','#4a7fa8','#9b72c8','#c4873a','#c45a4e','#7ab8a0'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}
function ageLabel(y, m) {
  const yr=parseInt(y||0), mo=parseInt(m||0);
  if (yr===0&&mo===0) return '< 1 mo';
  if (yr===0) return `${mo} mo`;
  if (mo===0) return `${yr} yr`;
  return `${yr} yr ${mo} mo`;
}
function gunLabel(item) { return [item.make,item.model].filter(Boolean).join(' ') || 'Unknown'; }

function StatCard({ icon:Icon, label, value, color='#c8a96e', sub }) {
  return (
    <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:10,padding:'16px 18px',display:'flex',flexDirection:'column',gap:8 }}>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
        <span style={{ fontSize:11,fontWeight:600,color:'var(--text-3)',letterSpacing:'.07em',textTransform:'uppercase' }}>{label}</span>
        <div style={{ width:30,height:30,borderRadius:8,background:color+'1a',display:'flex',alignItems:'center',justifyContent:'center' }}>
          <Icon size={14} color={color} />
        </div>
      </div>
      <div style={{ fontSize:32,fontWeight:800,lineHeight:1,letterSpacing:'-.03em' }}>{value}</div>
      {sub && <div style={{ fontSize:11,color:'var(--text-3)' }}>{sub}</div>}
    </div>
  );
}

function SectionHead({ icon:Icon, title, sub }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex',alignItems:'center',gap:6 }}>
        {Icon && <Icon size={12} color="var(--accent)" />}
        <span style={{ fontSize:11,fontWeight:700,color:'var(--accent)',letterSpacing:'.08em',textTransform:'uppercase' }}>{title}</span>
      </div>
      {sub && <p style={{ fontSize:11,color:'var(--text-3)',marginTop:3 }}>{sub}</p>}
    </div>
  );
}

function BarChart({ items, labelKey, color='#c8a96e', emptyMsg='No data yet.' }) {
  if (!items?.length) return <p style={{ color:'var(--text-3)',fontSize:13 }}>{emptyMsg}</p>;
  const max = Math.max(...items.map(r=>parseInt(r.count)));
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
      {items.map((row,idx) => {
        const count=parseInt(row.count), pct=max>0?(count/max)*100:0;
        const col=Array.isArray(color)?color[idx%color.length]:color;
        const label=row[labelKey]||'Unknown';
        return (
          <div key={label}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
              <span style={{ fontSize:12,fontWeight:600 }} className="truncate">{label}</span>
              <span style={{ fontSize:12,fontWeight:700,fontFamily:'var(--mono)',color:col,flexShrink:0,marginLeft:8 }}>{count}</span>
            </div>
            <div style={{ height:6,background:'var(--bg-elevated)',borderRadius:3,overflow:'hidden' }}>
              <div style={{ height:'100%',width:`${pct}%`,background:col,borderRadius:3,transition:'width .5s ease' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Panel({ children, style={} }) {
  return <div style={{ background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:10,padding:'18px 20px',...style }}>{children}</div>;
}

function Divider() { return <div style={{ height:1,background:'var(--border)',margin:'16px 0' }} />; }

function FirearmRow({ item, right, onClick }) {
  return (
    <div onClick={onClick} style={{ display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border-sub)',cursor:'pointer' }}>
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontSize:13,fontWeight:700 }} className="truncate">{gunLabel(item)}</div>
        <div style={{ display:'flex',gap:8,marginTop:2,flexWrap:'wrap',alignItems:'center' }}>
          {item.caliber && <span style={{ fontSize:11,color:'var(--text-3)',fontFamily:'var(--mono)' }}>{item.caliber}</span>}
          {item.category_name && <span style={{ fontSize:11,color:'var(--text-3)' }}>· {item.category_name}</span>}
          {item.owner_name && <span style={{ fontSize:11,color:'var(--text-3)' }}>· {item.owner_name}</span>}
        </div>
      </div>
      <div style={{ flexShrink:0,textAlign:'right' }}>
        <div style={{ fontSize:12,fontWeight:700,color:'var(--accent)' }}>{right}</div>
        {item.status && item.status!=='Active' && <span className={`badge badge-${item.status.toLowerCase()}`} style={{ fontSize:10,marginTop:2 }}>{item.status}</span>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey:['dashboard'], queryFn:()=>dashboardApi.get().then(r=>r.data) });

  if (isLoading) return <div style={{ display:'flex',justifyContent:'center',paddingTop:80 }}><div className="spinner" style={{ width:32,height:32 }} /></div>;

  const { summary={}, by_status=[], by_category=[], by_location=[], top_makes=[], least_makes=[], top_calibers=[], least_calibers=[], recently_acquired=[], longest_owned=[], recent_items=[] } = data || {};
  const inactive = parseInt(summary.inactive_items||0);

  return (
    <div className="page-container">
      <div style={{ marginBottom:22 }}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Active collection stats — all statuses included where noted</p>
      </div>

      <div className="stat-grid" style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12,marginBottom:20 }}>
        <StatCard icon={Package} label="Total"  value={summary.total_items||0} />
        <StatCard icon={Shield}  label="Active" value={summary.active_items||0} color="#5a9e6e" sub={inactive>0?`${inactive} inactive`:undefined} />
        <StatCard icon={Users}   label="Owners" value={summary.total_owners||0} color="#4a80a8" />
        {by_category.map((c,i)=><StatCard key={c.category} icon={Activity} label={c.category} value={c.count} color={BAR_COLORS[i%BAR_COLORS.length]} sub="active" />)}
      </div>

      <div className="dash-grid-2" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
        <Panel>
          <SectionHead icon={Activity} title="Brands" sub="Active firearms only" />
          <BarChart items={top_makes} labelKey="make" color={BAR_COLORS} />
          {least_makes.filter(m=>!top_makes.slice(0,3).find(t=>t.make===m.make)).length>0&&(<>
            <Divider />
            <div style={{ display:'flex',alignItems:'center',gap:5,marginBottom:10 }}><TrendingDown size={11} color="var(--text-3)"/><span style={{ fontSize:11,fontWeight:600,color:'var(--text-3)',letterSpacing:'.06em',textTransform:'uppercase' }}>Least</span></div>
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              {least_makes.filter(m=>!top_makes.slice(0,3).find(t=>t.make===m.make)).map(m=>(
                <div key={m.make} style={{ display:'flex',justifyContent:'space-between',padding:'6px 10px',background:'var(--bg-elevated)',borderRadius:6 }}>
                  <span style={{ fontSize:12,fontWeight:600 }}>{m.make}</span>
                  <span style={{ fontSize:12,fontFamily:'var(--mono)',color:'var(--text-3)' }}>{m.count}×</span>
                </div>
              ))}
            </div>
          </>)}
        </Panel>
        <Panel>
          <SectionHead icon={Activity} title="Calibers" sub="Active firearms only" />
          <BarChart items={top_calibers} labelKey="caliber" color={BAR_COLORS} />
          {least_calibers.filter(c=>!top_calibers.slice(0,3).find(t=>t.caliber===c.caliber)).length>0&&(<>
            <Divider />
            <div style={{ display:'flex',alignItems:'center',gap:5,marginBottom:10 }}><TrendingDown size={11} color="var(--text-3)"/><span style={{ fontSize:11,fontWeight:600,color:'var(--text-3)',letterSpacing:'.06em',textTransform:'uppercase' }}>Least</span></div>
            <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
              {least_calibers.filter(c=>!top_calibers.slice(0,3).find(t=>t.caliber===c.caliber)).map(c=>(
                <div key={c.caliber} style={{ display:'flex',justifyContent:'space-between',padding:'6px 10px',background:'var(--bg-elevated)',borderRadius:6 }}>
                  <span style={{ fontSize:12,fontWeight:600,fontFamily:'var(--mono)' }}>{c.caliber}</span>
                  <span style={{ fontSize:12,fontFamily:'var(--mono)',color:'var(--text-3)' }}>{c.count}×</span>
                </div>
              ))}
            </div>
          </>)}
        </Panel>
      </div>

      <div className="dash-grid-2" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
        <Panel>
          <SectionHead icon={Calendar} title="Recently Acquired" sub="By purchase date, all statuses" />
          {!recently_acquired.length ? <p style={{ color:'var(--text-3)',fontSize:13 }}>No purchase dates recorded.</p>
            : recently_acquired.map(item=><FirearmRow key={item.id} item={item} right={fmtDate(item.purchase_date)} onClick={()=>navigate(`/inventory/${item.id}`)} />)}
        </Panel>
        <Panel>
          <SectionHead icon={Clock} title="Longest Owned" sub="Active only" />
          {!longest_owned.length ? <p style={{ color:'var(--text-3)',fontSize:13 }}>No purchase dates recorded.</p>
            : longest_owned.map(item=><FirearmRow key={item.id} item={item} right={ageLabel(item.years_owned,item.months_owned)} onClick={()=>navigate(`/inventory/${item.id}`)} />)}
        </Panel>
      </div>

      <div className="dash-grid-2" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12 }}>
        <Panel>
          <SectionHead icon={Activity} title="Status Breakdown" sub="All items" />
          {!by_status.length ? <p style={{ color:'var(--text-3)',fontSize:13 }}>No data.</p> : (()=>{
            const total=by_status.reduce((s,r)=>s+parseInt(r.count),0);
            return <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
              {by_status.map(row=>{
                const col=STATUS_COLORS[row.status]||'#c8a96e';
                const pct=total>0?(parseInt(row.count)/total)*100:0;
                return <div key={row.status}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                    <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                      <div style={{ width:8,height:8,borderRadius:2,background:col,flexShrink:0 }} />
                      <span style={{ fontSize:12,fontWeight:600 }}>{row.status}</span>
                    </div>
                    <span style={{ fontSize:12,fontWeight:700,fontFamily:'var(--mono)',color:col }}>{row.count}</span>
                  </div>
                  <div style={{ height:6,background:'var(--bg-elevated)',borderRadius:3,overflow:'hidden' }}>
                    <div style={{ height:'100%',width:`${pct}%`,background:col,borderRadius:3,transition:'width .5s ease' }} />
                  </div>
                </div>;
              })}
            </div>;
          })()}
        </Panel>
        <Panel>
          <SectionHead icon={Package} title="By Location" sub="Active firearms only" />
          <BarChart items={by_location} labelKey="location" color="#8a6f3e" />
        </Panel>
      </div>

      <Panel style={{ padding:0,overflow:'hidden' }}>
        <div style={{ padding:'14px 20px',borderBottom:'1px solid var(--border)' }}>
          <SectionHead icon={Activity} title="Recently Added to System" />
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Firearm</th><th>Caliber</th><th>Type</th><th>Owner</th><th>Status</th><th>Added</th></tr></thead>
            <tbody>
              {!recent_items.length
                ? <tr><td colSpan={6} style={{ textAlign:'center',color:'var(--text-3)',padding:'28px 0' }}>No items yet.</td></tr>
                : recent_items.map(item=>(
                  <tr key={item.id} onClick={()=>navigate(`/inventory/${item.id}`)} style={{ cursor:'pointer' }}>
                    <td style={{ fontWeight:600 }}>{gunLabel(item)}</td>
                    <td style={{ fontFamily:'var(--mono)',fontSize:12,color:'var(--text-2)' }}>{item.caliber||'—'}</td>
                    <td style={{ color:'var(--text-2)',fontSize:12 }}>{item.category_name||'—'}</td>
                    <td style={{ color:'var(--text-2)',fontSize:12 }}>{item.owner_name}</td>
                    <td><span className={`badge badge-${item.status?.toLowerCase()}`}>{item.status}</span></td>
                    <td style={{ fontSize:11,color:'var(--text-3)' }}>{fmtDate(item.created_at)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
