import { useState } from "react";
import { Clock, Plus, Pencil, X } from "lucide-react";
import { useShiftTypes, useCreateShiftType, useUpdateShiftType, useDeleteShiftType } from "@/api/shiftTypes";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import ShiftTypeForm from "@/components/ShiftTypeForm";
import type { ShiftType, ShiftTypeCreate } from "@/types/shift";

const CATEGORY_LABELS: Record<string, string> = { work: "Trabajo", vacation: "Vacaciones", special: "Especial" };

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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
            <Clock size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-warm-dark">Tipos de Turno</h2>
            <p className="text-sm text-warm-secondary">Configura los turnos disponibles</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Nuevo turno
        </button>
      </div>

      <Modal open={showForm} onOpenChange={setShowForm} title={editing ? "Editar turno" : "Nuevo turno"}>
        <ShiftTypeForm
          shiftType={editing}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={() => setShowForm(false)}
          loading={createST.isPending || updateST.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}
        title="Desactivar turno"
        description={`Se desactivara el turno "${confirmDelete?.name}". Podras reactivarlo mas tarde.`}
        onConfirm={handleDelete}
        confirmLabel="Desactivar"
        variant="warning"
      />

      {isLoading ? (
        <div className="text-warm-secondary text-sm">Cargando...</div>
      ) : !shiftTypes?.length ? (
        <div className="text-center py-16">
          <Clock size={48} className="mx-auto text-pastel-pink mb-3" />
          <p className="text-lg text-warm-dark mb-1">Sin tipos de turno</p>
          <p className="text-sm text-warm-secondary">Crea turnos para poder asignarlos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {shiftTypes.map((st) => (
            <div key={st.id} className="glass-card rounded-[--radius-card] p-5 shadow-soft hover:shadow-card transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm" style={{ backgroundColor: st.color }}>
                  {st.code}
                </div>
                <div>
                  <p className="font-semibold text-warm-dark">{st.name}</p>
                  <span className="text-xs font-medium text-warm-secondary bg-pastel-lavender-light rounded-full px-2.5 py-0.5">
                    {CATEGORY_LABELS[st.category] || st.category}
                  </span>
                </div>
              </div>
              {st.default_start_time && (
                <p className="text-sm text-warm-secondary mb-1">{st.default_start_time} - {st.default_end_time}</p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-pastel-pink/20">
                <div className="flex gap-1.5">
                  {st.counts_as_work_time && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-pastel-pink-light text-pastel-pink-deep">Laboral</span>
                  )}
                  {!st.is_active && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactivo</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Tooltip content="Editar">
                    <button onClick={() => openEdit(st)} className="p-1.5 rounded-lg text-warm-secondary hover:bg-pastel-pink-light hover:text-pastel-pink-deep transition-colors">
                      <Pencil size={14} />
                    </button>
                  </Tooltip>
                  {st.is_active && (
                    <Tooltip content="Desactivar">
                      <button onClick={() => setConfirmDelete(st)} className="p-1.5 rounded-lg text-warm-secondary hover:bg-red-50 hover:text-red-400 transition-colors">
                        <X size={14} />
                      </button>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
