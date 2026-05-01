import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/client';
import { useAuth } from '../store/auth.jsx';
import { useToast } from '../components/common/Toast';
import Btn from '../components/common/Btn';
import { Lock, User, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const toast     = useToast();
  const [form, setForm]   = useState({ current_password: '', new_password: '', confirm: '' });
  const [error, setError] = useState('');

  const changePwMutation = useMutation({
    mutationFn: (data) => authApi.changePassword(data),
    onSuccess: () => {
      toast('Password updated successfully.');
      setForm({ current_password: '', new_password: '', confirm: '' });
      setError('');
    },
    onError: (err) => setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to update password.'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (form.new_password !== form.confirm) { setError('New passwords do not match.'); return; }
    if (form.new_password.length < 8) { setError('New password must be at least 8 characters.'); return; }
    changePwMutation.mutate({ current_password: form.current_password, new_password: form.new_password });
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile</h1>
          <p className="page-subtitle">Manage your account</p>
        </div>
      </div>

      <div style={{ maxWidth: 540, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Account info */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <User size={14} color="var(--accent)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Account Info</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Name</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{user?.name}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Email</div>
              <div style={{ fontSize: 13, fontFamily: 'var(--mono)' }}>{user?.email}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>Role</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {user?.is_admin && <Shield size={12} color="var(--accent)" />}
                <span style={{ fontSize: 13, fontWeight: 600 }}>{user?.is_admin ? 'Administrator' : 'Member'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <Lock size={14} color="var(--accent)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Change Password</span>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ padding: '9px 12px', background: 'var(--red-sub)', color: 'var(--red)', borderRadius: 'var(--r-sm)', marginBottom: 14, fontSize: 13, border: '1px solid rgba(196,90,78,.25)' }}>
                {error}
              </div>
            )}
            <div className="form-grid" style={{ gap: 13 }}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" value={form.current_password} onChange={e => set('current_password', e.target.value)} required autoComplete="current-password" placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">New Password <span style={{ color: 'var(--text-3)' }}>(min 8 characters)</span></label>
                <input type="password" value={form.new_password} onChange={e => set('new_password', e.target.value)} required autoComplete="new-password" placeholder="••••••••" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} required autoComplete="new-password" placeholder="••••••••" />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Btn type="submit" disabled={changePwMutation.isPending}>
                  {changePwMutation.isPending ? 'Updating…' : 'Update Password'}
                </Btn>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
