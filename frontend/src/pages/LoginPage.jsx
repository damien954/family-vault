import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth';
import { Shield, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: 20,
    }}>
      {/* Background texture */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 20% 50%, rgba(200,169,110,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(90,158,110,0.03) 0%, transparent 50%)',
      }} />

      <div style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 60, height: 60, background: 'var(--accent-bg)', borderRadius: 'var(--radius-lg)',
            marginBottom: 18, border: '1px solid var(--accent-dim)',
            boxShadow: '0 0 30px rgba(200,169,110,0.15)',
          }}>
            <Shield size={28} color="var(--accent)" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.02em' }}>FamilyVault</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Secure family inventory management</p>
        </div>

        {/* Form card */}
        <div className="card" style={{ border: '1px solid var(--border)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={{
                fontSize: 13, color: 'var(--danger)',
                padding: '9px 12px', background: 'var(--danger-bg)',
                borderRadius: 'var(--radius-sm)', border: '1px solid rgba(196,90,78,0.2)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '11px', background: 'var(--accent)', color: 'var(--bg-base)',
                fontWeight: 700, fontSize: 14, borderRadius: 'var(--radius-sm)',
                marginTop: 4, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, border: 'none',
                fontFamily: 'var(--font-display)', letterSpacing: '0.02em',
                transition: 'opacity 0.15s',
              }}
            >
              <Lock size={14} />
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 20 }}>
          Contact your administrator to create an account.
        </p>
      </div>
    </div>
  );
}
