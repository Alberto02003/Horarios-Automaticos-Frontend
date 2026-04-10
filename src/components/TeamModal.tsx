import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import MembersTab from "@/components/config/MembersTab";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TeamModal({ open, onOpenChange }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-text-primary/20 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-surface-card rounded-2xl w-[calc(100%-2rem)] sm:w-full max-w-2xl max-h-[80vh] shadow-lg border border-[#F0EDF3] animate-scale-in focus:outline-none flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-[#F0EDF3] shrink-0">
            <Dialog.Title className="text-lg font-bold text-text-primary tracking-tight">Equipo</Dialog.Title>
            <Dialog.Close className="p-1.5 rounded-lg text-text-tertiary hover:bg-p-lavender-light transition-colors"><X size={16} /></Dialog.Close>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <MembersTab />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
