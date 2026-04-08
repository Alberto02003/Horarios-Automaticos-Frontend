import { useState } from "react";
import { Users, Plus, Pencil, UserX } from "lucide-react";
import { useMembers, useCreateMember, useUpdateMember, useDeleteMember } from "@/api/members";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import MemberForm from "@/components/MemberForm";
import type { Member, MemberCreate } from "@/types/member";

export default function TeamPage() {
  const { data: members, isLoading } = useMembers();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Member | null>(null);

  const handleCreate = (data: MemberCreate) => {
    createMember.mutate(data, { onSuccess: () => setShowForm(false) });
  };

  const handleUpdate = (data: MemberCreate) => {
    if (!editing) return;
    updateMember.mutate({ id: editing.id, data }, { onSuccess: () => { setEditing(null); setShowForm(false); } });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    deleteMember.mutate(confirmDelete.id, { onSuccess: () => setConfirmDelete(null) });
  };

  const openCreate = () => { setEditing(null); setShowForm(true); };
  const openEdit = (member: Member) => { setEditing(member); setShowForm(true); };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-warm-dark">Equipo</h2>
            <p className="text-sm text-warm-secondary">Integrantes del departamento</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Nuevo miembro
        </button>
      </div>

      <Modal open={showForm} onOpenChange={setShowForm} title={editing ? "Editar miembro" : "Nuevo miembro"}>
        <MemberForm
          member={editing}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={() => setShowForm(false)}
          loading={createMember.isPending || updateMember.isPending}
        />
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}
        title="Desactivar miembro"
        description={`Se desactivara a ${confirmDelete?.full_name}. Podras reactivarlo mas tarde.`}
        onConfirm={handleDelete}
        confirmLabel="Desactivar"
        variant="warning"
      />

      {isLoading ? (
        <div className="text-warm-secondary text-sm">Cargando...</div>
      ) : !members?.length ? (
        <div className="text-center py-16">
          <Users size={48} className="mx-auto text-pastel-pink mb-3" />
          <p className="text-lg text-warm-dark mb-1">Sin miembros</p>
          <p className="text-sm text-warm-secondary">Agrega integrantes del departamento para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map((m) => (
            <div key={m.id} className="glass-card rounded-[--radius-card] p-5 shadow-soft hover:shadow-card transition-all duration-200 hover:-translate-y-0.5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: m.color_tag }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-warm-dark truncate">{m.full_name}</p>
                  <span className="inline-block text-xs font-medium bg-pastel-lavender-light text-warm-secondary rounded-full px-2.5 py-0.5 mt-0.5">
                    {m.role_name}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-pastel-pink/20">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-warm-secondary">{m.weekly_hour_limit}h/sem</span>
                  <span className={`w-2 h-2 rounded-full ${m.is_active ? "bg-pastel-mint" : "bg-gray-300"}`} />
                </div>
                <div className="flex gap-1">
                  <Tooltip content="Editar">
                    <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg text-warm-secondary hover:bg-pastel-pink-light hover:text-pastel-pink-deep transition-colors">
                      <Pencil size={14} />
                    </button>
                  </Tooltip>
                  {m.is_active && (
                    <Tooltip content="Desactivar">
                      <button onClick={() => setConfirmDelete(m)} className="p-1.5 rounded-lg text-warm-secondary hover:bg-red-50 hover:text-red-400 transition-colors">
                        <UserX size={14} />
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
