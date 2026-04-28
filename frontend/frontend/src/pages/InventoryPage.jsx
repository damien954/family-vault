import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { itemsApi, locationsApi, categoriesApi, tagsApi, exportApi, usersApi } from '../api/client';
import { Plus, Search, Download, Pencil, Trash2, X, ChevronUp, ChevronDown, Package } from 'lucide-react';
import Btn from '../components/common/Btn';
import ItemFormModal from '../components/inventory/ItemFormModal';
import { useToast } from '../components/common/Toast';

const STATUS_OPTIONS = ['Active', 'Sold', 'Transferred', 'Lost', 'Stolen'];

function fmt(n) {
  return n != null
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
    : '—';
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Columns that are sortable client-side (from item fields)
const CLIENT_SORT_FIELDS = {
  caliber: (a, b) => (a.caliber || '').localeCompare(b.caliber || ''),
  category: (a, b) => (a.category_name || '').localeCompare(b.category_name || ''),
  owner: (a, b) => (a.owner_name || '').localeCompare(b.owner_name || ''),
  status: (a, b) => (a.status || '').localeCompare(b.status || ''),
};

export default function InventoryPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();

  const [filters, setFilters] = useState({
    search: '', status: '', category_id: '', location_id: '', tag: '',
    sort_by: 'created_at', sort_dir: 'desc',
  });
  const [clientSort, setClientSort] = useState({ field: null, dir: 'asc' });
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const { data: rawItems = [], isLoading } = useQuery({
    queryKey: ['items', filters],
    queryFn: () => itemsApi.list(filters).then(r => r.data),
  });
  const { data: locations = [] } = useQuery({ queryKey: ['locations'], queryFn: () => locationsApi.list().then(r => r.data) });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list().then(r => r.data) });
  const { data: tags = [] } = useQuery({ queryKey: ['tags'], queryFn: () => tagsApi.list().then(r => r.data) });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list().then(r => r.data) });

  // Apply client-side sort on top of server results
  const items = clientSort.field
    ? [...rawItems].sort((a, b) => {
        const cmp = CLIENT_SORT_FIELDS[clientSort.field](a, b);
        return clientSort.dir === 'asc' ? cmp : -cmp;
      })
    : rawItems;

  const deleteMutation = useMutation({
    mutationFn: (id) => itemsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Firearm deleted.');
    },
    onError: () => toast('Failed to delete.', 'error'),
  });

  const setFilter = (key, val) => {
    setClientSort({ field: null, dir: 'asc' }); // reset client sort on filter change
    setFilters(f => ({ ...f, [key]: val }));
  };

  const hasFilters = filters.search || filters.status || filters.category_id || filters.location_id || filters.tag;

  const clearFilters = () => {
    setClientSort({ field: null, dir: 'asc' });
    setFilters({ search: '', status: '', category_id: '', location_id: '', tag: '', sort_by: 'created_at', sort_dir: 'desc' });
  };

  // Server-side sortable columns (value, purchase_date)
  const handleServerSort = (col) => {
    setClientSort({ field: null, dir: 'asc' });
    setFilters(f => ({
      ...f,
      sort_by: col,
      sort_dir: f.sort_by === col && f.sort_dir === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Client-side sortable columns (caliber, type, owner, status)
  const handleClientSort = (field) => {
    setClientSort(s => ({
      field,
      dir: s.field === field && s.dir === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortIcon = ({ type, col }) => {
    if (type === 'server') {
      if (filters.sort_by !== col || clientSort.field) return <ChevronUp size={11} style={{ opacity: 0.2 }} />;
      return filters.sort_dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
    }
    if (type === 'client') {
      if (clientSort.field !== col) return <ChevronUp size={11} style={{ opacity: 0.2 }} />;
      return clientSort.dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
    }
    return null;
  };

  const thStyle = { cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' };
  const thContent = (label, icon) => (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{label}{icon}</span>
  );

  const handleExport = async (type) => {
    try {
      const res = type === 'csv' ? await exportApi.csv() : await exportApi.excel();
      downloadBlob(res.data, `familyvault-export.${type === 'csv' ? 'csv' : 'xlsx'}`);
      toast(`Exported as ${type.toUpperCase()}.`);
    } catch { toast('Export failed.', 'error'); }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) deleteMutation.mutate(id);
  };

  const openEdit = (item, e) => { e.stopPropagation(); setEditItem(item); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditItem(null); };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">{items.length} firearm{items.length !== 1 ? 's' : ''} found</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn variant="secondary" size="sm" onClick={() => handleExport('csv')}><Download size={13} /> CSV</Btn>
          <Btn variant="secondary" size="sm" onClick={() => handleExport('excel')}><Download size={13} /> Excel</Btn>
          <Btn onClick={() => { setEditItem(null); setShowForm(true); }}><Plus size={14} /> Add Firearm</Btn>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input placeholder="Search make, model, serial…" value={filters.search} onChange={e => setFilter('search', e.target.value)} style={{ paddingLeft: 32 }} />
          </div>

          <select value={filters.status} onChange={e => setFilter('status', e.target.value)} style={{ flex: '0 1 130px' }}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          <select value={filters.category_id} onChange={e => setFilter('category_id', e.target.value)} style={{ flex: '0 1 120px' }}>
            <option value="">All Types</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select value={filters.location_id} onChange={e => setFilter('location_id', e.target.value)} style={{ flex: '0 1 130px' }}>
            <option value="">All Locations</option>
            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>

          <select value={filters.tag} onChange={e => setFilter('tag', e.target.value)} style={{ flex: '0 1 120px' }}>
            <option value="">All Tags</option>
            {tags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>

          {/* Owner filter */}
          <select
            value={filters.owner_id || ''}
            onChange={e => setFilter('owner_id', e.target.value)}
            style={{ flex: '0 1 120px' }}
          >
            <option value="">All Owners</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>

          {hasFilters && <Btn variant="ghost" size="sm" onClick={clearFilters}><X size={13} /> Clear</Btn>}
        </div>

        {filters.tag && (
          <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
            <span style={{ padding: '2px 10px', background: 'var(--accent-bg)', color: 'var(--accent)', borderRadius: 100, fontSize: 11, fontWeight: 600, border: '1px solid rgba(200,169,110,0.2)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {filters.tag}
              <button onClick={() => setFilter('tag', '')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={11} /></button>
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
            <Package size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p>{hasFilters ? 'No firearms match your filters.' : 'No firearms yet. Add your first one!'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Make / Model</th>
                  <th style={thStyle} onClick={() => handleClientSort('caliber')}>
                    {thContent('Caliber', <SortIcon type="client" col="caliber" />)}
                  </th>
                  <th style={thStyle} onClick={() => handleClientSort('category')}>
                    {thContent('Type', <SortIcon type="client" col="category" />)}
                  </th>
                  <th style={thStyle} onClick={() => handleClientSort('owner')}>
                    {thContent('Owner', <SortIcon type="client" col="owner" />)}
                  </th>
                  <th>Location</th>
                  <th style={thStyle} onClick={() => handleServerSort('value')}>
                    {thContent('Value', <SortIcon type="server" col="value" />)}
                  </th>
                  <th style={thStyle} onClick={() => handleClientSort('status')}>
                    {thContent('Status', <SortIcon type="client" col="status" />)}
                  </th>
                  <th style={{ width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} onClick={() => navigate(`/inventory/${item.id}`)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {[item.make, item.model].filter(Boolean).join(' ') || item.name || '—'}
                      </div>
                      {item.serial_number && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                          S/N: {item.serial_number}
                        </div>
                      )}
                      {item.is_private && (
                        <div style={{ fontSize: 10, color: 'var(--accent)', marginTop: 2, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Private</div>
                      )}
                      {item.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                          {item.tags.map(t => (
                            <span
                              key={t.id}
                              onClick={e => { e.stopPropagation(); setFilter('tag', t.name); }}
                              title={`Filter by: ${t.name}`}
                              style={{ padding: '1px 6px', background: 'var(--bg-elevated)', color: 'var(--text-muted)', borderRadius: 100, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border)' }}
                            >{t.name}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{item.caliber || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{item.category_name || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{item.owner_name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{item.storage_location_name || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(item.current_value)}</td>
                    <td><span className={`badge badge-${item.status?.toLowerCase()}`}>{item.status}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <Btn variant="ghost" size="sm" onClick={e => openEdit(item, e)} title="Edit"><Pencil size={13} /></Btn>
                        <Btn variant="ghost" size="sm" onClick={() => handleDelete(item.id, item.name)} title="Delete"><Trash2 size={13} color="var(--danger)" /></Btn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <ItemFormModal item={editItem} onClose={closeForm} />}
    </div>
  );
}
