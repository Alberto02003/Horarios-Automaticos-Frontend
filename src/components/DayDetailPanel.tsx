import { useMemo, useState } from "react";
import { X, Plus, Lock, Unlock, Trash2 } from "lucide-react";
import { useMembers } from "@/api/members";
import { useShiftTypes } from "@/api/shiftTypes";
import { useAssignments, useCreateAssignment, useDeleteAssignment, useToggleLock } from "@/api/schedule";
import Tooltip from "@/components/ui/Tooltip";
import type { Assignment } from "@/types/schedule";

const DAY_NAMES_FULL = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

interface Props {
  periodId: number;
  date: string;
  isActive: boolean;
  onClose: () => void;
}

export default function DayDetailPanel({ periodId, date, isActive, onClose }: Props) {
  const { data: members } = useMembers();
  const { data: shiftTypes } = useShiftTypes();
  const { data: assignments } = useAssignments(periodId);
  const createAssignment = useCreateAssignment(periodId);
  const deleteAssignment = useDeleteAssignment(periodId);
  const toggleLock = useToggleLock(periodId);

  const [addingForMember, setAddingForMember] = useState<number | null>(null);

  const d = new Date(date + "T00:00:00");
  const dayName = DAY_NAMES_FULL[d.getDay()];
  const monthName = MONTH_NAMES[d.getMonth()];

  const dayAssignments = useMemo(() => {
    return (assignments || []).filter((a) => a.date === date);
  }, [assignments, date]);

  const assignedMemberIds = useMemo(() => new Set(dayAssignments.map((a) => a.member_id)), [dayAssignments]);

  const unassignedMembers = useMemo(() => {
    return (members || []).filter((m) => m.is_active && !assignedMemberIds.has(m.id));
  }, [members, assignedMemberIds]);

  const shiftMap = useMemo(() => {
    const map: Record<number, { code: string; color: string; name: string }> = {};
    shiftTypes?.forEach((s) => { map[s.id] = { code: s.code, color: s.color, name: s.name }; });
    return map;
  }, [shiftTypes]);

  const memberMap = useMemo(() => {
    const map: Record<number, { full_name: string; color_tag: string }> = {};
    members?.forEach((m) => { map[m.id] = { full_name: m.full_name, color_tag: m.color_tag }; });
    return map;
  }, [members]);

  const handleAssign = (memberId: number, shiftTypeId: number) => {
    createAssignment.mutate({ member_id: memberId, date, shift_type_id: shiftTypeId });
    setAddingForMember(null);
  };

  const handleDelete = (assignment: Assignment) => {
    deleteAssignment.mutate(assignment.id);
  };

  const handleToggleLock = (assignment: Assignment) => {
    toggleLock.mutate({ assignmentId: assignment.id, is_locked: !assignment.is_locked });
  };

  return (
    <div className="w-[340px] bg-surface-card border-l border-[#F0EDF3] flex flex-col h-full animate-slide-in">
      {/* Header */}
      <div className="p-5 border-b border-[#F0EDF3]">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-extrabold text-text-primary tracking-tight">{d.getDate()}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors">
            <X size={16} className="text-text-secondary" />
          </button>
        </div>
        <p className="text-sm text-text-secondary">{dayName}, {monthName} {d.getFullYear()}</p>
        <p className="text-xs text-text-tertiary mt-1">{dayAssignments.length} asignacion{dayAssignments.length !== 1 ? "es" : ""}</p>
      </div>

      {/* Assignments list */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {dayAssignments.length === 0 && (
          <div className="text-center py-8 text-text-tertiary text-sm">
            Sin asignaciones para este dia
          </div>
        )}

        {dayAssignments.map((a) => {
          const member = memberMap[a.member_id];
          const shift = shiftMap[a.shift_type_id];
          if (!member || !shift) return null;

          return (
            <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#F0EDF3] group hover:shadow-xs transition-all">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: member.color_tag }}>
                {member.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{member.full_name}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-[1px] rounded-md text-white" style={{ backgroundColor: shift.color }}>
                    {shift.code}
                  </span>
                  <span className="text-[11px] text-text-tertiary">{shift.name}</span>
                </div>
              </div>
              {!isActive && (
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Tooltip content={a.is_locked ? "Desbloquear" : "Bloquear"}>
                    <button onClick={() => handleToggleLock(a)} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors">
                      {a.is_locked ? <Lock size={12} className="text-text-secondary" /> : <Unlock size={12} className="text-text-tertiary" />}
                    </button>
                  </Tooltip>
                  <Tooltip content="Eliminar">
                    <button onClick={() => handleDelete(a)} className="p-1.5 rounded-lg hover:bg-p-pink-light transition-colors">
                      <Trash2 size={12} className="text-text-tertiary" />
                    </button>
                  </Tooltip>
                </div>
              )}
              {a.is_locked && isActive && (
                <Lock size={12} className="text-text-tertiary shrink-0" />
              )}
            </div>
          );
        })}

        {/* Add assignment section */}
        {!isActive && unassignedMembers.length > 0 && (
          <div className="pt-3 border-t border-[#F0EDF3] mt-3">
            <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-2">Agregar asignacion</p>

            {addingForMember === null ? (
              <div className="space-y-1">
                {unassignedMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setAddingForMember(m.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-p-lavender-light/50 transition-colors text-left"
                  >
                    <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: m.color_tag }}>
                      {m.full_name.charAt(0)}
                    </div>
                    <span className="text-sm text-text-secondary">{m.full_name}</span>
                    <Plus size={14} className="ml-auto text-text-tertiary" />
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-xs text-text-secondary mb-2">
                  Turno para {memberMap[addingForMember]?.full_name}:
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  {shiftTypes?.map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleAssign(addingForMember, st.id)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[#F0EDF3] hover:shadow-xs transition-all text-center"
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: st.color }}>
                        {st.code}
                      </div>
                      <span className="text-[10px] text-text-secondary leading-tight">{st.name}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setAddingForMember(null)} className="mt-2 text-xs text-text-tertiary hover:text-text-primary transition-colors">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
