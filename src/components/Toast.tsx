import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error";
}

let addToastFn: ((message: string, type: "success" | "error") => void) | null = null;

export function showToast(message: string, type: "success" | "error" = "success") {
  addToastFn?.(message, type);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`glass-card flex items-center gap-2 px-5 py-3 rounded-2xl shadow-elevated animate-slide-in ${
            t.type === "success"
              ? "bg-pastel-mint-light/90 border-pastel-mint text-green-800"
              : "bg-red-50/90 border-red-200 text-red-700"
          }`}
        >
          {t.type === "success" ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span className="text-sm font-medium">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
