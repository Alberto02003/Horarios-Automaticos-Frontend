import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DragMembersPanel from "@/components/drag/DragMembersPanel";
import ShiftsInfoWidget from "@/components/ShiftsInfoWidget";
import { type DragPayload } from "@/components/drag/DragContext";
import { timeToMinutes, getMondayOfWeek } from "./useCalendarData";
import { DAYS_SHORT } from "@/constants";
import type { CalendarData } from "./useCalendarData";
import type { Assignment } from "@/types/schedule";
import type { ReactNode } from "react";

const DAY_HEADERS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const HOURS = Array.from({ length: 19 }, (_, i) => i + 6);

function formatDateRange(weekStart: Date): string {
  const end = new Date(weekStart); end.setDate(end.getDate() + 6);
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  if (weekStart.getMonth() === end.getMonth()) return `${weekStart.getDate()} - ${end.getDate()} ${months[end.getMonth()]}, ${end.getFullYear()}`;
  return `${weekStart.getDate()} ${months[weekStart.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]}, ${end.getFullYear()}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

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
                    <div className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? "text-p-blue" : i >= 5 ? "text-purple-400" : "text-text-tertiary"}`}>{DAY_HEADERS[i]}</div>
                    <div className={`text-xl font-bold mt-0.5 ${isToday ? "text-p-blue" : "text-text-primary"}`}>{d.getDate()}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <div className="relative" style={{ height: `${HOURS.length * ROW_HEIGHT}rem` }}>
              {HOURS.map((hour, i) => (
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
                        const gridEndMin = HOURS.length * 60;
                        const startMin = Math.min(timeToMinutes(shift.start_time, 480) - GRID_START * 60, gridEndMin - 60);
                        let endMin = timeToMinutes(shift.end_time, 960) - GRID_START * 60;
                        if (endMin <= startMin) endMin = startMin + 120;
                        endMin = Math.min(endMin, gridEndMin);
                        const topRem = (startMin / 60) * ROW_HEIGHT;
                        const contentHeight = (isMobile ? 1.0 : 1.5) + members_list.length * (isMobile ? 0.85 : 1.1);
                        const totalGroups = shiftGroups.length; const gap = 2;
                        const colWidth = (100 - gap * 2) / totalGroups;
                        const widthPct = colWidth - (totalGroups > 1 ? 1 : 0);
                        const leftPct = gap + gIdx * colWidth;
                        return (
                          <div key={shiftId} onClick={(e) => { e.stopPropagation(); onDayClick(date); }}
                            className="absolute rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 overflow-hidden cursor-pointer hover:brightness-95 transition-all"
                            style={{ top: `${topRem}rem`, height: `${contentHeight}rem`, left: `${leftPct}%`, width: `${widthPct}%`, backgroundColor: shift.color + "15", borderLeft: `${isMobile ? 2 : 3}px solid ${shift.color}` }}>
                            <p className="text-[8px] sm:text-[10px] font-bold" style={{ color: shift.color }}>
                              {shift.code}{shift.start_time && <span className="hidden md:inline font-normal opacity-70"> {shift.start_time}-{shift.end_time}</span>}
                            </p>
                            <div className="mt-0.5 space-y-[1px]">
                              {members_list.map((a) => {
                                const m = memberMap[a.member_id]; if (!m) return null;
                                const canDrag = !isActive && !a.is_locked;
                                return (
                                  <div key={a.id} draggable={canDrag}
                                    onDragStart={canDrag ? (e) => { e.stopPropagation(); const payload: DragPayload = { type: "move-assignment", memberId: a.member_id, memberName: m.full_name, memberColor: m.color_tag, sourceDate: date, assignmentId: a.id, shiftTypeId: a.shift_type_id }; e.dataTransfer.setData("application/json", JSON.stringify(payload)); e.dataTransfer.effectAllowed = "move"; dragCtx?.setDragPayload(payload); } : undefined}
                                    onDragEnd={canDrag ? () => { dragCtx?.setDragPayload(null); dragCtx?.setHighlightedDate(null); } : undefined}
                                    className={`flex items-center gap-1 ${canDrag ? "cursor-grab active:cursor-grabbing hover:bg-white/30 rounded" : ""}`}>
                                    <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full shrink-0" style={{ backgroundColor: m.color_tag }} />
                                    <span className="text-[8px] sm:text-[10px] text-text-primary leading-tight">{isMobile ? m.full_name.split(" ")[0] : m.full_name}</span>
                                    {a.is_locked && <span className="text-[7px] sm:text-[8px]">🔒</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
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
