import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { CheckCircle, XCircle, X } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error";
}

interface ToastContextValue {
  toast: (message: string, type?: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="right" duration={3000}>
        {children}
        {toasts.map((t) => (
          <RadixToast.Root
            key={t.id}
            open
            onOpenChange={(open) => { if (!open) removeToast(t.id); }}
            className={`glass-card flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-elevated animate-slide-in ${
              t.type === "success"
                ? "bg-pastel-mint-light/90 border-pastel-mint"
                : "bg-red-50/90 border-red-200"
            }`}
          >
            {t.type === "success"
              ? <CheckCircle size={18} className="text-green-600 shrink-0" />
              : <XCircle size={18} className="text-red-500 shrink-0" />
            }
            <RadixToast.Description className={`text-sm font-medium flex-1 ${
              t.type === "success" ? "text-green-800" : "text-red-700"
            }`}>
              {t.message}
            </RadixToast.Description>
            <RadixToast.Close className="p-1 rounded-lg hover:bg-black/5 transition-colors">
              <X size={14} className="text-warm-secondary" />
            </RadixToast.Close>
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[360px] max-w-[90vw] outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}
