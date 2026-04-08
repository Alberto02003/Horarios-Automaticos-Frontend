import { FileEdit, Trash2, CheckCircle, Calendar } from "lucide-react";
import { useState } from "react";
import { usePeriods, useActivatePeriod, useDeletePeriod } from "@/api/schedule";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import { useToast } from "@/components/ui/ToastProvider";
import type { SchedulePeriod } from "@/types/schedule";

interface Props {
  onLoadDraft: (period: SchedulePeriod) => void;
}

export default function DraftsSection({ onLoadDraft }: Props) {
  const { data: periods } = usePeriods();
  const activatePeriod = useActivatePeriod();
  const deletePeriod = useDeletePeriod();
  const { toast } = useToast();

  const [confirmDelete, setConfirmDelete] = useState<SchedulePeriod | null>(null);
  const [confirmActivate, setConfirmActivate] = useState<SchedulePeriod | null>(null);

  const drafts = (periods || []).filter((p) => p.status === "draft");

  const handleDelete = () => {
    if (!confirmDelete) return;
    deletePeriod.mutate(confirmDelete.id, {
      onSuccess: () => { setConfirmDelete(null); toast("Borrador eliminado"); },
    });
  };

  const handleActivate = () => {
    if (!confirmActivate) return;
    activatePeriod.mutate(confirmActivate.id, {
      onSuccess: () => { setConfirmActivate(null); toast("Periodo activado"); },
      onError: (err) => { setConfirmActivate(null); toast(err instanceof Error ? err.message : "Error", "error"); },
    });
  };

  if (!drafts.length) return null;

  return (
    <div className="bg-surface-card rounded-xl border border-[#F0EDF3] p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileEdit size={16} className="text-text-tertiary" />
        <h3 className="text-sm font-bold text-text-primary">Borradores</h3>
        <span className="text-[10px] font-semibold text-text-tertiary bg-[#F0EDF3] px-2 py-0.5 rounded-full">{drafts.length}</span>
      </div>

      <div className="space-y-2">
        {drafts.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-[#F0EDF3] group hover:shadow-xs transition-all">
            <div className="w-8 h-8 rounded-lg bg-p-yellow/40 flex items-center justify-center shrink-0">
              <Calendar size={14} className="text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary">{p.name}</p>
              <p className="text-[10px] text-text-tertiary">{p.start_date} — {p.end_date}</p>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Tooltip content="Cargar borrador">
                <button onClick={() => onLoadDraft(p)} className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-p-blue-light text-blue-600 hover:bg-p-blue/30 transition-colors">
                  Cargar
                </button>
              </Tooltip>
              <Tooltip content="Activar">
                <button onClick={() => setConfirmActivate(p)} className="p-1.5 rounded-md hover:bg-p-mint-light transition-colors">
                  <CheckCircle size={13} className="text-green-500" />
                </button>
              </Tooltip>
              <Tooltip content="Eliminar">
                <button onClick={() => setConfirmDelete(p)} className="p-1.5 rounded-md hover:bg-p-pink-light transition-colors">
                  <Trash2 size={13} className="text-text-tertiary" />
                </button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }} title="Eliminar borrador" description={`Se eliminara "${confirmDelete?.name}" y todas sus asignaciones.`} onConfirm={handleDelete} confirmLabel="Eliminar" variant="danger" />
      <ConfirmDialog open={!!confirmActivate} onOpenChange={(o) => { if (!o) setConfirmActivate(null); }} title="Activar periodo" description={`Se activara "${confirmActivate?.name}". No se podran editar las asignaciones despues.`} onConfirm={handleActivate} confirmLabel="Activar" variant="warning" />
    </div>
  );
}
