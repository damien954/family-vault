import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, backupApi } from '../api/client';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../store/auth.jsx';
import Btn from '../components/common/Btn';
import { Plus, Trash2, X, Shield, Users, Download } from 'lucide-react';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const qc            = useQueryClient();
  const toast         = useToast();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ name: '', email: '', password: '', is_admin: false });
  const [error, setError]       = useState('');
  const [backingUp, setBackingUp] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
      setForm({ name: '', email: '', password: '', is_admin: false });
      setError('');
      toast('User created successfully.');
    },
    onError: (err) => setError(err.response?.data?.error || 'Failed to create user.'),
  });

  const deleteMut = useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast('User deleted.'); },
    onError:   () => toast('Failed to delete user.', 'error'),
  });

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const res  = await backupApi.download();
      const date = new Date().toISOString().slice(0, 10);
      downloadBlob(res.data, `familyvault-backup-${date}.sql`);
      toast('Database backup downloaded.');
    } catch {
      toast('Backup failed. Check server logs.', 'error');
    } finally {
      setBackingUp(false);
    }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    createMut.mutate(form);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage who has access to FamilyVault</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" size="sm" onClick={handleBackup} disabled={backingUp}>
            <Download size={13} /> {backingUp ? 'Backing up…' : 'Backup DB'}
          </Btn>
          <Btn onClick={() => { setShowForm(true); setError(''); }}>
            <Plus size={14} /> Add User
          </Btn>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', maxWidth: 700 }}>
        {isLoading ? (
          <div style={{ padding: 32, display: 'flex', justifyContent: 'center' }}><div className="spinner" /></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th style={{ width: 60 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    {u.id === me?.id && <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', marginTop: 1 }}>You</div>}
                  </td>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text-2)' }}>{u.email}</td>
                  <td>
                    <span className="badge" style={{
                      background: u.is_admin ? 'var(--accent-sub)' : 'var(--bg-elevated)',
                      color: u.is_admin ? 'var(--accent)' : 'var(--text-2)',
                      border: u.is_admin ? '1px solid rgba(201,170,112,.2)' : '1px solid var(--border)',
                    }}>
                      {u.is_admin && <Shield size={9} />}
                      {u.is_admin ? 'Admin' : 'Member'}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    {u.id !== me?.id && (
                      <Btn variant="ghost" size="sm"
                        onClick={() => { if (window.confirm(`Delete "${u.name}"? Their items will also be deleted.`)) deleteMut.mutate(u.id); }}>
                        <Trash2 size={13} color="var(--red)" />
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add user modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New User</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', color: 'var(--text-3)', padding: 4, cursor: 'pointer', border: 'none', display: 'flex' }}>
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div style={{ padding: '9px 12px', background: 'var(--red-sub)', color: 'var(--red)', borderRadius: 'var(--r-sm)', marginBottom: 14, fontSize: 13, border: '1px solid rgba(196,90,78,.25)' }}>
                    {error}
                  </div>
                )}
                <div className="form-grid" style={{ gap: 13 }}>
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Jane Smith" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address *</label>
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="jane@example.com" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password * <span style={{ color: 'var(--text-3)' }}>(min 8 characters)</span></label>
                    <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="••••••••" />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.is_admin} onChange={e => set('is_admin', e.target.checked)} style={{ width: 'auto', flexShrink: 0 }} />
                    <div>
                      <span className="form-label" style={{ marginBottom: 0 }}>Grant admin privileges</span>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Admin users can manage other users and download backups.</div>
                    </div>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <Btn variant="secondary" type="button" onClick={() => setShowForm(false)}>Cancel</Btn>
                <Btn type="submit" disabled={createMut.isPending}>
                  {createMut.isPending ? 'Creating…' : 'Create User'}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
