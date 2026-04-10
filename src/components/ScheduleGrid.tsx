import { useState, useMemo, useRef, useCallback } from "react";
import * as RadixPopover from "@radix-ui/react-popover";
import { Lock, Unlock, Trash2, X, Paintbrush } from "lucide-react";
import { useMembers } from "@/api/members";
import { useShiftTypes } from "@/api/shiftTypes";
import { useAssignments, useCreateAssignment, useDeleteAssignment, useToggleLock, useBulkUpdateAssignments, useBulkDeleteAssignments } from "@/api/schedule";
import { useShiftMap } from "@/hooks/useMaps";
import { DragProvider, useDrag } from "@/components/drag/DragContext";
import DragMembersPanel from "@/components/drag/DragMembersPanel";
import ShiftPickerPopover from "@/components/drag/ShiftPickerPopover";
import ShiftSelector from "./ShiftSelector";
import Tooltip from "@/components/ui/Tooltip";
import type { Assignment } from "@/types/schedule";

const DAY_NAMES = ["D", "L", "M", "X", "J", "V", "S"];

interface Props {
  periodId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  onOpenConfig?: () => void;
}

export default function ScheduleGrid(props: Props) {
  const isDraft = !props.isActive;
  return isDraft ? (
    <DragProvider>
      <div className="bg-surface-card rounded-2xl border border-[#F0EDF3] overflow-hidden shadow-xs">
        <ScheduleGridInner {...props} />
      </div>
      <ShiftPickerPopover periodId={props.periodId} />
    </DragProvider>
  ) : (
    <div className="bg-surface-card rounded-2xl border border-[#F0EDF3] overflow-hidden shadow-xs">
      <ScheduleGridInner {...props} />
    </div>
  );
}

function ScheduleGridInner({ periodId, startDate, endDate, isActive, onOpenConfig }: Props) {
  const { data: members } = useMembers();
  const { data: shiftTypes } = useShiftTypes();
  const { data: assignments } = useAssignments(periodId);
  const createAssignment = useCreateAssignment(periodId);
  const deleteAssignment = useDeleteAssignment(periodId);
  const toggleLock = useToggleLock(periodId);
  const bulkUpdate = useBulkUpdateAssignments(periodId);
  const bulkDelete = useBulkDeleteAssignments(periodId);

  const dragCtx = useDrag();

  const [openCell, setOpenCell] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkShiftOpen, setBulkShiftOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dropHighlight, setDropHighlight] = useState<string | null>(null);
  const [focusedCell, setFocusedCell] = useState<string | null>(null);
  const dragStart = useRef<string | null>(null);
  const cellRefs = useRef<Record<string, HTMLTableCellElement | null>>({});

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

  const stMap = useShiftMap(shiftTypes);
  const assignmentMap = useMemo(() => {
    const map: Record<string, Assignment> = {};
    assignments?.forEach((a) => { map[`${a.member_id}-${a.date}`] = a; });
    return map;
  }, [assignments]);

  const selectedAssignments = useMemo(() => {
    const result: Assignment[] = [];
    selected.forEach((key) => {
      const a = assignmentMap[key];
      if (a) result.push(a);
    });
    return result;
  }, [selected, assignmentMap]);

  const selectedIds = useMemo(() => selectedAssignments.map((a) => a.id), [selectedAssignments]);

  // --- Single cell actions ---
  const handleSelect = (memberId: number, date: string, shiftTypeId: number) => {
    createAssignment.mutate({ member_id: memberId, date, shift_type_id: shiftTypeId });
    setOpenCell(null);
  };

  const handleRemove = (memberId: number, date: string) => {
    const key = `${memberId}-${date}`;
    const assignment = assignmentMap[key];
    if (assignment) deleteAssignment.mutate(assignment.id);
    setOpenCell(null);
  };

  const handleLockToggle = (assignment: Assignment, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLock.mutate({ assignmentId: assignment.id, is_locked: !assignment.is_locked });
  };

  // --- Multi-select ---
  const toggleCell = useCallback((key: string, additive: boolean) => {
    setSelected((prev) => {
      const next = new Set(additive ? prev : []);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const handleCellMouseDown = useCallback((key: string, e: React.MouseEvent) => {
    if (isActive) return;
    // Right-click or single-cell popover: ignore
    if (e.button !== 0) return;
    // Ctrl/Meta click: toggle additive
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      toggleCell(key, true);
      return;
    }
    // Start range drag
    dragStart.current = key;
    setIsDragging(true);
    setSelected(new Set([key]));
    e.preventDefault();
  }, [isActive, toggleCell]);

  const handleCellMouseEnter = useCallback((key: string) => {
    if (!isDragging || !dragStart.current) return;
    // Build rectangular selection between dragStart and current
    const [startMember, ...startDateParts] = dragStart.current.split("-");
    const startDate = startDateParts.join("-");
    const [endMember, ...endDateParts] = key.split("-");
    const endDate = endDateParts.join("-");
    if (!members) return;

    const memberIds = members.map((m) => m.id);
    const mi1 = memberIds.indexOf(Number(startMember));
    const mi2 = memberIds.indexOf(Number(endMember));
    const di1 = dates.indexOf(startDate);
    const di2 = dates.indexOf(endDate);
    if (mi1 < 0 || mi2 < 0 || di1 < 0 || di2 < 0) return;

    const minM = Math.min(mi1, mi2), maxM = Math.max(mi1, mi2);
    const minD = Math.min(di1, di2), maxD = Math.max(di1, di2);
    const next = new Set<string>();
    for (let m = minM; m <= maxM; m++) {
      for (let d = minD; d <= maxD; d++) {
        next.add(`${memberIds[m]}-${dates[d]}`);
      }
    }
    setSelected(next);
  }, [isDragging, members, dates]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
    setBulkShiftOpen(false);
  }, []);

  // --- Keyboard navigation ---
  const getCellCoords = useCallback((key: string): [number, number] | null => {
    if (!members) return null;
    const [memberId, ...dateParts] = key.split("-");
    const date = dateParts.join("-");
    const mi = members.findIndex((m) => m.id === Number(memberId));
    const di = dates.indexOf(date);
    return mi >= 0 && di >= 0 ? [mi, di] : null;
  }, [members, dates]);

  const getKeyFromCoords = useCallback((mi: number, di: number): string | null => {
    if (!members || mi < 0 || mi >= members.length || di < 0 || di >= dates.length) return null;
    return `${members[mi].id}-${dates[di]}`;
  }, [members, dates]);

  const handleCellKeyDown = useCallback((key: string, e: React.KeyboardEvent) => {
    if (isActive) return;
    const coords = getCellCoords(key);
    if (!coords) return;
    const [mi, di] = coords;

    let targetKey: string | null = null;

    switch (e.key) {
      case "ArrowRight": targetKey = getKeyFromCoords(mi, di + 1); break;
      case "ArrowLeft": targetKey = getKeyFromCoords(mi, di - 1); break;
      case "ArrowDown": targetKey = getKeyFromCoords(mi + 1, di); break;
      case "ArrowUp": targetKey = getKeyFromCoords(mi - 1, di); break;
      case " ":
      case "Enter":
        e.preventDefault();
        toggleCell(key, e.shiftKey || e.ctrlKey || e.metaKey);
        return;
      case "Escape":
        clearSelection();
        return;
      default: return;
    }

    if (!targetKey) return;
    e.preventDefault();
    setFocusedCell(targetKey);
    cellRefs.current[targetKey]?.focus();

    if (e.shiftKey) {
      toggleCell(targetKey, true);
    }
  }, [isActive, getCellCoords, getKeyFromCoords, toggleCell, clearSelection]);

  // --- Bulk actions ---
  const handleBulkShift = (shiftTypeId: number) => {
    if (selectedIds.length > 0) {
      bulkUpdate.mutate({ ids: selectedIds, shift_type_id: shiftTypeId }, { onSuccess: clearSelection });
    }
    // Also create for empty cells
    const emptyCells: { member_id: number; date: string; shift_type_id: number }[] = [];
    selected.forEach((key) => {
      if (!assignmentMap[key]) {
        const [memberId, ...dateParts] = key.split("-");
        emptyCells.push({ member_id: Number(memberId), date: dateParts.join("-"), shift_type_id: shiftTypeId });
      }
    });
    if (emptyCells.length > 0) {
      emptyCells.forEach((c) => createAssignment.mutate(c));
    }
    setBulkShiftOpen(false);
    if (emptyCells.length > 0 && selectedIds.length === 0) clearSelection();
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    bulkDelete.mutate(selectedIds, { onSuccess: clearSelection, onError: clearSelection });
  };

  const handleBulkLock = (lock: boolean) => {
    if (selectedIds.length === 0) return;
    bulkUpdate.mutate({ ids: selectedIds, is_locked: lock }, { onSuccess: clearSelection, onError: clearSelection });
  };

  const memberHours = useMemo(() => {
    const hours: Record<number, number> = {};
    assignments?.forEach((a) => {
      const st = stMap[a.shift_type_id];
      if (st?.counts_as_work_time) {
        let h = 8;
        if (st.start_time && st.end_time) {
          const [sh, sm] = st.start_time.split(":").map(Number);
          const [eh, em] = st.end_time.split(":").map(Number);
          h = Math.max((eh * 60 + em - sh * 60 - sm) / 60, 0);
        }
        hours[a.member_id] = (hours[a.member_id] || 0) + h;
      }
    });
    return hours;
  }, [assignments, stMap]);

  // --- Drag & drop from members panel ---
  const handleDragOver = useCallback((e: React.DragEvent, memberId: number, date: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    const key = `${memberId}-${date}`;
    setDropHighlight(key);
    dragCtx?.setHighlightedDate(date);
  }, [dragCtx]);

  const handleDragLeave = useCallback(() => {
    setDropHighlight(null);
    dragCtx?.setHighlightedDate(null);
  }, [dragCtx]);

  const handleDrop = useCallback((e: React.DragEvent, memberId: number, date: string) => {
    e.preventDefault();
    setDropHighlight(null);
    dragCtx?.setHighlightedDate(null);

    const payload = dragCtx?.dragPayload;
    if (!payload) return;
    dragCtx?.setDropResult({ date, payload: { ...payload, memberId }, x: e.clientX, y: e.clientY });
  }, [dragCtx]);

  return (
    <div className="flex gap-4">
      {/* Members panel for drag source */}
      {!isActive && dragCtx && (
        <div className="hidden lg:flex lg:w-[200px] shrink-0 flex-col gap-3 py-4 pl-4">
          <DragMembersPanel onOpenConfig={onOpenConfig} />
        </div>
      )}
      <div className="flex-1 min-w-0 relative" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Bulk action bar */}
      {selected.size > 0 && !isActive && (
        <div className="sticky top-0 z-30 flex items-center gap-2 bg-white/95 backdrop-blur border-b border-[#F0EDF3] px-4 py-2.5 shadow-sm">
          <span className="text-xs font-semibold text-text-primary">
            {selected.size} celda{selected.size > 1 ? "s" : ""} · {selectedAssignments.length} asignacion{selectedAssignments.length !== 1 ? "es" : ""}
          </span>
          <div className="h-4 w-px bg-[#F0EDF3] mx-1" />

          <RadixPopover.Root open={bulkShiftOpen} onOpenChange={setBulkShiftOpen}>
            <RadixPopover.Trigger asChild>
              <button className="btn-pastel-pink text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <Paintbrush size={13} /> Asignar turno
              </button>
            </RadixPopover.Trigger>
            <RadixPopover.Portal>
              <RadixPopover.Content side="bottom" align="start" sideOffset={4} className="z-50 bg-surface-card rounded-xl border border-[#F0EDF3] shadow-lg p-2 min-w-[180px] animate-scale-in focus:outline-none">
                <ShiftSelector onSelect={handleBulkShift} onClose={() => setBulkShiftOpen(false)} />
              </RadixPopover.Content>
            </RadixPopover.Portal>
          </RadixPopover.Root>

          {selectedAssignments.length > 0 && (
            <>
              <Tooltip content="Bloquear seleccion">
                <button onClick={() => handleBulkLock(true)} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors"><Lock size={14} className="text-text-secondary" /></button>
              </Tooltip>
              <Tooltip content="Desbloquear seleccion">
                <button onClick={() => handleBulkLock(false)} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors"><Unlock size={14} className="text-text-secondary" /></button>
              </Tooltip>
              <Tooltip content="Eliminar seleccion">
                <button onClick={handleBulkDelete} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 size={14} className="text-red-400" /></button>
              </Tooltip>
            </>
          )}

          <div className="flex-1" />
          <button onClick={clearSelection} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors">
            <X size={14} className="text-text-tertiary" />
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table role="grid" aria-label="Tabla de asignaciones" className="text-xs border-collapse w-full select-none">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface px-4 py-3 text-left text-[10px] font-semibold text-text-tertiary uppercase tracking-wide border-b border-[#F0EDF3] min-w-[160px]">
                Miembro
              </th>
              <th className="sticky left-[160px] z-10 bg-surface px-2 py-3 text-center text-[10px] font-semibold text-text-tertiary uppercase tracking-wide border-b border-r border-[#F0EDF3] w-[50px]">
                Horas
              </th>
              {dates.map((d) => {
                const dayOfWeek = new Date(d + "T00:00:00").getDay();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                return (
                  <th key={d} className={`px-1 py-2 text-center border-b border-[#F0EDF3] min-w-[38px] ${isWeekend ? "bg-p-lavender-light/50" : "bg-surface"}`}>
                    <div className={`text-[10px] font-semibold ${isWeekend ? "text-purple-400" : "text-text-tertiary"}`}>{DAY_NAMES[dayOfWeek]}</div>
                    <div className="text-xs font-medium text-text-secondary">{parseInt(d.slice(8))}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {members?.map((member) => (
              <tr key={member.id} className="group hover:bg-p-lavender-light/20 transition-colors">
                <td className="sticky left-0 z-10 bg-surface-card group-hover:bg-p-lavender-light/20 px-4 py-2 border-b border-[#F0EDF3] transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: member.color_tag }}>
                      {member.full_name.charAt(0)}
                    </div>
                    <span className="font-medium text-text-primary text-[13px] truncate">{member.full_name}</span>
                  </div>
                </td>
                <td className="sticky left-[160px] z-10 bg-surface-card group-hover:bg-p-lavender-light/20 px-2 py-2 text-center border-b border-r border-[#F0EDF3] transition-colors">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    (memberHours[member.id] || 0) > member.weekly_hour_limit * 4
                      ? "bg-p-peach text-amber-800"
                      : "text-text-secondary"
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
                  const isOpen = openCell === key;
                  const isSelected = selected.has(key);

                  return (
                    <td
                      key={d}
                      ref={(el) => { cellRefs.current[key] = el; }}
                      tabIndex={!isActive ? 0 : undefined}
                      role={!isActive ? "gridcell" : undefined}
                      aria-selected={isSelected}
                      onMouseDown={(e) => handleCellMouseDown(key, e)}
                      onMouseEnter={() => handleCellMouseEnter(key)}
                      onKeyDown={(e) => handleCellKeyDown(key, e)}
                      onFocus={() => setFocusedCell(key)}
                      onDragOver={(e) => handleDragOver(e, member.id, d)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, member.id, d)}
                      className={`px-0.5 py-0.5 border-b border-[#F0EDF3]/60 text-center transition-colors outline-none focus:ring-2 focus:ring-p-blue focus:ring-inset ${
                        isWeekend ? "bg-p-lavender-light/30" : ""
                      } ${!isActive ? "cursor-pointer hover:bg-p-pink-light/40" : ""} ${
                        isSelected ? "!bg-p-pink-light/50 ring-1 ring-inset ring-p-pink-medium" : ""
                      } ${dropHighlight === key ? "!bg-p-mint-light/40 ring-2 ring-inset ring-p-mint" : ""}`}
                    >
                      {/* Single-cell popover only when not in multi-select mode */}
                      {selected.size === 0 ? (
                        <RadixPopover.Root open={isOpen} onOpenChange={(open) => { if (!isActive) setOpenCell(open ? key : null); }}>
                          <RadixPopover.Trigger asChild>
                            <div className="w-full h-full min-h-[28px]">
                              {st ? (
                                <CellContent st={st} assignment={assignment} isActive={isActive} onLockToggle={handleLockToggle} />
                              ) : null}
                            </div>
                          </RadixPopover.Trigger>
                          <RadixPopover.Portal>
                            <RadixPopover.Content side="bottom" align="start" sideOffset={4} collisionPadding={8} className="z-50 bg-surface-card rounded-xl border border-[#F0EDF3] shadow-lg p-2 min-w-[180px] animate-scale-in focus:outline-none">
                              <ShiftSelector onSelect={(shiftTypeId) => handleSelect(member.id, d, shiftTypeId)} onRemove={assignment ? () => handleRemove(member.id, d) : undefined} onClose={() => setOpenCell(null)} />
                            </RadixPopover.Content>
                          </RadixPopover.Portal>
                        </RadixPopover.Root>
                      ) : (
                        <div className="w-full h-full min-h-[28px]">
                          {st ? (
                            <CellContent st={st} assignment={assignment} isActive={isActive} onLockToggle={handleLockToggle} />
                          ) : null}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}

function CellContent({ st, assignment, isActive, onLockToggle }: {
  st: { code: string; color: string; name: string };
  assignment: Assignment;
  isActive: boolean;
  onLockToggle: (a: Assignment, e: React.MouseEvent) => void;
}) {
  return (
    <div
      className="relative rounded-md px-1 py-1.5 text-white font-bold text-[10px] leading-none"
      style={{ backgroundColor: st.color }}
      title={st.name}
    >
      {st.code}
      {assignment.is_locked && (
        <Tooltip content="Desbloquear">
          <button onClick={(e) => onLockToggle(assignment, e)} className="absolute -top-1 -right-1 bg-white rounded-full p-[2px] shadow-xs">
            <Lock size={7} className="text-text-tertiary" />
          </button>
        </Tooltip>
      )}
      {!assignment.is_locked && !isActive && (
        <Tooltip content="Bloquear">
          <button onClick={(e) => onLockToggle(assignment, e)} className="absolute -top-1 -right-1 bg-white rounded-full p-[2px] shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <Unlock size={7} className="text-text-tertiary" />
          </button>
        </Tooltip>
      )}
    </div>
  );
}
