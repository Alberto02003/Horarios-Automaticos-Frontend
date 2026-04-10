import { type DragPayload } from "@/components/drag/DragContext";
import { timeToMinutes } from "@/constants";
import type { Assignment } from "@/types/schedule";

interface ShiftInfo { code: string; name: string; color: string; start_time: string | null; end_time: string | null }
interface MemberInfo { full_name: string; color_tag: string }

interface Props {
  shiftId: number;
  shift: ShiftInfo;
  members_list: Assignment[];
  memberMap: Record<number, MemberInfo>;
  gIdx: number;
  totalGroups: number;
  gridStart: number;
  rowHeight: number;
  scale?: number;
  isMobile: boolean;
  isActive: boolean;
  date: string;
  onDayClick: (date: string) => void;
  dragCtx: { setDragPayload: (p: DragPayload | null) => void; setHighlightedDate: (d: string | null) => void } | null;
}

export default function ShiftGroup({ shiftId, shift, members_list, memberMap, gIdx, totalGroups, gridStart, rowHeight, scale = 1, isMobile, isActive, date, onDayClick, dragCtx }: Props) {
  const gridEndMin = 19 * 60; // GRID_HOURS.length * 60
  const startMin = Math.min(timeToMinutes(shift.start_time, 480) - gridStart * 60, gridEndMin - 60);
  let endMin = timeToMinutes(shift.end_time, 960) - gridStart * 60;
  if (endMin <= startMin) endMin = startMin + (scale > 1 ? 480 : 120);
  endMin = Math.min(endMin, gridEndMin);

  const topRem = (startMin / 60) * rowHeight * scale;
  const contentHeight = (scale > 1 ? 2.5 : (isMobile ? 1.0 : 1.5)) + members_list.length * (scale > 1 ? 1.6 : (isMobile ? 0.85 : 1.1));
  const gap = 2;
  const colWidth = (100 - gap * 2) / totalGroups;
  const widthPct = colWidth - (totalGroups > 1 ? 1 : 0);
  const leftPct = gap + gIdx * colWidth;
  const borderWidth = isMobile ? 2 : (scale > 1 ? 4 : 3);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onDayClick(date); }}
      className="absolute rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 overflow-hidden cursor-pointer hover:brightness-95 transition-all"
      style={{ top: `${topRem}rem`, height: `${contentHeight}rem`, left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: shift.color + "15", borderLeft: `${borderWidth}px solid ${shift.color}` }}
    >
      <p className="text-[8px] sm:text-[10px] font-bold" style={{ color: shift.color }}>
        {shift.code}
        {shift.start_time && scale <= 1 && <span className="hidden md:inline font-normal opacity-70"> {shift.start_time}-{shift.end_time}</span>}
      </p>
      {scale > 1 && (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: shift.color }}>{shift.code}</span>
          <span className="text-sm font-semibold" style={{ color: shift.color }}>{shift.name}</span>
          <span className="text-xs opacity-60" style={{ color: shift.color }}>{shift.start_time || "—"} - {shift.end_time || "—"}</span>
        </div>
      )}
      <div className={scale > 1 ? "space-y-1" : "mt-0.5 space-y-[1px]"}>
        {members_list.map((a) => {
          const m = memberMap[a.member_id];
          if (!m) return null;
          const canDrag = !isActive && !a.is_locked;
          return (
            <div
              key={a.id}
              draggable={canDrag}
              onDragStart={canDrag ? (e) => {
                e.stopPropagation();
                const payload: DragPayload = { type: "move-assignment", memberId: a.member_id, memberName: m.full_name, memberColor: m.color_tag, sourceDate: date, assignmentId: a.id, shiftTypeId: a.shift_type_id };
                e.dataTransfer.setData("text/plain", "drag");
                e.dataTransfer.effectAllowed = "move";
                dragCtx?.setDragPayload(payload);
              } : undefined}
              onDragEnd={canDrag ? () => { dragCtx?.setDragPayload(null); dragCtx?.setHighlightedDate(null); } : undefined}
              className={`flex items-center gap-${scale > 1 ? 2 : 1} ${canDrag ? "cursor-grab active:cursor-grabbing hover:bg-white/30 rounded" : ""}`}
            >
              <div className={`${scale > 1 ? "w-5 h-5" : "w-1.5 sm:w-2 h-1.5 sm:h-2"} rounded-full shrink-0 ${scale > 1 ? "flex items-center justify-center text-white text-[8px] font-bold" : ""}`} style={{ backgroundColor: m.color_tag }}>
                {scale > 1 ? m.full_name.charAt(0) : null}
              </div>
              <span className={`${scale > 1 ? "text-sm" : "text-[8px] sm:text-[10px]"} text-text-primary leading-tight`}>
                {isMobile && scale <= 1 ? m.full_name.split(" ")[0] : m.full_name}
              </span>
              {a.is_locked && <span className={`text-${scale > 1 ? "[10px] text-text-tertiary" : "[7px] sm:text-[8px]"}`}>🔒</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
