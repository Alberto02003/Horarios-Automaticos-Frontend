import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onOpenChange, title, children }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-pastel-pink-deep/20 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 glass-card rounded-3xl p-8 w-full max-w-md shadow-elevated animate-scale-in focus:outline-none">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-bold text-warm-dark">
              {title}
            </Dialog.Title>
            <Dialog.Close className="p-1.5 rounded-lg text-warm-secondary hover:bg-pastel-pink-light hover:text-warm-dark transition-colors">
              <X size={16} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
