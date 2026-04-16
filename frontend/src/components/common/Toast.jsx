import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const removeToast = (id) => setToasts(t => t.filter(x => x.id !== id));

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
          >
            {toast.type === 'success'
              ? <CheckCircle size={16} color="var(--success)" />
              : <XCircle size={16} color="var(--danger)" />
            }
            <span style={{ flex: 1, fontSize: 13 }}>{toast.msg}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'none', color: 'var(--text-muted)', padding: 2, cursor: 'pointer', border: 'none', display: 'flex' }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
