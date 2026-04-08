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
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Equipo</h2>
          <p className="text-sm text-text-secondary mt-0.5">{members?.length || 0} integrantes</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Agregar
        </button>
      </div>

      <Modal open={showForm} onOpenChange={setShowForm} title={editing ? "Editar miembro" : "Nuevo miembro"}>
        <MemberForm member={editing} onSubmit={editing ? handleUpdate : handleCreate} onCancel={() => setShowForm(false)} loading={createMember.isPending || updateMember.isPending} />
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => { if (!open) setConfirmDelete(null); }}
        title="Desactivar miembro"
        description={`Se desactivara a ${confirmDelete?.full_name}.`}
        onConfirm={handleDelete}
        confirmLabel="Desactivar"
        variant="warning"
      />

      {isLoading ? (
        <div className="text-text-tertiary text-sm">Cargando...</div>
      ) : !members?.length ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-p-lavender-light flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-text-tertiary" />
          </div>
          <p className="text-lg font-semibold text-text-primary">Sin miembros</p>
          <p className="text-sm text-text-secondary mt-1">Agrega integrantes para empezar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.id} className="bg-surface-card rounded-xl border border-[#F0EDF3] px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-all duration-150 group">
              <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: m.color_tag }}>
                {m.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary text-[15px] truncate">{m.full_name}</p>
                <p className="text-xs text-text-secondary mt-0.5">{m.role_name}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-text-primary">{m.weekly_hour_limit}h</p>
                  <p className="text-[10px] text-text-tertiary uppercase tracking-wide">por semana</p>
                </div>
                <span className={`w-2 h-2 rounded-full shrink-0 ${m.is_active ? "bg-p-mint" : "bg-[#E0DDE3]"}`} />
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Tooltip content="Editar">
                    <button onClick={() => openEdit(m)} className="p-2 rounded-lg hover:bg-p-lavender-light transition-colors">
                      <Pencil size={14} className="text-text-secondary" />
                    </button>
                  </Tooltip>
                  {m.is_active && (
                    <Tooltip content="Desactivar">
                      <button onClick={() => setConfirmDelete(m)} className="p-2 rounded-lg hover:bg-p-pink-light transition-colors">
                        <UserX size={14} className="text-text-secondary" />
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
