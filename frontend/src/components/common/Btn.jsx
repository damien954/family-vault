export default function Btn({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  type = 'button',
  style: extraStyle = {},
  title,
}) {
  const sizes = {
    sm: { padding: '5px 10px', fontSize: 12 },
    md: { padding: '8px 14px', fontSize: 13 },
    lg: { padding: '11px 22px', fontSize: 14 },
  };

  const variants = {
    primary: {
      background: 'var(--accent)',
      color: 'var(--bg-base)',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
    },
    secondary: {
      background: 'var(--bg-elevated)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
    },
    danger: {
      background: 'var(--danger-bg)',
      color: 'var(--danger)',
      border: '1px solid var(--danger)',
      borderRadius: 'var(--radius-sm)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
    },
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        whiteSpace: 'nowrap',
        transition: 'all 0.15s',
        fontWeight: 600,
        fontFamily: 'var(--font-display)',
        letterSpacing: '0.01em',
        ...sizes[size],
        ...variants[variant],
        ...extraStyle,
      }}
    >
      {children}
    </button>
  );
}
