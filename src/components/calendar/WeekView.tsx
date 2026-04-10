import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DragMembersPanel from "@/components/drag/DragMembersPanel";
import ShiftsInfoWidget from "@/components/ShiftsInfoWidget";
import { DAYS_SHORT, DAYS_HEADER_EN, GRID_HOURS, formatDateRange, getWeekNumber, getMondayOfWeek } from "@/constants";
import ShiftGroup from "./ShiftGroup";
import type { CalendarData } from "./useCalendarData";
import type { Assignment } from "@/types/schedule";
import type { ReactNode } from "react";

interface Props { data: CalendarData; viewToggle: ReactNode; }

export default function WeekView({ data, viewToggle }: Props) {
  const { periodStart, periodEnd, assignmentsByDate, shiftMap, memberMap, today, selectedDay, miniCalDays, isActive, dragCtx, onDayClick, handleDragOver, handleDragLeave, handleDrop, onOpenConfig, CAL_HEIGHT, ROW_HEIGHT, TIME_COL, isMobile, MONTHS_FULL } = data;
  const GRID_START = 6;

  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMondayOfWeek(periodStart));

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentWeekStart); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10);
  }), [currentWeekStart]);

  const prevWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); if (d >= getMondayOfWeek(periodStart)) setCurrentWeekStart(d); };
  const nextWeek = () => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); if (d <= periodEnd) setCurrentWeekStart(d); };

  return (
    <div className="flex gap-6">
      <div className="hidden lg:flex lg:w-[240px] shrink-0 flex-col gap-3" style={{ maxHeight: CAL_HEIGHT }}>
        <div className="bg-surface-card rounded-xl border border-[#F0EDF3] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text-primary">{MONTHS_FULL[periodStart.getMonth()]} {periodStart.getFullYear()}</h3>
            <div className="flex gap-1">
              <button onClick={prevWeek} className="p-1 rounded-md hover:bg-p-lavender-light transition-colors"><ChevronLeft size={14} className="text-p-blue" /></button>
              <button onClick={nextWeek} className="p-1 rounded-md hover:bg-p-lavender-light transition-colors"><ChevronRight size={14} className="text-p-blue" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0">
            {DAYS_SHORT.map((d) => <div key={d} className="text-[10px] font-medium text-text-tertiary text-center py-1">{d}</div>)}
            {miniCalDays.map((d, i) => {
              const isInWeek = weekDates.includes(d.date);
              const isToday = d.date === today;
              const hasAssignments = (assignmentsByDate[d.date]?.length || 0) > 0;
              return (
                <button key={i} onClick={() => setCurrentWeekStart(getMondayOfWeek(new Date(d.date + "T00:00:00")))}
                  className={`text-xs py-1.5 rounded-md transition-colors relative ${!d.inMonth ? "text-text-tertiary/40" : isToday ? "bg-text-primary text-white font-bold" : isInWeek ? "bg-p-blue/20 text-p-blue font-semibold" : "text-text-primary hover:bg-p-lavender-light"}`}>
                  {d.day}
                  {hasAssignments && d.inMonth && !isToday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-p-pink" />}
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
            <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors"><ChevronLeft size={18} className="text-text-secondary" /></button>
            <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors"><ChevronRight size={18} className="text-text-secondary" /></button>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">{formatDateRange(currentWeekStart)}</h2>
            <span className="text-[10px] font-semibold text-text-tertiary bg-[#F0EDF3] px-2.5 py-1 rounded-full uppercase tracking-wide">Semana {getWeekNumber(currentWeekStart)}</span>
          </div>
          {viewToggle}
        </div>

        <div className="flex flex-col bg-surface-card rounded-xl border border-[#F0EDF3] overflow-hidden" style={{ height: CAL_HEIGHT }}>
          <div className="shrink-0 border-b border-[#F0EDF3]">
            <div className="grid" style={{ gridTemplateColumns: `${TIME_COL} repeat(7, 1fr)` }}>
              <div />
              {weekDates.map((date, i) => {
                const d = new Date(date + "T00:00:00"); const isToday = date === today; const isSelected = date === selectedDay;
                return (
                  <button key={date} onClick={() => onDayClick(date)} className={`py-3 text-center border-l border-[#F0EDF3] transition-colors ${isSelected ? "bg-p-pink-light" : isToday ? "bg-p-blue-light/40" : "hover:bg-p-lavender-light/30"}`}>
                    <div className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? "text-p-blue" : i >= 5 ? "text-purple-400" : "text-text-tertiary"}`}>{DAYS_HEADER_EN[i]}</div>
                    <div className={`text-xl font-bold mt-0.5 ${isToday ? "text-p-blue" : "text-text-primary"}`}>{d.getDate()}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="relative" style={{ height: `${GRID_HOURS.length * ROW_HEIGHT}rem` }}>
              {GRID_HOURS.map((hour, i) => (
                <div key={hour} className="absolute left-0 right-0 border-t border-[#F0EDF3]/60" style={{ top: `${i * ROW_HEIGHT}rem` }}>
                  <div className="absolute left-0 -mt-2 pl-1 sm:pl-2" style={{ width: TIME_COL }}>
                    <span className="text-[9px] sm:text-[10px] font-medium text-text-tertiary">{String(hour % 24).padStart(2, "0")}:00</span>
                  </div>
                </div>
              ))}
              <div className="absolute inset-0 pointer-events-none" style={{ display: "grid", gridTemplateColumns: `${TIME_COL} repeat(7, 1fr)` }}>
                <div />
                {weekDates.map((date) => <div key={date} className={`border-l border-[#F0EDF3]/60 ${date === selectedDay ? "bg-p-pink-light/15" : date === today ? "bg-p-blue-light/10" : ""}`} />)}
              </div>
              <div className="absolute inset-0" style={{ display: "grid", gridTemplateColumns: `${TIME_COL} repeat(7, 1fr)` }}>
                <div />
                {weekDates.map((date) => {
                  const dayAsgn = assignmentsByDate[date] || [];
                  const isDropTarget = dragCtx?.highlightedDate === date;
                  const groups: Record<number, Assignment[]> = {};
                  dayAsgn.forEach((a) => { if (!groups[a.shift_type_id]) groups[a.shift_type_id] = []; groups[a.shift_type_id].push(a); });
                  const shiftGroups = Object.entries(groups);
                  return (
                    <div key={date} className={`relative transition-colors ${isDropTarget ? "bg-p-mint-light/40 ring-2 ring-inset ring-p-mint rounded-lg" : ""}`}
                      onDragOver={(e) => handleDragOver(e, date)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, date)}>
                      {shiftGroups.map(([shiftId, members_list], gIdx) => {
                        const shift = shiftMap[Number(shiftId)]; if (!shift) return null;
                        return (
                          <ShiftGroup key={shiftId} shiftId={Number(shiftId)} shift={shift} members_list={members_list} memberMap={memberMap}
                            gIdx={gIdx} totalGroups={shiftGroups.length} gridStart={GRID_START} rowHeight={ROW_HEIGHT}
                            isMobile={isMobile} isActive={isActive} date={date} onDayClick={onDayClick} dragCtx={dragCtx} />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
