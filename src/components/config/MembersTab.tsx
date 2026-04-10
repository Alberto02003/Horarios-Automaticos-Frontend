import { Plus, Pencil, UserX } from "lucide-react";
import { useMembers, useCreateMember, useUpdateMember, useDeleteMember } from "@/api/members";
import { useCrudHandler } from "@/hooks/useCrudHandler";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import MemberForm from "@/components/MemberForm";
import type { Member, MemberCreate } from "@/types/member";

export default function MembersTab() {
  const { data: members, isLoading } = useMembers();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const crud = useCrudHandler<Member>();

  const handleCreate = (data: MemberCreate) => { createMember.mutate(data, { onSuccess: () => crud.closeForm() }); };
  const handleUpdate = (data: MemberCreate) => { if (!crud.editing) return; updateMember.mutate({ id: crud.editing.id, data }, { onSuccess: () => crud.closeForm() }); };
  const handleDelete = () => { if (!crud.confirmDelete) return; deleteMember.mutate(crud.confirmDelete.id, { onSuccess: () => crud.closeDelete() }); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-text-tertiary">{members?.length || 0} integrantes</p>
        <button onClick={crud.openCreate} className="btn-primary text-xs px-3 py-1.5 rounded-xl"><Plus size={12} /> Agregar</button>
      </div>

      <Modal open={crud.showForm} onOpenChange={crud.setShowForm} title={crud.editing ? "Editar miembro" : "Nuevo miembro"}>
        <MemberForm member={crud.editing} onSubmit={crud.editing ? handleUpdate : handleCreate} onCancel={crud.closeForm} loading={createMember.isPending || updateMember.isPending} />
      </Modal>
      <ConfirmDialog open={!!crud.confirmDelete} onOpenChange={(o) => { if (!o) crud.closeDelete(); }} title="Desactivar miembro" description={`Se desactivara a ${crud.confirmDelete?.full_name}.`} onConfirm={handleDelete} confirmLabel="Desactivar" variant="warning" />

      {isLoading ? <p className="text-xs text-text-tertiary">Cargando...</p> : (
        <div className="space-y-1.5">
          {members?.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#F0EDF3] group hover:shadow-xs transition-all">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: m.color_tag }}>{m.full_name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{m.full_name}</p>
                <p className="text-[10px] text-text-tertiary">{m.role_name} · {m.weekly_hour_limit}h</p>
              </div>
              <span className={`w-2 h-2 rounded-full ${m.is_active ? "bg-p-mint" : "bg-[#E0DDE3]"}`} />
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip content="Editar"><button onClick={() => crud.openEdit(m)} className="p-1.5 rounded-lg hover:bg-p-lavender-light"><Pencil size={12} className="text-text-secondary" /></button></Tooltip>
                {m.is_active && <Tooltip content="Desactivar"><button onClick={() => crud.openDelete(m)} className="p-1.5 rounded-lg hover:bg-p-pink-light"><UserX size={12} className="text-text-secondary" /></button></Tooltip>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
