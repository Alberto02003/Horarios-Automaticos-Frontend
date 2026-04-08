import { useState } from "react";
import { useMembers, useCreateMember, useUpdateMember, useDeleteMember } from "@/api/members";
import MemberForm from "@/components/MemberForm";
import type { Member, MemberCreate } from "@/types/member";

export default function TeamPage() {
  const { data: members, isLoading } = useMembers();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);

  const handleCreate = (data: MemberCreate) => {
    createMember.mutate(data, {
      onSuccess: () => setShowForm(false),
    });
  };

  const handleUpdate = (data: MemberCreate) => {
    if (!editing) return;
    updateMember.mutate(
      { id: editing.id, data },
      { onSuccess: () => { setEditing(null); setShowForm(false); } },
    );
  };

  const handleDelete = (member: Member) => {
    if (!confirm(`Desactivar a ${member.full_name}?`)) return;
    deleteMember.mutate(member.id);
  };

  const openCreate = () => {
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (member: Member) => {
    setEditing(member);
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setShowForm(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-pink-900">Equipo</h2>
          <p className="text-sm text-gray-500">Integrantes del departamento</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-pink-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-600"
        >
          + Nuevo miembro
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg border border-pink-100">
            <h3 className="text-lg font-semibold text-pink-900 mb-4">
              {editing ? "Editar miembro" : "Nuevo miembro"}
            </h3>
            <MemberForm
              member={editing}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={closeForm}
              loading={createMember.isPending || updateMember.isPending}
            />
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-gray-400 text-sm">Cargando...</div>
      ) : !members?.length ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">Sin miembros</p>
          <p className="text-sm">Agrega integrantes del departamento para empezar</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-pink-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-pink-50/60 text-left">
                <th className="px-4 py-3 font-medium text-pink-900">Color</th>
                <th className="px-4 py-3 font-medium text-pink-900">Nombre</th>
                <th className="px-4 py-3 font-medium text-pink-900">Rol</th>
                <th className="px-4 py-3 font-medium text-pink-900">Horas/sem</th>
                <th className="px-4 py-3 font-medium text-pink-900">Estado</th>
                <th className="px-4 py-3 font-medium text-pink-900">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-pink-50 hover:bg-pink-50/30">
                  <td className="px-4 py-3">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: m.color_tag }} />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{m.full_name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.role_name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.weekly_hour_limit}h</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      m.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {m.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(m)}
                        className="text-pink-600 hover:text-pink-800 text-xs font-medium"
                      >
                        Editar
                      </button>
                      {m.is_active && (
                        <button
                          onClick={() => handleDelete(m)}
                          className="text-gray-400 hover:text-red-500 text-xs font-medium"
                        >
                          Desactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
