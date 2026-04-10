import { Plus, Pencil, X } from "lucide-react";
import { useShiftTypes, useCreateShiftType, useUpdateShiftType, useDeleteShiftType } from "@/api/shiftTypes";
import { useCrudHandler } from "@/hooks/useCrudHandler";
import { CATEGORY_LABELS } from "@/constants";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import ShiftTypeForm from "@/components/ShiftTypeForm";
import type { ShiftType, ShiftTypeCreate } from "@/types/shift";

export default function ShiftsTab() {
  const { data: shiftTypes, isLoading } = useShiftTypes();
  const createST = useCreateShiftType();
  const updateST = useUpdateShiftType();
  const deleteST = useDeleteShiftType();
  const crud = useCrudHandler<ShiftType>();

  const handleCreate = (data: ShiftTypeCreate) => { createST.mutate(data, { onSuccess: () => crud.closeForm() }); };
  const handleUpdate = (data: ShiftTypeCreate) => { if (!crud.editing) return; updateST.mutate({ id: crud.editing.id, data }, { onSuccess: () => crud.closeForm() }); };
  const handleDelete = () => { if (!crud.confirmDelete) return; deleteST.mutate(crud.confirmDelete.id, { onSuccess: () => crud.closeDelete() }); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-text-tertiary">{shiftTypes?.length || 0} tipos</p>
        <button onClick={crud.openCreate} className="btn-primary text-xs px-3 py-1.5 rounded-xl"><Plus size={12} /> Agregar</button>
      </div>

      <Modal open={crud.showForm} onOpenChange={crud.setShowForm} title={crud.editing ? "Editar turno" : "Nuevo turno"}>
        <ShiftTypeForm shiftType={crud.editing} onSubmit={crud.editing ? handleUpdate : handleCreate} onCancel={crud.closeForm} loading={createST.isPending || updateST.isPending} />
      </Modal>
      <ConfirmDialog open={!!crud.confirmDelete} onOpenChange={(o) => { if (!o) crud.closeDelete(); }} title="Desactivar turno" description={`Se desactivara "${crud.confirmDelete?.name}".`} onConfirm={handleDelete} confirmLabel="Desactivar" variant="warning" />

      {isLoading ? <p className="text-xs text-text-tertiary">Cargando...</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {shiftTypes?.map((st) => (
            <div key={st.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-[#F0EDF3] group hover:shadow-xs transition-all">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ backgroundColor: st.color }}>{st.code}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{st.name}</p>
                <p className="text-[10px] text-text-tertiary">{CATEGORY_LABELS[st.category]}{st.default_start_time ? ` · ${st.default_start_time}-${st.default_end_time}` : ""}</p>
              </div>
              {!st.is_active && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#F0EDF3] text-text-tertiary">Inactivo</span>}
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip content="Editar"><button aria-label="Editar turno" onClick={() => crud.openEdit(st)} className="p-1 rounded-lg hover:bg-p-lavender-light"><Pencil size={11} className="text-text-secondary" /></button></Tooltip>
                {st.is_active && <Tooltip content="Desactivar"><button aria-label="Desactivar turno" onClick={() => crud.openDelete(st)} className="p-1 rounded-lg hover:bg-p-pink-light"><X size={11} className="text-text-secondary" /></button></Tooltip>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
