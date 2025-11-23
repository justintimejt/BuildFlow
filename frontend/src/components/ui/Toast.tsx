import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FaCheckCircle, FaTimesCircle, FaTimes } from 'react-icons/fa';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type,
  isVisible,
  onClose,
  duration = 3000
}: ToastProps) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const icon = type === 'success' ? (
    <FaCheckCircle className="w-5 h-5 text-white" />
  ) : (
    <FaTimesCircle className="w-5 h-5 text-red-400" />
  );

  const toastContent = (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] toast-slide-up">
      <div className="bg-black/80 backdrop-blur-xl rounded-2xl shadow-2xl border-2 border-white/20 px-6 py-4 flex items-center gap-3 min-w-[300px] max-w-md">
        <div className="flex-shrink-0">
          {icon}
        </div>
        <p className="flex-1 text-white font-light tracking-tight text-sm">
          {message}
        </p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white/70 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
          aria-label="Close"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  // Render to document body to ensure proper positioning
  if (typeof document !== 'undefined') {
    return createPortal(toastContent, document.body);
  }
  
  return toastContent;
}

