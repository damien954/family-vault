import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../api/client';
import { useToast } from '../components/common/Toast';
import Btn from '../components/common/Btn';
import { Plus, Pencil, Trash2, X, Check, Tag } from 'lucide-react';

export default function CategoriesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.list().then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: categoriesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setNewName(''); toast('Category added.'); },
    onError: (err) => toast(err.response?.data?.error || 'Failed to add category.', 'error'),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, ...data }) => categoriesApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setEditId(null); toast('Category updated.'); },
    onError: () => toast('Failed to update category.', 'error'),
  });
  const deleteMut = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast('Category deleted.'); },
    onError: () => toast('Cannot delete — category may be in use.', 'error'),
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMut.mutate({ name: newName.trim() });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-subtitle">Organize your inventory by type</p>
        </div>
      </div>

      <div style={{ maxWidth: 500 }}>
        {/* Add new */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, marginBottom: 14, color: 'var(--text-secondary)', fontWeight: 600 }}>Add New Category</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              placeholder="e.g. Handgun, Rifle, Optics…"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
            />
            <Btn onClick={handleCreate} disabled={!newName.trim() || createMut.isPending}>
              <Plus size={14} /> Add
            </Btn>
          </div>
        </div>

        {/* List */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
          ) : categories.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <Tag size={28} style={{ marginBottom: 10, opacity: 0.2 }} />
              <p>No categories yet. Add your first one above.</p>
            </div>
          ) : (
            categories.map((cat, i) => (
              <div
                key={cat.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px',
                  borderBottom: i < categories.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <Tag size={14} color="var(--accent-dim)" style={{ flexShrink: 0 }} />
                {editId === cat.id ? (
                  <>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      autoFocus
                      style={{ flex: 1 }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') updateMut.mutate({ id: cat.id, name: editName });
                        if (e.key === 'Escape') setEditId(null);
                      }}
                    />
                    <Btn size="sm" onClick={() => updateMut.mutate({ id: cat.id, name: editName })} disabled={!editName.trim()}>
                      <Check size={13} />
                    </Btn>
                    <Btn variant="ghost" size="sm" onClick={() => setEditId(null)}>
                      <X size={13} />
                    </Btn>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontWeight: 600 }}>{cat.name}</span>
                    <Btn variant="ghost" size="sm" onClick={() => { setEditId(cat.id); setEditName(cat.name); }}>
                      <Pencil size={13} />
                    </Btn>
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={() => { if (window.confirm(`Delete "${cat.name}"?`)) deleteMut.mutate(cat.id); }}
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
