import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { itemsApi, locationsApi, categoriesApi, usersApi } from '../../api/client';
import { useToast } from '../common/Toast';
import Btn from '../common/Btn';
import { X } from 'lucide-react';

const STATUS_OPTIONS = ['Active', 'Sold', 'Transferred', 'Lost', 'Stolen'];

const EMPTY_FORM = {
  name: '', serial_number: '', make: '', model: '', caliber: '',
  purchase_date: '', purchase_amount: '', current_value: '', purchased_from: '',
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

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || '',
        serial_number: item.serial_number || '',
        make: item.make || '',
        model: item.model || '',
        caliber: item.caliber || '',
        purchase_date: item.purchase_date?.slice(0, 10) || '',
        purchase_amount: item.purchase_amount ?? '',
        current_value: item.current_value ?? '',
        purchased_from: item.purchased_from || '',
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
    const payload = { ...form, tags };
    // Clear empty strings for numeric / uuid fields
    if (!payload.purchase_amount) payload.purchase_amount = null;
    if (!payload.current_value) payload.current_value = null;
    if (!payload.storage_location_id) payload.storage_location_id = null;
    if (!payload.category_id) payload.category_id = null;
    if (!payload.purchase_date) payload.purchase_date = null;
    mutation.mutate(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Item' : 'Add New Item'}</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', color: 'var(--text-muted)', padding: 4, cursor: 'pointer', border: 'none', display: 'flex' }}
          >
            <X size={18} />
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

            <div className="form-grid form-grid-3">
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Glock 19 Gen 5" />
              </div>
              <div className="form-group">
                <label className="form-label">Serial Number</label>
                <input className="mono" value={form.serial_number} onChange={e => set('serial_number', e.target.value)} placeholder="SN-XXXXX" />
              </div>

              <div className="form-group">
                <label className="form-label">Make</label>
                <input value={form.make} onChange={e => set('make', e.target.value)} placeholder="Glock" />
              </div>
              <div className="form-group">
                <label className="form-label">Model</label>
                <input value={form.model} onChange={e => set('model', e.target.value)} placeholder="19 Gen 5" />
              </div>
              <div className="form-group">
                <label className="form-label">Caliber</label>
                <input value={form.caliber} onChange={e => set('caliber', e.target.value)} placeholder="9mm" />
              </div>

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

              <div className="form-group">
                <label className="form-label">Purchased From</label>
                <input value={form.purchased_from} onChange={e => set('purchased_from', e.target.value)} placeholder="Local Gun Store" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
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
                <label className="form-label">Category</label>
                <select value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                  <option value="">— None —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Storage Location</label>
                <select value={form.storage_location_id} onChange={e => set('storage_location_id', e.target.value)}>
                  <option value="">— None —</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input
                  value={form.tags}
                  onChange={e => set('tags', e.target.value)}
                  placeholder="Self Defense, Collector"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label className="form-label">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  style={{ resize: 'vertical' }}
                  placeholder="Any additional details…"
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.is_private}
                    onChange={e => set('is_private', e.target.checked)}
                    style={{ width: 'auto', flexShrink: 0 }}
                  />
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
              {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Item'}
            </Btn>
          </div>
        </form>
      </div>
    </div>
  );
}
