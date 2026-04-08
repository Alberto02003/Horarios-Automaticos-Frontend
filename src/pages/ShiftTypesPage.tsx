import { useState } from "react";
import { Clock, Plus, Pencil, X } from "lucide-react";
import { useShiftTypes, useCreateShiftType, useUpdateShiftType, useDeleteShiftType } from "@/api/shiftTypes";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import ShiftTypeForm from "@/components/ShiftTypeForm";
import type { ShiftType, ShiftTypeCreate } from "@/types/shift";

const CATEGORY_LABELS: Record<string, string> = { work: "Trabajo", vacation: "Vacaciones", special: "Especial" };
const CATEGORY_COLORS: Record<string, string> = { work: "bg-p-blue-light text-blue-700", vacation: "bg-p-peach-light text-amber-700", special: "bg-p-lavender-light text-purple-700" };

export default function ShiftTypesPage() {
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
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Turnos</h2>
          <p className="text-sm text-text-secondary mt-0.5">{shiftTypes?.length || 0} tipos configurados</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Agregar
        </button>
      </div>

      <Modal open={showForm} onOpenChange={setShowForm} title={editing ? "Editar turno" : "Nuevo turno"}>
        <ShiftTypeForm shiftType={editing} onSubmit={editing ? handleUpdate : handleCreate} onCancel={() => setShowForm(false)} loading={createST.isPending || updateST.isPending} />
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}
        title="Desactivar turno"
        description={`Se desactivara "${confirmDelete?.name}".`}
        onConfirm={handleDelete}
        confirmLabel="Desactivar"
        variant="warning"
      />

      {isLoading ? (
        <div className="text-text-tertiary text-sm">Cargando...</div>
      ) : !shiftTypes?.length ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-p-lavender-light flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-text-tertiary" />
          </div>
          <p className="text-lg font-semibold text-text-primary">Sin tipos de turno</p>
          <p className="text-sm text-text-secondary mt-1">Crea turnos para poder asignarlos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shiftTypes.map((st) => (
            <div key={st.id} className="bg-surface-card rounded-xl border border-[#F0EDF3] p-5 hover:shadow-sm transition-all duration-150 group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: st.color }}>
                  {st.code}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Tooltip content="Editar">
                    <button onClick={() => openEdit(st)} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors">
                      <Pencil size={13} className="text-text-secondary" />
                    </button>
                  </Tooltip>
                  {st.is_active && (
                    <Tooltip content="Desactivar">
                      <button onClick={() => setConfirmDelete(st)} className="p-1.5 rounded-lg hover:bg-p-pink-light transition-colors">
                        <X size={13} className="text-text-secondary" />
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>
              <p className="font-semibold text-text-primary text-[15px]">{st.name}</p>
              {st.default_start_time && (
                <p className="text-xs text-text-tertiary mt-1">{st.default_start_time} — {st.default_end_time}</p>
              )}
              <div className="flex gap-2 mt-3">
                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${CATEGORY_COLORS[st.category] || "bg-gray-100 text-gray-600"}`}>
                  {CATEGORY_LABELS[st.category] || st.category}
                </span>
                {!st.is_active && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactivo</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
