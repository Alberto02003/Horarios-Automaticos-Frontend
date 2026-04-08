import { useState } from "react";
import { useShiftTypes, useCreateShiftType, useUpdateShiftType, useDeleteShiftType } from "@/api/shiftTypes";
import ShiftTypeForm from "@/components/ShiftTypeForm";
import type { ShiftType, ShiftTypeCreate } from "@/types/shift";

const CATEGORY_LABELS: Record<string, string> = {
  work: "Trabajo",
  vacation: "Vacaciones",
  special: "Especial",
};

export default function ShiftTypesPage() {
  const { data: shiftTypes, isLoading } = useShiftTypes();
  const createST = useCreateShiftType();
  const updateST = useUpdateShiftType();
  const deleteST = useDeleteShiftType();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ShiftType | null>(null);

  const handleCreate = (data: ShiftTypeCreate) => {
    createST.mutate(data, { onSuccess: () => setShowForm(false) });
  };

  const handleUpdate = (data: ShiftTypeCreate) => {
    if (!editing) return;
    updateST.mutate({ id: editing.id, data }, { onSuccess: () => { setEditing(null); setShowForm(false); } });
  };

  const handleDelete = (st: ShiftType) => {
    if (!confirm(`Desactivar turno "${st.name}"?`)) return;
    deleteST.mutate(st.id);
  };

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (st: ShiftType) => { setEditing(st); setShowForm(true); };
  const closeForm = () => { setEditing(null); setShowForm(false); };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-pink-900">Tipos de Turno</h2>
          <p className="text-sm text-gray-500">Configura los turnos disponibles</p>
        </div>
        <button onClick={openCreate} className="bg-pink-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-600">
          + Nuevo turno
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg border border-pink-100">
            <h3 className="text-lg font-semibold text-pink-900 mb-4">
              {editing ? "Editar turno" : "Nuevo turno"}
            </h3>
            <ShiftTypeForm
              shiftType={editing}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={closeForm}
              loading={createST.isPending || updateST.isPending}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-gray-400 text-sm">Cargando...</div>
      ) : !shiftTypes?.length ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">Sin tipos de turno</p>
          <p className="text-sm">Crea turnos para poder asignarlos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shiftTypes.map((st) => (
            <div key={st.id} className="bg-white rounded-xl border border-pink-100 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: st.color }}>
                  {st.code}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{st.name}</p>
                  <p className="text-xs text-gray-500">{CATEGORY_LABELS[st.category] || st.category}</p>
                </div>
              </div>
              {st.default_start_time && (
                <p className="text-sm text-gray-600 mb-1">
                  {st.default_start_time} - {st.default_end_time}
                </p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-pink-50">
                <div className="flex gap-1">
                  {st.counts_as_work_time && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-pink-50 text-pink-600">Laboral</span>
                  )}
                  {!st.is_active && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactivo</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(st)} className="text-pink-600 hover:text-pink-800 text-xs font-medium">Editar</button>
                  {st.is_active && (
                    <button onClick={() => handleDelete(st)} className="text-gray-400 hover:text-red-500 text-xs font-medium">Desactivar</button>
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
