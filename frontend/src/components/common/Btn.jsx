export default function Btn({ children, variant = 'primary', size = 'md', onClick, disabled = false, type = 'button', style: s = {}, title }) {
  const sz = {
    sm: { padding: '5px 10px',  fontSize: 12 },
    md: { padding: '8px 14px',  fontSize: 13 },
    lg: { padding: '11px 22px', fontSize: 14 },
  };
  const va = {
    primary:   { background: 'var(--accent)',      color: 'var(--bg-base)', border: 'none',                       borderRadius: 'var(--r-sm)' },
    secondary: { background: 'var(--bg-elevated)', color: 'var(--text-1)',  border: '1px solid var(--border)',    borderRadius: 'var(--r-sm)' },
    danger:    { background: 'var(--red-sub)',     color: 'var(--red)',     border: '1px solid var(--red)',       borderRadius: 'var(--r-sm)' },
    ghost:     { background: 'transparent',        color: 'var(--text-2)', border: 'none',                       borderRadius: 'var(--r-sm)' },
  };
  return (
    <button
      type={type} onClick={onClick} disabled={disabled} title={title}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .5 : 1, whiteSpace: 'nowrap', transition: 'all .15s', fontWeight: 600, fontFamily: 'var(--font)', letterSpacing: '.01em', ...sz[size], ...va[variant], ...s }}
    >
      {children}
    </button>
  );
}
