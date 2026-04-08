import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmLabel?: string;
  variant?: "danger" | "warning";
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Confirmar",
  variant = "warning",
}: Props) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-pastel-pink-deep/20 backdrop-blur-sm animate-fade-in" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 glass-card rounded-3xl p-8 w-full max-w-sm shadow-elevated animate-scale-in focus:outline-none">
          <div className="flex items-start gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              variant === "danger" ? "bg-red-50 text-red-400" : "bg-pastel-peach-light text-amber-500"
            }`}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <AlertDialog.Title className="text-lg font-bold text-warm-dark">
                {title}
              </AlertDialog.Title>
              <AlertDialog.Description className="text-sm text-warm-secondary mt-1">
                {description}
              </AlertDialog.Description>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <AlertDialog.Action
              onClick={onConfirm}
              className={`flex-1 inline-flex items-center justify-center py-2.5 rounded-[--radius-button] text-sm font-semibold text-white transition-all duration-200 ${
                variant === "danger"
                  ? "bg-red-400 hover:bg-red-500"
                  : "btn-primary"
              }`}
            >
              {confirmLabel}
            </AlertDialog.Action>
            <AlertDialog.Cancel className="btn-secondary flex-1">
              Cancelar
            </AlertDialog.Cancel>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
