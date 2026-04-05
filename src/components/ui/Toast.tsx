'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons = {
    success: <CheckCircle size={18} className="text-success" />,
    error: <XCircle size={18} className="text-danger" />,
    info: <AlertCircle size={18} className="text-primary-light" />,
  };

  const progressColors = {
    success: 'bg-success',
    error: 'bg-danger',
    info: 'bg-primary-light',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className="glass-light rounded-xl overflow-hidden min-w-[280px] shadow-2xl animate-slide-in">
            <div className="px-4 py-3 flex items-center gap-3">
              {icons[toast.type]}
              <span className="text-sm text-text-primary flex-1">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)} className="text-text-muted hover:text-text-primary cursor-pointer">
                <X size={14} />
              </button>
            </div>
            {/* Progress bar */}
            <div className="h-0.5 w-full bg-white/[0.04]">
              <div className={`h-full ${progressColors[toast.type]} toast-progress`} />
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
