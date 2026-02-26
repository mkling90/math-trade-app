'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, message, type };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto animate-slide-in-right"
          >
            <div
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-[300px] max-w-md
                ${toast.type === 'success' ? 'bg-green-50 border border-green-200' : ''}
                ${toast.type === 'error' ? 'bg-red-50 border border-red-200' : ''}
                ${toast.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' : ''}
                ${toast.type === 'info' ? 'bg-blue-50 border border-blue-200' : ''}
              `}
            >
              {/* Icon */}
              {toast.type === 'success' && <CheckCircle className="text-green-600 flex-shrink-0" size={20} />}
              {toast.type === 'error' && <XCircle className="text-red-600 flex-shrink-0" size={20} />}
              {toast.type === 'warning' && <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />}
              {toast.type === 'info' && <Info className="text-blue-600 flex-shrink-0" size={20} />}
              
              {/* Message */}
              <p
                className={`
                  flex-1 text-sm font-medium
                  ${toast.type === 'success' ? 'text-green-800' : ''}
                  ${toast.type === 'error' ? 'text-red-800' : ''}
                  ${toast.type === 'warning' ? 'text-yellow-800' : ''}
                  ${toast.type === 'info' ? 'text-blue-800' : ''}
                `}
              >
                {toast.message}
              </p>
              
              {/* Close Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className={`
                  flex-shrink-0 hover:bg-white/50 rounded p-1 transition-colors
                  ${toast.type === 'success' ? 'text-green-600' : ''}
                  ${toast.type === 'error' ? 'text-red-600' : ''}
                  ${toast.type === 'warning' ? 'text-yellow-600' : ''}
                  ${toast.type === 'info' ? 'text-blue-600' : ''}
                `}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
