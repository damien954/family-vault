import Btn from './Btn';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({ title, message, onConfirm, onCancel, danger = true }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        style={{ maxWidth: 400 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={18} color="var(--warning)" />
            <h3 style={{ fontSize: 15 }}>{title}</h3>
          </div>
          <button
            onClick={onCancel}
            style={{ background: 'none', color: 'var(--text-muted)', padding: 4, cursor: 'pointer', border: 'none', display: 'flex' }}
          >
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <Btn variant="secondary" onClick={onCancel}>Cancel</Btn>
          <Btn variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>Confirm</Btn>
        </div>
      </div>
    </div>
  );
}
