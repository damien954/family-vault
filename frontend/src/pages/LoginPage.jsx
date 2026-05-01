import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/auth.jsx';
import { Shield, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(email, password); navigate('/'); }
    catch (err) { setError(err.response?.data?.error || 'Login failed. Check your credentials.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg-base)',padding:20 }}>
      <div style={{ width:'100%',maxWidth:380 }}>
        <div style={{ textAlign:'center',marginBottom:32 }}>
          <div style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',width:56,height:56,background:'var(--accent-sub)',borderRadius:'var(--r-lg)',marginBottom:16,border:'1px solid var(--accent-dim)' }}>
            <Shield size={26} color="var(--accent)" />
          </div>
          <h1 style={{ fontSize:26,fontWeight:800,marginBottom:6,letterSpacing:'-.02em' }}>FamilyVault</h1>
          <p style={{ color:'var(--text-3)',fontSize:13 }}>Secure family inventory management</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display:'flex',flexDirection:'column',gap:14 }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            {error && <div style={{ fontSize:13,color:'var(--red)',padding:'9px 12px',background:'var(--red-sub)',borderRadius:'var(--r-sm)',border:'1px solid rgba(196,90,78,.2)' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ padding:11,background:'var(--accent)',color:'var(--bg-base)',fontWeight:700,fontSize:14,borderRadius:'var(--r-sm)',marginTop:4,cursor:loading?'not-allowed':'pointer',opacity:loading?.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,border:'none',fontFamily:'var(--font)' }}>
              <Lock size={14}/>{loading?'Signing in…':'Sign In'}
            </button>
          </form>
        </div>
        <p style={{ textAlign:'center',fontSize:12,color:'var(--text-3)',marginTop:20 }}>Contact your administrator to create an account.</p>
      </div>
    </div>
  );
}