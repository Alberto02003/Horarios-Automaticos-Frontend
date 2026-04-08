import { useState, useMemo } from "react";
import { Lock, Unlock } from "lucide-react";
import { useMembers } from "@/api/members";
import { useShiftTypes } from "@/api/shiftTypes";
import { useAssignments, useCreateAssignment, useDeleteAssignment, useToggleLock } from "@/api/schedule";
import ShiftSelector from "./ShiftSelector";
import type { Assignment } from "@/types/schedule";

const DAY_NAMES = ["D", "L", "M", "X", "J", "V", "S"];

interface Props {
  periodId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export default function ScheduleGrid({ periodId, startDate, endDate, isActive }: Props) {
  const { data: members } = useMembers();
  const { data: shiftTypes } = useShiftTypes();
  const { data: assignments } = useAssignments(periodId);
  const createAssignment = useCreateAssignment(periodId);
  const deleteAssignment = useDeleteAssignment(periodId);
  const toggleLock = useToggleLock(periodId);

  const [selectorPos, setSelectorPos] = useState<{ memberId: number; date: string; x: number; y: number } | null>(null);

  const dates = useMemo(() => {
    const result: string[] = [];
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    const current = new Date(start);
    while (current <= end) {
      result.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [startDate, endDate]);

  const stMap = useMemo(() => {
    const map: Record<number, { code: string; color: string; name: string }> = {};
    shiftTypes?.forEach((st) => { map[st.id] = { code: st.code, color: st.color, name: st.name }; });
    return map;
  }, [shiftTypes]);

  const assignmentMap = useMemo(() => {
    const map: Record<string, Assignment> = {};
    assignments?.forEach((a) => { map[`${a.member_id}-${a.date}`] = a; });
    return map;
  }, [assignments]);

  const handleCellClick = (memberId: number, date: string, e: React.MouseEvent) => {
    if (isActive) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setSelectorPos({ memberId, date, x: rect.left, y: rect.bottom });
  };

  const handleSelect = (shiftTypeId: number) => {
    if (!selectorPos) return;
    createAssignment.mutate({ member_id: selectorPos.memberId, date: selectorPos.date, shift_type_id: shiftTypeId });
    setSelectorPos(null);
  };

  const handleRemove = () => {
    if (!selectorPos) return;
    const key = `${selectorPos.memberId}-${selectorPos.date}`;
    const assignment = assignmentMap[key];
    if (assignment) deleteAssignment.mutate(assignment.id);
    setSelectorPos(null);
  };

  const handleLockToggle = (assignment: Assignment, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLock.mutate({ assignmentId: assignment.id, is_locked: !assignment.is_locked });
  };

  const memberHours = useMemo(() => {
    const hours: Record<number, number> = {};
    assignments?.forEach((a) => {
      const st = shiftTypes?.find((s) => s.id === a.shift_type_id);
      if (st?.counts_as_work_time) {
        hours[a.member_id] = (hours[a.member_id] || 0) + 8;
      }
    });
    return hours;
  }, [assignments, shiftTypes]);

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-pastel-pink-light px-3 py-2.5 text-left font-semibold text-warm-dark border-b border-pastel-pink/20 min-w-[150px]">
                Miembro
              </th>
              <th className="sticky left-[150px] z-10 bg-pastel-pink-light px-2 py-2.5 text-center font-semibold text-warm-dark border-b border-r border-pastel-pink/20 w-[50px]">
                Horas
              </th>
              {dates.map((d) => {
                const dayOfWeek = new Date(d + "T00:00:00").getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                return (
                  <th
                    key={d}
                    className={`px-1 py-1.5 text-center font-medium border-b border-pastel-pink/20 min-w-[38px] ${
                      isWeekend ? "bg-pastel-lavender-light/60 text-purple-400" : "bg-pastel-pink-light text-warm-secondary"
                    }`}
                  >
                    <div className="text-[10px]">{DAY_NAMES[dayOfWeek]}</div>
                    <div>{parseInt(d.slice(8))}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {members?.map((member) => (
              <tr key={member.id} className="hover:bg-pastel-pink-light/20 transition-colors">
                <td className="sticky left-0 z-10 bg-pastel-pink-light/90 px-3 py-2 border-b border-pastel-pink/15">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full ring-1 ring-white shrink-0" style={{ backgroundColor: member.color_tag }} />
                    <span className="font-medium text-warm-dark truncate">{member.full_name}</span>
                  </div>
                </td>
                <td className="sticky left-[150px] z-10 bg-pastel-pink-light/90 px-2 py-2 text-center border-b border-r border-pastel-pink/15">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    (memberHours[member.id] || 0) > member.weekly_hour_limit * 4
                      ? "bg-pastel-peach-light text-amber-700"
                      : "text-warm-secondary"
                  }`}>
                    {memberHours[member.id] || 0}h
                  </span>
                </td>
                {dates.map((d) => {
                  const key = `${member.id}-${d}`;
                  const assignment = assignmentMap[key];
                  const st = assignment ? stMap[assignment.shift_type_id] : null;
                  const dayOfWeek = new Date(d + "T00:00:00").getDay();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                  return (
                    <td
                      key={d}
                      onClick={(e) => handleCellClick(member.id, d, e)}
                      className={`px-0.5 py-0.5 border-b border-pastel-pink/10 text-center transition-colors ${
                        isWeekend ? "bg-pastel-lavender-light/30" : ""
                      } ${!isActive ? "cursor-pointer hover:bg-pastel-pink/20" : ""}`}
                    >
                      {st ? (
                        <div
                          className="relative rounded-lg px-1 py-1 text-white font-bold text-[10px] leading-tight shadow-sm"
                          style={{ backgroundColor: st.color }}
                          title={st.name}
                        >
                          {st.code}
                          {assignment.is_locked && (
                            <button onClick={(e) => handleLockToggle(assignment, e)} className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-sm" title="Bloqueado">
                              <Lock size={8} className="text-warm-secondary" />
                            </button>
                          )}
                          {!assignment.is_locked && !isActive && (
                            <button onClick={(e) => handleLockToggle(assignment, e)} className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-sm opacity-0 hover:opacity-100 transition-opacity" title="Bloquear">
                              <Unlock size={8} className="text-warm-secondary" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="h-6" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectorPos && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setSelectorPos(null)} />
          <div className="fixed z-50" style={{ left: selectorPos.x, top: selectorPos.y }}>
            <ShiftSelector
              onSelect={handleSelect}
              onRemove={assignmentMap[`${selectorPos.memberId}-${selectorPos.date}`] ? handleRemove : undefined}
              onClose={() => setSelectorPos(null)}
            />
          </div>
        </>
      )}
    </div>
  );
}
