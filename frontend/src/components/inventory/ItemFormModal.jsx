import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { itemsApi, locationsApi, categoriesApi, usersApi } from '../../api/client';
import { useToast } from '../common/Toast';
import Btn from '../common/Btn';
import { X } from 'lucide-react';

const STATUS_OPTIONS = ['Active', 'Sold', 'Transferred', 'Lost', 'Stolen'];

// Firearm categories only
const FIREARM_CATEGORIES = ['Handgun', 'Rifle', 'Shotgun'];

// Known firearm brands
const MAKE_OPTIONS = [
  'Barrett', 'Benelli', 'Beretta', 'Browning', 'CZ', 'Daniel Defense',
  'FN', 'Glock', 'H&K', 'Kimber', 'Kel-Tec', 'Mossberg', 'Palmetto State Armory',
  'Remington', 'Rock Island Armory', 'Ruger', 'Savage', 'Sig Sauer', 'Smith & Wesson',
  'Springfield Armory', 'Stoeger', 'Taurus', 'Tikka', 'Walther', 'Winchester', 'Other',
];

// Calibers grouped by firearm type - renders as <optgroup> in the dropdown
const CALIBER_GROUPS = [
  {
    label: 'Handgun',
    calibers: [
      '9mm', '.380 ACP', '.40 S&W', '.45 ACP', '.45 Colt',
      '.357 Magnum', '.357 SIG', '.38 Special', '.38 Super',
      '10mm', '.44 Magnum', '.44 Special', '.50 AE',
      '.22 LR', '.22 WMR', '.17 HMR',
    ],
  },
  {
    label: 'Rifle',
    calibers: [
      '5.56 NATO / .223 Rem', '.308 Win / 7.62 NATO', '6.5 Creedmoor',
      '.300 Blackout', '7.62x39mm', '.30-06 Springfield',
      '.243 Win', '.270 Win', '.338 Lapua', '.300 Win Mag',
      '6.8 SPC', '.224 Valkyrie', '6mm ARC', '.350 Legend',
      '.450 Bushmaster', '.458 SOCOM',
    ],
  },
  {
    label: 'Shotgun',
    calibers: [
      '12 Gauge', '20 Gauge', '.410 Bore', '28 Gauge', '10 Gauge', '16 Gauge',
    ],
  },
];

// Flat list for "known caliber" detection on edit
const ALL_KNOWN_CALIBERS = CALIBER_GROUPS.flatMap(g => g.calibers);

const EMPTY_FORM = {
  name: '', serial_number: '', make: '', make_custom: '', model: '', caliber: '', caliber_custom: '',
  purchase_date: '', purchase_amount: '', current_value: '', acquired_from: '',
  storage_location_id: '', status: 'Active', category_id: '', notes: '',
  owner_id: '', is_private: false, tags: '',
};

export default function ItemFormModal({ item, onClose }) {
  const qc = useQueryClient();
  const toast = useToast();
  const isEdit = !!item;
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const { data: locations = [] } = useQuery({ queryKey: ['locations'], queryFn: () => locationsApi.list().then(r => r.data) });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.list().then(r => r.data) });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => usersApi.list().then(r => r.data) });

  // Filter to firearm categories only
  const firearmCategories = categories.filter(c => FIREARM_CATEGORIES.includes(c.name));

  useEffect(() => {
    if (item) {
      const makeIsKnown = MAKE_OPTIONS.includes(item.make);
      const caliberIsKnown = ALL_KNOWN_CALIBERS.includes(item.caliber);
      setForm({
        name: item.name || '',
        serial_number: item.serial_number || '',
        make: makeIsKnown ? item.make : (item.make ? 'Other' : ''),
        make_custom: makeIsKnown ? '' : (item.make || ''),
        model: item.model || '',
        caliber: caliberIsKnown ? item.caliber : (item.caliber ? 'Other' : ''),
        caliber_custom: caliberIsKnown ? '' : (item.caliber || ''),
        purchase_date: item.purchase_date?.slice(0, 10) || '',
        purchase_amount: item.purchase_amount ?? '',
        current_value: item.current_value ?? '',
        acquired_from: item.purchased_from || '',
        storage_location_id: item.storage_location_id || '',
        status: item.status || 'Active',
        category_id: item.category_id || '',
        notes: item.notes || '',
        owner_id: item.owner_id || '',
        is_private: item.is_private || false,
        tags: (item.tags || []).map(t => t.name).join(', '),
      });
    }
  }, [item]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? itemsApi.update(item.id, data) : itemsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast(isEdit ? 'Item updated successfully.' : 'Item added successfully.');
      onClose();
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to save item.'),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const resolvedMake = form.make === 'Other' ? form.make_custom : form.make;
    const resolvedCaliber = form.caliber === 'Other' ? form.caliber_custom : form.caliber;
    const payload = {
      name: form.name,
      serial_number: form.serial_number || null,
      make: resolvedMake || null,
      model: form.model || null,
      caliber: resolvedCaliber || null,
      purchase_date: form.purchase_date || null,
      purchase_amount: form.purchase_amount || null,
      current_value: form.current_value || null,
      purchased_from: form.acquired_from || null,
      storage_location_id: form.storage_location_id || null,
      status: form.status,
      category_id: form.category_id || null,
      notes: form.notes || null,
      owner_id: form.owner_id,
      is_private: form.is_private,
      tags,
    };
    mutation.mutate(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Firearm' : 'Add New Firearm'}</h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none', color: 'var(--text-muted)', padding: '4px 8px',
              cursor: 'pointer', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
            }}
          >
            <X size={14} /> Close
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{
                padding: '9px 12px', background: 'var(--danger-bg)', color: 'var(--danger)',
                borderRadius: 'var(--radius-sm)', marginBottom: 16, fontSize: 13,
                border: '1px solid rgba(196,90,78,0.2)',
              }}>{error}</div>
            )}

            {/* Section: Identity */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Firearm Identity</div>
            <div className="form-grid form-grid-3" style={{ marginBottom: 20 }}>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Glock 19 Gen 5" />
              </div>
              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input className="mono" value={form.serial_number} onChange={e => set('serial_number', e.target.value)} placeholder="SN-XXXXX" />
              </div>

              {/* Make dropdown */}
              <div className="form-group">
                <label className="form-label">Make</label>
                <select value={form.make} onChange={e => set('make', e.target.value)}>
                  <option value="">— Select Make —</option>
                  {MAKE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              {form.make === 'Other' && (
                <div className="form-group">
                  <label className="form-label">Make (Custom)</label>
                  <input value={form.make_custom} onChange={e => set('make_custom', e.target.value)} placeholder="Enter make" autoFocus />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Model</label>
                <input value={form.model} onChange={e => set('model', e.target.value)} placeholder="19 Gen 5" />
              </div>

              {/* Caliber dropdown */}
              <div className="form-group">
                <label className="form-label">Caliber</label>
                <select value={form.caliber} onChange={e => set('caliber', e.target.value)}>
                  <option value="">— Select Caliber —</option>
                  {CALIBER_GROUPS.map(group => (
                    <optgroup key={group.label} label={`── ${group.label} ──`}>
                      {group.calibers.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                  ))}
                  <option value="Other">Other / Custom</option>
                </select>
              </div>
              {form.caliber === 'Other' && (
                <div className="form-group">
                  <label className="form-label">Caliber (Custom)</label>
                  <input value={form.caliber_custom} onChange={e => set('caliber_custom', e.target.value)} placeholder="Enter caliber" />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Type / Category</label>
                <select value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                  <option value="">— Select Type —</option>
                  {firearmCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  {/* Also show non-firearm cats if any (for flexibility) */}
                  {categories.filter(c => !FIREARM_CATEGORIES.includes(c.name)).map(c =>
                    <option key={c.id} value={c.id}>{c.name}</option>
                  )}
                </select>
              </div>

            </div>

            {/* Section: Acquisition */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Acquisition</div>
            <div className="form-grid form-grid-3" style={{ marginBottom: 20 }}>

              <div className="form-group">
                <label className="form-label">Purchase Date</label>
                <input type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Purchase Amount ($)</label>
                <input type="number" step="0.01" min="0" value={form.purchase_amount} onChange={e => set('purchase_amount', e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Current Value ($)</label>
                <input type="number" step="0.01" min="0" value={form.current_value} onChange={e => set('current_value', e.target.value)} placeholder="0.00" />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Acquired From</label>
                <input value={form.acquired_from} onChange={e => set('acquired_from', e.target.value)} placeholder="Gun store, private sale, inheritance…" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

            </div>

            {/* Section: Storage & Ownership */}
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Storage & Ownership</div>
            <div className="form-grid form-grid-3" style={{ marginBottom: 20 }}>

              <div className="form-group">
                <label className="form-label">Storage Location</label>
                <select value={form.storage_location_id} onChange={e => set('storage_location_id', e.target.value)}>
                  <option value="">— None —</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Owner *</label>
                <select value={form.owner_id} onChange={e => set('owner_id', e.target.value)} required>
                  <option value="">— Select Owner —</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="Self Defense, Collector" />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label className="form-label">Notes</label>
                <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} style={{ resize: 'vertical' }} placeholder="Modifications, condition, history…" />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_private} onChange={e => set('is_private', e.target.checked)} style={{ width: 'auto', flexShrink: 0 }} />
                  <div>
                    <span className="form-label" style={{ marginBottom: 0 }}>Private item</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>Only visible to the assigned owner</span>
                  </div>
                </label>
              </div>

            </div>
          </div>

          <div className="modal-footer">
            <Btn variant="secondary" onClick={onClose} type="button">Cancel</Btn>
            <Btn type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Firearm'}
            </Btn>
          </div>
        </form>
      </div>
    </div>
  );
}
