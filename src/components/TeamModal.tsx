import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Plus, Pencil, UserX } from "lucide-react";
import { useMembers, useCreateMember, useUpdateMember, useDeleteMember } from "@/api/members";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import MemberForm from "@/components/MemberForm";
import type { Member, MemberCreate } from "@/types/member";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TeamModal({ open, onOpenChange }: Props) {
  const { data: members, isLoading } = useMembers();
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Member | null>(null);

  const handleCreate = (data: MemberCreate) => { createMember.mutate(data, { onSuccess: () => setShowForm(false) }); };
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
    <>
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-text-primary/20 backdrop-blur-sm animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-surface-card rounded-2xl w-[calc(100%-2rem)] sm:w-full max-w-2xl max-h-[80vh] shadow-lg border border-[#F0EDF3] animate-scale-in focus:outline-none flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-[#F0EDF3] shrink-0">
              <div>
                <Dialog.Title className="text-lg font-bold text-text-primary tracking-tight">Equipo</Dialog.Title>
                <p className="text-xs text-text-tertiary mt-0.5">{members?.length || 0} integrantes</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={openCreate} className="btn-primary text-xs px-3 py-2"><Plus size={14} /> Agregar</button>
                <Dialog.Close className="p-1.5 rounded-lg text-text-tertiary hover:bg-p-lavender-light transition-colors"><X size={16} /></Dialog.Close>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? <p className="text-text-tertiary text-sm p-4">Cargando...</p> : !members?.length ? (
                <p className="text-center text-text-tertiary py-12">Sin miembros</p>
              ) : (
                <div className="space-y-1.5">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#F0EDF3] group hover:shadow-xs transition-all">
                      <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: m.color_tag }}>
                        {m.full_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{m.full_name}</p>
                        <p className="text-[11px] text-text-tertiary">{m.role_name} · {m.weekly_hour_limit}h/sem</p>
                      </div>
                      <span className={`w-2 h-2 rounded-full ${m.is_active ? "bg-p-mint" : "bg-[#E0DDE3]"}`} />
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip content="Editar"><button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors"><Pencil size={13} className="text-text-secondary" /></button></Tooltip>
                        {m.is_active && <Tooltip content="Desactivar"><button onClick={() => setConfirmDelete(m)} className="p-1.5 rounded-lg hover:bg-p-pink-light transition-colors"><UserX size={13} className="text-text-secondary" /></button></Tooltip>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Modal open={showForm} onOpenChange={setShowForm} title={editing ? "Editar miembro" : "Nuevo miembro"}>
        <MemberForm member={editing} onSubmit={editing ? handleUpdate : handleCreate} onCancel={() => setShowForm(false)} loading={createMember.isPending || updateMember.isPending} />
      </Modal>

      <ConfirmDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }} title="Desactivar miembro" description={`Se desactivara a ${confirmDelete?.full_name}.`} onConfirm={handleDelete} confirmLabel="Desactivar" variant="warning" />
    </>
  );
}
