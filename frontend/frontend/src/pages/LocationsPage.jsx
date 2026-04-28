import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '../api/client';
import { useToast } from '../components/common/Toast';
import Btn from '../components/common/Btn';
import { Plus, Pencil, Trash2, X, Check, MapPin } from 'lucide-react';

export default function LocationsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.list().then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: locationsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations'] }); setNewName(''); setNewDesc(''); toast('Location added.'); },
    onError: () => toast('Failed to add location.', 'error'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...data }) => locationsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations'] }); setEditId(null); toast('Location updated.'); },
    onError: () => toast('Failed to update location.', 'error'),
  });
  const deleteMut = useMutation({
    mutationFn: locationsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations'] }); toast('Location deleted.'); },
    onError: () => toast('Cannot delete — location may be in use.', 'error'),
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMut.mutate({ name: newName.trim(), description: newDesc.trim() || undefined });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Storage Locations</h1>
          <p className="page-subtitle">Define where items are stored</p>
        </div>
      </div>

      <div style={{ maxWidth: 600 }}>
        {/* Add new */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>Add New Location</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              placeholder="Location name (e.g. Gun Safe, Bedroom Closet)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            />
            <input
              placeholder="Description (optional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn onClick={handleCreate} disabled={!newName.trim() || createMut.isPending}>
                <Plus size={14} /> Add Location
              </Btn>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
          ) : locations.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <MapPin size={28} style={{ marginBottom: 10, opacity: 0.2 }} />
              <p>No locations yet. Add your first one above.</p>
            </div>
          ) : (
            locations.map((loc, i) => (
              <div
                key={loc.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
                  borderBottom: i < locations.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <MapPin size={15} color="var(--accent-dim)" style={{ flexShrink: 0 }} />
                {editId === loc.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      autoFocus
                      style={{ flex: 1 }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') updateMut.mutate({ id: loc.id, name: editName });
                        if (e.key === 'Escape') setEditId(null);
                      }}
                    />
                    <Btn size="sm" onClick={() => updateMut.mutate({ id: loc.id, name: editName })} disabled={!editName.trim()}>
                      <Check size={13} />
                    </Btn>
                    <Btn variant="ghost" size="sm" onClick={() => setEditId(null)}>
                      <X size={13} />
                    </Btn>
                  </>
                ) : (
                  <>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{loc.name}</div>
                      {loc.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{loc.description}</div>}
                    </div>
                    <Btn variant="ghost" size="sm" onClick={() => { setEditId(loc.id); setEditName(loc.name); }}>
                      <Pencil size={13} />
                    </Btn>
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={() => { if (window.confirm(`Delete "${loc.name}"?`)) deleteMut.mutate(loc.id); }}
                    >
                      <Trash2 size={13} color="var(--danger)" />
                    </Btn>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
