import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DragMembersPanel from "@/components/drag/DragMembersPanel";
import ShiftsInfoWidget from "@/components/ShiftsInfoWidget";
import { DAYS_SHORT, DAYS_FULL, GRID_HOURS } from "@/constants";
import ShiftGroup from "./ShiftGroup";
import type { CalendarData } from "./useCalendarData";
import type { Assignment } from "@/types/schedule";
import type { ReactNode } from "react";

interface Props {
  data: CalendarData;
  viewToggle: ReactNode;
}

export default function DayView({ data, viewToggle }: Props) {
  const { periodStart, periodEnd, assignmentsByDate, shiftMap, memberMap, today, miniCalDays, isActive, dragCtx, onDayClick, handleDragOver, handleDragLeave, handleDrop, onOpenConfig, CAL_HEIGHT, ROW_HEIGHT, isMobile, MONTHS_FULL } = data;
  const GRID_START = 6;

  const [currentDayStr, setCurrentDayStr] = useState(() => today);
  const currentDayDate = new Date(currentDayStr + "T00:00:00");
  const dayAssignments = assignmentsByDate[currentDayStr] || [];

  const prevDay = () => {
    const d = new Date(currentDayStr + "T00:00:00");
    d.setDate(d.getDate() - 1);
    if (d >= periodStart) setCurrentDayStr(d.toISOString().slice(0, 10));
  };
  const nextDay = () => {
    const d = new Date(currentDayStr + "T00:00:00");
    d.setDate(d.getDate() + 1);
    if (d <= periodEnd) setCurrentDayStr(d.toISOString().slice(0, 10));
  };

  const shiftGroups = useMemo(() => {
    const groups: Record<number, Assignment[]> = {};
    dayAssignments.forEach((a) => {
      if (!groups[a.shift_type_id]) groups[a.shift_type_id] = [];
      groups[a.shift_type_id].push(a);
    });
    return Object.entries(groups);
  }, [dayAssignments]);
  const SCALE = 1.2;

  return (
    <div className="flex gap-6">
      <div className="hidden lg:flex lg:w-[240px] shrink-0 flex-col gap-3" style={{ maxHeight: CAL_HEIGHT }}>
        <div className="bg-surface-card rounded-xl border border-[#F0EDF3] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text-primary">{MONTHS_FULL[periodStart.getMonth()]} {periodStart.getFullYear()}</h3>
            <div className="flex gap-1">
              <button onClick={prevDay} className="p-1 rounded-md hover:bg-p-lavender-light transition-colors"><ChevronLeft size={14} className="text-p-blue" /></button>
              <button onClick={nextDay} className="p-1 rounded-md hover:bg-p-lavender-light transition-colors"><ChevronRight size={14} className="text-p-blue" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0">
            {DAYS_SHORT.map((d) => <div key={d} className="text-[10px] font-medium text-text-tertiary text-center py-1">{d}</div>)}
            {miniCalDays.map((d, i) => {
              const isCurrentDay = d.date === currentDayStr;
              const isToday = d.date === today;
              const hasAssignments = (assignmentsByDate[d.date]?.length || 0) > 0;
              return (
                <button key={i} onClick={() => setCurrentDayStr(d.date)} className={`text-xs py-1.5 rounded-md transition-colors relative ${!d.inMonth ? "text-text-tertiary/40" : isCurrentDay ? "bg-p-pink text-text-primary font-bold" : isToday ? "bg-text-primary text-white font-bold" : "text-text-primary hover:bg-p-lavender-light"}`}>
                  {d.day}
                  {hasAssignments && d.inMonth && !isToday && !isCurrentDay && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-p-pink" />}
                </button>
              );
            })}
          </div>
        </div>
        {!isActive && dragCtx && <DragMembersPanel onOpenConfig={onOpenConfig} />}
        <ShiftsInfoWidget onOpenConfig={onOpenConfig} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={prevDay} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors"><ChevronLeft size={18} className="text-text-secondary" /></button>
            <button onClick={nextDay} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors"><ChevronRight size={18} className="text-text-secondary" /></button>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">{DAYS_FULL[currentDayDate.getDay()]}, {currentDayDate.getDate()} de {MONTHS_FULL[currentDayDate.getMonth()]}</h2>
          </div>
          {viewToggle}
        </div>

        <div className="bg-surface-card rounded-xl border border-[#F0EDF3] overflow-auto" style={{ height: CAL_HEIGHT }}>
          <div className="relative" style={{ height: `${GRID_HOURS.length * ROW_HEIGHT * SCALE}rem` }}>
            {GRID_HOURS.map((hour, i) => (
              <div key={hour} className="absolute left-0 right-0 border-t border-[#F0EDF3]/60" style={{ top: `${i * ROW_HEIGHT * SCALE}rem` }}>
                <div className="text-right pr-2 sm:pr-3 -mt-2"><span className="text-xs font-medium text-text-tertiary">{String(hour % 24).padStart(2, "0")}:00</span></div>
              </div>
            ))}

            <div className={`absolute inset-0 transition-colors ${dragCtx?.highlightedDate === currentDayStr ? "bg-p-mint-light/30 ring-2 ring-inset ring-p-mint rounded-lg" : ""}`}
              style={{ marginLeft: isMobile ? "45px" : "70px" }}
              onDragOver={(e) => handleDragOver(e, currentDayStr)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, currentDayStr)}
            >
              {shiftGroups.map(([shiftId, members_list], gIdx) => {
                const shift = shiftMap[Number(shiftId)];
                if (!shift) return null;
                return (
                  <ShiftGroup key={shiftId} shiftId={Number(shiftId)} shift={shift} members_list={members_list} memberMap={memberMap}
                    gIdx={gIdx} totalGroups={shiftGroups.length} gridStart={GRID_START} rowHeight={ROW_HEIGHT} scale={SCALE}
                    isMobile={isMobile} isActive={isActive} date={currentDayStr} onDayClick={onDayClick} dragCtx={dragCtx} />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
