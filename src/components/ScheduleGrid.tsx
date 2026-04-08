import { useState, useMemo } from "react";
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

  // Generate array of dates for the period
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

  // Map shift types by id
  const stMap = useMemo(() => {
    const map: Record<number, { code: string; color: string; name: string }> = {};
    shiftTypes?.forEach((st) => { map[st.id] = { code: st.code, color: st.color, name: st.name }; });
    return map;
  }, [shiftTypes]);

  // Map assignments by "memberId-date"
  const assignmentMap = useMemo(() => {
    const map: Record<string, Assignment> = {};
    assignments?.forEach((a) => { map[`${a.member_id}-${a.date}`] = a; });
    return map;
  }, [assignments]);

  const handleCellClick = (memberId: number, date: string, e: React.MouseEvent) => {
    if (isActive) return; // Can't edit active periods
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setSelectorPos({ memberId, date, x: rect.left, y: rect.bottom });
  };

  const handleSelect = (shiftTypeId: number) => {
    if (!selectorPos) return;
    createAssignment.mutate({
      member_id: selectorPos.memberId,
      date: selectorPos.date,
      shift_type_id: shiftTypeId,
    });
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

  // Count hours per member
  const memberHours = useMemo(() => {
    const hours: Record<number, number> = {};
    assignments?.forEach((a) => {
      const st = shiftTypes?.find((s) => s.id === a.shift_type_id);
      if (st?.counts_as_work_time) {
        hours[a.member_id] = (hours[a.member_id] || 0) + 8; // Simplified: 8h per shift
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
              <th className="sticky left-0 z-10 bg-white px-3 py-2 text-left font-medium text-pink-900 border-b border-r border-pink-100 min-w-[140px]">
                Miembro
              </th>
              <th className="sticky left-[140px] z-10 bg-white px-2 py-2 text-center font-medium text-pink-900 border-b border-r border-pink-100 w-[50px]">
                Horas
              </th>
              {dates.map((d) => {
                const dayOfWeek = new Date(d + "T00:00:00").getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                return (
                  <th
                    key={d}
                    className={`px-1 py-1 text-center font-medium border-b border-pink-100 min-w-[36px] ${
                      isWeekend ? "bg-pink-50/80 text-pink-600" : "text-gray-600"
                    }`}
                  >
                    <div>{DAY_NAMES[dayOfWeek]}</div>
                    <div className="text-[10px]">{parseInt(d.slice(8))}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {members?.map((member) => (
              <tr key={member.id} className="hover:bg-pink-50/20">
                <td className="sticky left-0 z-10 bg-white px-3 py-1.5 border-b border-r border-pink-100">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: member.color_tag }} />
                    <span className="font-medium text-gray-900 truncate">{member.full_name}</span>
                  </div>
                </td>
                <td className="sticky left-[140px] z-10 bg-white px-2 py-1.5 text-center border-b border-r border-pink-100">
                  <span className={`font-medium ${
                    (memberHours[member.id] || 0) > member.weekly_hour_limit * 4 ? "text-red-500" : "text-gray-600"
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
                      className={`px-0.5 py-0.5 border-b border-pink-50 text-center cursor-pointer transition-colors ${
                        isWeekend ? "bg-pink-50/40" : ""
                      } ${!isActive ? "hover:bg-pink-100/50" : ""}`}
                    >
                      {st ? (
                        <div
                          className="relative rounded px-1 py-0.5 text-white font-bold text-[10px] leading-tight"
                          style={{ backgroundColor: st.color }}
                          title={st.name}
                        >
                          {st.code}
                          {assignment.is_locked && (
                            <button
                              onClick={(e) => handleLockToggle(assignment, e)}
                              className="absolute -top-1 -right-1 text-[8px]"
                              title="Bloqueado"
                            >🔒</button>
                          )}
                          {!assignment.is_locked && !isActive && (
                            <button
                              onClick={(e) => handleLockToggle(assignment, e)}
                              className="absolute -top-1 -right-1 text-[8px] opacity-0 hover:opacity-100"
                              title="Bloquear"
                            >🔓</button>
                          )}
                        </div>
                      ) : (
                        <div className="h-5" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Shift selector popup */}
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
