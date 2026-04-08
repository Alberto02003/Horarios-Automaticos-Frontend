import { useState, useEffect, useCallback } from "react";

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
          className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium animate-[slideIn_0.2s_ease-out] ${
            t.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
