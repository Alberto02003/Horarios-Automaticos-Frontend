import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Pencil } from "lucide-react";
import { useShiftTypes, useCreateShiftType, useUpdateShiftType, useDeleteShiftType } from "@/api/shiftTypes";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import ShiftTypeForm from "@/components/ShiftTypeForm";
import type { ShiftType, ShiftTypeCreate } from "@/types/shift";

const CATEGORY_LABELS: Record<string, string> = { work: "Trabajo", vacation: "Vacaciones", special: "Especial" };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShiftsModal({ open, onOpenChange }: Props) {
  const { data: shiftTypes, isLoading } = useShiftTypes();
  const createST = useCreateShiftType();
  const updateST = useUpdateShiftType();
  const deleteST = useDeleteShiftType();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ShiftType | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ShiftType | null>(null);

  const handleCreate = (data: ShiftTypeCreate) => { createST.mutate(data, { onSuccess: () => setShowForm(false) }); };
  const handleUpdate = (data: ShiftTypeCreate) => {
    if (!editing) return;
    updateST.mutate({ id: editing.id, data }, { onSuccess: () => { setEditing(null); setShowForm(false); } });
  };
  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteST.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) });
  };
  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (st: ShiftType) => { setEditing(st); setShowForm(true); };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-text-primary/20 backdrop-blur-sm animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-surface-card rounded-2xl w-[calc(100%-2rem)] sm:w-full max-w-2xl max-h-[80vh] shadow-lg border border-[#F0EDF3] animate-scale-in focus:outline-none flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#F0EDF3] shrink-0">
              <div>
                <Dialog.Title className="text-lg font-bold text-text-primary tracking-tight">Tipos de Turno</Dialog.Title>
                <p className="text-xs text-text-tertiary mt-0.5">{shiftTypes?.length || 0} configurados</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={openCreate} className="btn-primary text-xs px-3 py-2"><Plus size={14} /> Agregar</button>
                <Dialog.Close className="p-1.5 rounded-lg text-text-tertiary hover:bg-p-lavender-light transition-colors"><X size={16} /></Dialog.Close>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? <p className="text-text-tertiary text-sm p-4">Cargando...</p> : !shiftTypes?.length ? (
                <p className="text-center text-text-tertiary py-12">Sin turnos</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shiftTypes.map((st) => (
                    <div key={st.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#F0EDF3] group hover:shadow-xs transition-all">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0" style={{ backgroundColor: st.color }}>
                        {st.code}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary">{st.name}</p>
                        <p className="text-[10px] text-text-tertiary">
                          {CATEGORY_LABELS[st.category]}{st.default_start_time ? ` · ${st.default_start_time}-${st.default_end_time}` : ""}
                        </p>
                      </div>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip content="Editar"><button onClick={() => openEdit(st)} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors"><Pencil size={13} className="text-text-secondary" /></button></Tooltip>
                        {st.is_active && <Tooltip content="Desactivar"><button onClick={() => setConfirmDelete(st)} className="p-1.5 rounded-lg hover:bg-p-pink-light transition-colors"><X size={13} className="text-text-secondary" /></button></Tooltip>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Modal open={showForm} onOpenChange={setShowForm} title={editing ? "Editar turno" : "Nuevo turno"}>
        <ShiftTypeForm shiftType={editing} onSubmit={editing ? handleUpdate : handleCreate} onCancel={() => setShowForm(false)} loading={createST.isPending || updateST.isPending} />
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }} title="Desactivar turno" description={`Se desactivara "${confirmDelete?.name}".`} onConfirm={handleDelete} confirmLabel="Desactivar" variant="warning" />
    </>
  );
}
