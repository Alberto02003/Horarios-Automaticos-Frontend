import { useMemo, useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ChevronLeft, ChevronRight, CalendarRange, CalendarDays, CalendarClock, LayoutGrid } from "lucide-react";
import { useMembers } from "@/api/members";
import { useShiftTypes } from "@/api/shiftTypes";
import { useAssignments } from "@/api/schedule";
import { useDrag, type DragPayload } from "@/components/drag/DragContext";
import DragMembersPanel from "@/components/drag/DragMembersPanel";
import ShiftsInfoWidget from "@/components/ShiftsInfoWidget";
import type { Assignment } from "@/types/schedule";

const DAY_HEADERS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 - 22:00

type CalView = "month" | "week" | "day" | "grid";

interface Props {
  periodId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  onDayClick: (date: string) => void;
  selectedDay: string | null;
  view?: "month" | "week" | "day";
  onViewChange?: (view: CalView) => void;
  onOpenConfig?: () => void;
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

function formatDateRange(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  if (weekStart.getMonth() === end.getMonth()) {
    return `${weekStart.getDate()} - ${end.getDate()} ${months[end.getMonth()]}, ${end.getFullYear()}`;
  }
  return `${weekStart.getDate()} ${months[weekStart.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]}, ${end.getFullYear()}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function timeToMinutes(timeStr: string | null, fallback: number): number {
  if (!timeStr) return fallback;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

const DAY_NAMES_FULL = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

export default function ScheduleCalendar({ periodId, startDate, endDate, isActive, onDayClick, selectedDay, view = "week", onViewChange, onOpenConfig }: Props) {

  const { data: members } = useMembers();
  const { data: shiftTypes } = useShiftTypes();
  const { data: assignments } = useAssignments(periodId);
  const dragCtx = useDrag();

  // Drop zone handlers
  const handleDragOver = useCallback((e: React.DragEvent, date: string) => {
    if (isActive) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    dragCtx?.setHighlightedDate(date);
  }, [isActive, dragCtx]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    dragCtx?.setHighlightedDate(null);
  }, [dragCtx]);

  const handleDrop = useCallback((e: React.DragEvent, date: string) => {
    e.preventDefault();
    dragCtx?.setHighlightedDate(null);
    try {
      const data = e.dataTransfer.getData("application/json");
      const payload: DragPayload = JSON.parse(data);
      if (payload.type === "move-assignment" && payload.sourceDate === date) return;
      dragCtx?.setDropResult({ date, payload, x: e.clientX, y: e.clientY });
    } catch { /* ignore invalid drops */ }
  }, [dragCtx]);

  const periodStart = new Date(startDate + "T00:00:00");
  const periodEnd = new Date(endDate + "T00:00:00");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMondayOfWeek(periodStart));
  const [currentDayStr, setCurrentDayStr] = useState(() => new Date().toISOString().slice(0, 10));

  const weekDates = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }, [currentWeekStart]);

  const today = new Date().toISOString().slice(0, 10);

  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    if (d >= getMondayOfWeek(periodStart)) setCurrentWeekStart(d);
  };
  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    if (d <= periodEnd) setCurrentWeekStart(d);
  };

  const memberMap = useMemo(() => {
    const map: Record<number, { full_name: string; color_tag: string }> = {};
    members?.forEach((m) => { map[m.id] = { full_name: m.full_name, color_tag: m.color_tag }; });
    return map;
  }, [members]);

  const shiftMap = useMemo(() => {
    const map: Record<number, { code: string; color: string; name: string; start_time: string | null; end_time: string | null }> = {};
    shiftTypes?.forEach((s) => { map[s.id] = { code: s.code, color: s.color, name: s.name, start_time: s.default_start_time, end_time: s.default_end_time }; });
    return map;
  }, [shiftTypes]);

  const assignmentsByDate = useMemo(() => {
    const map: Record<string, Assignment[]> = {};
    assignments?.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [assignments]);

  // Mini calendar
  const miniCalDays = useMemo(() => {
    const year = periodStart.getFullYear();
    const month = periodStart.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { day: number; date: string; inMonth: boolean }[] = [];
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ day: d.getDate(), date: d.toISOString().slice(0, 10), inMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({ day: i, date: d.toISOString().slice(0, 10), inMonth: true });
    }
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({ day: i, date: d.toISOString().slice(0, 10), inMonth: false });
      }
    }
    return days;
  }, [periodStart]);

  const MONTHS_FULL = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  const isMobile = useIsMobile();
  const ROW_HEIGHT = isMobile ? 2.5 : 3.5; // rem per hour
  const GRID_START = 6; // 06:00
  const CAL_HEIGHT = isMobile ? "calc(100vh - 220px)" : "650px";
  const SIDEBAR_W = isMobile ? "w-full" : "w-[240px]";
  const TIME_COL = isMobile ? "40px" : "50px";

  // Day navigation
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

  const currentDayDate = new Date(currentDayStr + "T00:00:00");
  const dayAssignments = assignmentsByDate[currentDayStr] || [];

  // View toggle (rendered inside each view)
  const viewToggle = onViewChange ? (
    <div className="flex items-center gap-0.5 bg-[#F0EDF3]/50 rounded-xl p-0.5">
      {([
        { mode: "month" as CalView, icon: CalendarRange, tip: "Mes" },
        { mode: "week" as CalView, icon: CalendarDays, tip: "Semana" },
        { mode: "day" as CalView, icon: CalendarClock, tip: "Dia" },
        { mode: "grid" as CalView, icon: LayoutGrid, tip: "Tabla" },
      ]).map((v) => (
        <button key={v.mode} onClick={() => onViewChange(v.mode)} title={v.tip}
          className={`p-1.5 rounded-lg transition-colors ${(view === v.mode || (v.mode === "grid" && view !== "month" && view !== "week" && view !== "day")) ? "bg-white shadow-xs text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}
        >
          <v.icon size={14} />
        </button>
      ))}
    </div>
  ) : null;

  // Monthly view render
  if (view === "month") {
    // Build calendar grid: weeks of Mon-Sun
    const year = periodStart.getFullYear();
    const month = periodStart.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const startDow = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;

    const calDays: { date: string; day: number; inMonth: boolean }[] = [];
    // Leading days
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      calDays.push({ day: d.getDate(), date: d.toISOString().slice(0, 10), inMonth: false });
    }
    // Month days
    for (let i = 1; i <= lastOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      calDays.push({ day: i, date: d.toISOString().slice(0, 10), inMonth: true });
    }
    // Trailing days
    const trailing = 7 - (calDays.length % 7);
    if (trailing < 7) {
      for (let i = 1; i <= trailing; i++) {
        const d = new Date(year, month + 1, i);
        calDays.push({ day: i, date: d.toISOString().slice(0, 10), inMonth: false });
      }
    }

    const calWeeks: typeof calDays[] = [];
    for (let i = 0; i < calDays.length; i += 7) {
      calWeeks.push(calDays.slice(i, i + 7));
    }

    return (
      <div className="flex gap-6">
        {/* Sidebar for monthly view */}
        <div className="hidden lg:flex lg:w-[240px] shrink-0 flex-col gap-3" style={{ maxHeight: CAL_HEIGHT }}>
          {!isActive && dragCtx && <DragMembersPanel onOpenConfig={onOpenConfig} />}
          <ShiftsInfoWidget onOpenConfig={onOpenConfig} />
        </div>
        <div className="flex-1 min-w-0 bg-surface-card rounded-xl border border-[#F0EDF3] overflow-auto" style={{ height: CAL_HEIGHT }}>
        {/* Month header */}
        <div className="px-5 py-4 border-b border-[#F0EDF3] flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-text-primary tracking-tight">
            {MONTHS_FULL[month]} {year}
          </h2>
          <div className="flex items-center gap-3">
            <p className="text-xs text-text-tertiary">{(assignments || []).length} asignaciones</p>
            {viewToggle}
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[#F0EDF3]">
          {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((h, i) => (
            <div key={h} className={`px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider ${
              i >= 5 ? "text-purple-400 bg-p-lavender-light/30" : "text-text-tertiary"
            }`}>{h}</div>
          ))}
        </div>

        {/* Weeks */}
        {calWeeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-[#F0EDF3] last:border-b-0">
            {week.map((day) => {
              const dayAsgn = assignmentsByDate[day.date] || [];
              const isToday = day.date === today;
              const isSelected = day.date === selectedDay;
              const isWeekend = (() => { const d = new Date(day.date + "T00:00:00"); return d.getDay() === 0 || d.getDay() === 6; })();

              const isDropHere = dragCtx?.highlightedDate === day.date;
              return (
                <div
                  key={day.date}
                  onClick={() => day.inMonth && onDayClick(day.date)}
                  onDragOver={(e) => day.inMonth && handleDragOver(e, day.date)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => day.inMonth && handleDrop(e, day.date)}
                  className={`min-h-[60px] sm:min-h-[90px] p-1.5 border-r border-[#F0EDF3] last:border-r-0 transition-colors ${
                    !day.inMonth ? "opacity-30" : ""
                  } ${isWeekend ? "bg-p-lavender-light/15" : ""
                  } ${day.inMonth && !isActive ? "cursor-pointer hover:bg-p-pink-light/20" : ""
                  } ${isSelected ? "bg-p-pink-light/40 ring-1 ring-inset ring-p-pink-medium" : ""
                  } ${isDropHere ? "bg-p-mint-light/40 ring-2 ring-inset ring-p-mint" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? "bg-text-primary text-white" : "text-text-primary"
                    }`}>{day.day}</span>
                    {dayAsgn.length > 0 && (
                      <span className="text-[9px] font-medium text-text-tertiary">{dayAsgn.length}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayAsgn.slice(0, 3).map((a) => {
                      const shift = shiftMap[a.shift_type_id];
                      const member = memberMap[a.member_id];
                      if (!shift || !member) return null;
                      return (
                        <div key={a.id} className="flex items-center gap-1 rounded px-1 py-[1px] text-[9px] leading-tight" style={{ backgroundColor: shift.color + "18", color: shift.color }}>
                          <span className="font-bold">{shift.code}</span>
                          <span className="truncate opacity-80">{member.full_name.split(" ")[0]}</span>
                        </div>
                      );
                    })}
                    {dayAsgn.length > 3 && (
                      <div className="text-[8px] text-text-tertiary px-1">+{dayAsgn.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        </div>
      </div>
    );
  }

  // Daily view render
  if (view === "day") {
    return (
      <div className="flex gap-6">
        {/* Left sidebar (same mini-cal) */}
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
              {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
                <div key={d} className="text-[10px] font-medium text-text-tertiary text-center py-1">{d}</div>
              ))}
              {miniCalDays.map((d, i) => {
                const isCurrentDay = d.date === currentDayStr;
                const isToday = d.date === today;
                const hasAssignments = (assignmentsByDate[d.date]?.length || 0) > 0;
                return (
                  <button key={i} onClick={() => setCurrentDayStr(d.date)}
                    className={`text-xs py-1.5 rounded-md transition-colors relative ${
                      !d.inMonth ? "text-text-tertiary/40" :
                      isCurrentDay ? "bg-p-pink text-text-primary font-bold" :
                      isToday ? "bg-text-primary text-white font-bold" :
                      "text-text-primary hover:bg-p-lavender-light"
                    }`}
                  >
                    {d.day}
                    {hasAssignments && d.inMonth && !isToday && !isCurrentDay && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-p-pink" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {!isActive && dragCtx && <DragMembersPanel onOpenConfig={onOpenConfig} />}

          {/* Shifts info */}
          <ShiftsInfoWidget onOpenConfig={onOpenConfig} />
        </div>

        {/* Daily time grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={prevDay} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors"><ChevronLeft size={18} className="text-text-secondary" /></button>
              <button onClick={nextDay} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors"><ChevronRight size={18} className="text-text-secondary" /></button>
              <h2 className="text-xl font-extrabold text-text-primary tracking-tight">
                {DAY_NAMES_FULL[currentDayDate.getDay()]}, {currentDayDate.getDate()} de {MONTHS_FULL[currentDayDate.getMonth()]}
              </h2>
            </div>
            {viewToggle}
          </div>

          <div className="bg-surface-card rounded-xl border border-[#F0EDF3] overflow-auto" style={{ height: CAL_HEIGHT }}>
            <div className="relative" style={{ height: `${HOURS.length * ROW_HEIGHT * 1.2}rem` }}>
              {/* Hour lines */}
              {HOURS.map((hour, i) => (
                <div key={hour} className="absolute left-0 right-0 border-t border-[#F0EDF3]/60" style={{ top: `${i * ROW_HEIGHT * 1.2}rem` }}>
                  <div className="text-right pr-2 sm:pr-3 -mt-2">
                    <span className="text-xs font-medium text-text-tertiary">{String(hour).padStart(2, "0")}:00</span>
                  </div>
                </div>
              ))}

              {/* Assignment blocks — grouped by shift type */}
              <div
                className={`absolute inset-0 transition-colors ${dragCtx?.highlightedDate === currentDayStr ? "bg-p-mint-light/30 ring-2 ring-inset ring-p-mint rounded-lg" : ""}`}
                style={{ marginLeft: isMobile ? "45px" : "70px" }}
                onDragOver={(e) => handleDragOver(e, currentDayStr)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, currentDayStr)}
              >
                {(() => {
                  // Group by shift type
                  const groups: Record<number, Assignment[]> = {};
                  dayAssignments.forEach((a) => {
                    if (!groups[a.shift_type_id]) groups[a.shift_type_id] = [];
                    groups[a.shift_type_id].push(a);
                  });
                  const shiftGroups = Object.entries(groups);
                  const SCALE = 1.2;

                  return shiftGroups.map(([shiftId, members_list], gIdx) => {
                    const shift = shiftMap[Number(shiftId)];
                    if (!shift) return null;

                    const startMin = timeToMinutes(shift.start_time, 480) - GRID_START * 60;
                    let endMin = timeToMinutes(shift.end_time, 960) - GRID_START * 60;
                    if (endMin <= startMin) endMin = startMin + 480;

                    const topRem = (startMin / 60) * ROW_HEIGHT * SCALE;
                    const minHeight = ROW_HEIGHT * 1.5;
                    const contentHeight = 2.5 + members_list.length * 1.6;
                    const timeHeight = ((endMin - startMin) / 60) * ROW_HEIGHT * SCALE;
                    const heightRem = Math.max(timeHeight, minHeight, contentHeight);

                    const totalGroups = shiftGroups.length;
                    const widthPct = totalGroups > 1 ? Math.floor(100 / totalGroups) - 2 : 100;
                    const leftPct = totalGroups > 1 ? gIdx * Math.floor(100 / totalGroups) : 0;

                    return (
                      <div
                        key={shiftId}
                        onClick={() => onDayClick(currentDayStr)}
                        className="absolute rounded-xl px-4 py-3 cursor-pointer hover:brightness-95 transition-all"
                        style={{
                          top: `${topRem}rem`,
                          height: `${heightRem}rem`,
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          backgroundColor: shift.color + "12",
                          borderLeft: `4px solid ${shift.color}`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: shift.color }}>{shift.code}</span>
                          <span className="text-sm font-semibold" style={{ color: shift.color }}>{shift.name}</span>
                          <span className="text-xs opacity-60" style={{ color: shift.color }}>
                            {shift.start_time || "—"} - {shift.end_time || "—"}
                          </span>
                        </div>
                        <div className="space-y-1">
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
                                  const payload: DragPayload = { type: "move-assignment", memberId: a.member_id, memberName: m.full_name, memberColor: m.color_tag, sourceDate: currentDayStr, assignmentId: a.id, shiftTypeId: a.shift_type_id };
                                  e.dataTransfer.setData("application/json", JSON.stringify(payload));
                                  e.dataTransfer.effectAllowed = "move";
                                  dragCtx?.setDragPayload(payload);
                                } : undefined}
                                onDragEnd={canDrag ? () => { dragCtx?.setDragPayload(null); dragCtx?.setHighlightedDate(null); } : undefined}
                                className={`flex items-center gap-2 ${canDrag ? "cursor-grab active:cursor-grabbing hover:bg-white/30 rounded-lg px-1 -mx-1" : ""}`}
                              >
                                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0" style={{ backgroundColor: m.color_tag }}>
                                  {m.full_name.charAt(0)}
                                </div>
                                <span className="text-sm text-text-primary">{m.full_name}</span>
                                {a.is_locked && <span className="text-[10px] text-text-tertiary">🔒</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Weekly view (default)
  return (
    <div className="flex gap-6">
      {/* Left sidebar */}
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
            {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
              <div key={d} className="text-[10px] font-medium text-text-tertiary text-center py-1">{d}</div>
            ))}
            {miniCalDays.map((d, i) => {
              const isInWeek = weekDates.includes(d.date);
              const isToday = d.date === today;
              const hasAssignments = (assignmentsByDate[d.date]?.length || 0) > 0;
              return (
                <button
                  key={i}
                  onClick={() => { setCurrentWeekStart(getMondayOfWeek(new Date(d.date + "T00:00:00"))); }}
                  className={`text-xs py-1.5 rounded-md transition-colors relative ${
                    !d.inMonth ? "text-text-tertiary/40" :
                    isToday ? "bg-text-primary text-white font-bold" :
                    isInWeek ? "bg-p-blue/20 text-p-blue font-semibold" :
                    "text-text-primary hover:bg-p-lavender-light"
                  }`}
                >
                  {d.day}
                  {hasAssignments && d.inMonth && !isToday && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-p-pink" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {!isActive && dragCtx && <DragMembersPanel onOpenConfig={onOpenConfig} />}

        <ShiftsInfoWidget onOpenConfig={onOpenConfig} />
      </div>

      {/* Main weekly view */}
      <div className="flex-1 min-w-0">
        {/* Week navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors"><ChevronLeft size={18} className="text-text-secondary" /></button>
            <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors"><ChevronRight size={18} className="text-text-secondary" /></button>
            <h2 className="text-xl font-extrabold text-text-primary tracking-tight">{formatDateRange(currentWeekStart)}</h2>
            <span className="text-[10px] font-semibold text-text-tertiary bg-[#F0EDF3] px-2.5 py-1 rounded-full uppercase tracking-wide">Semana {getWeekNumber(currentWeekStart)}</span>
          </div>
          {viewToggle}
        </div>

        {/* Calendar container — fixed height */}
        <div className="flex flex-col bg-surface-card rounded-xl border border-[#F0EDF3] overflow-hidden" style={{ height: CAL_HEIGHT }}>
        {/* Day headers */}
        <div className="shrink-0 border-b border-[#F0EDF3]">
          <div className="grid" style={{ gridTemplateColumns: `${TIME_COL} repeat(7, 1fr)` }}>
            <div />
            {weekDates.map((date, i) => {
              const d = new Date(date + "T00:00:00");
              const isToday = date === today;
              const isSelected = date === selectedDay;
              return (
                <button key={date} onClick={() => onDayClick(date)} className={`py-3 text-center border-l border-[#F0EDF3] transition-colors ${isSelected ? "bg-p-pink-light" : isToday ? "bg-p-blue-light/40" : "hover:bg-p-lavender-light/30"}`}>
                  <div className={`text-[10px] font-semibold uppercase tracking-wider ${isToday ? "text-p-blue" : i >= 5 ? "text-purple-400" : "text-text-tertiary"}`}>{DAY_HEADERS[i]}</div>
                  <div className={`text-xl font-bold mt-0.5 ${isToday ? "text-p-blue" : "text-text-primary"}`}>{d.getDate()}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time grid */}
        <div className="flex-1 overflow-auto">
          <div className="relative" style={{ height: `${HOURS.length * ROW_HEIGHT}rem` }}>
            {/* Hour lines */}
            {HOURS.map((hour, i) => (
              <div key={hour} className="absolute left-0 right-0 border-t border-[#F0EDF3]/60" style={{ top: `${i * ROW_HEIGHT}rem` }}>
                <div className="absolute left-0 -mt-2 pl-1 sm:pl-2" style={{ width: TIME_COL }}>
                  <span className="text-[9px] sm:text-[10px] font-medium text-text-tertiary">{String(hour).padStart(2, "0")}:00</span>
                </div>
              </div>
            ))}

            {/* Column backgrounds */}
            <div className="absolute inset-0 pointer-events-none" style={{ display: "grid", gridTemplateColumns: `${TIME_COL} repeat(7, 1fr)` }}>
              <div />
              {weekDates.map((date) => (
                <div key={date} className={`border-l border-[#F0EDF3]/60 ${date === selectedDay ? "bg-p-pink-light/15" : date === today ? "bg-p-blue-light/10" : ""}`} />
              ))}
            </div>

            {/* Assignment blocks — grouped by shift type */}
            <div className="absolute inset-0" style={{ display: "grid", gridTemplateColumns: `${TIME_COL} repeat(7, 1fr)` }}>
              <div />
              {weekDates.map((date) => {
                const dayAsgn = assignmentsByDate[date] || [];
                const isDropTarget = dragCtx?.highlightedDate === date;
                // Group by shift type
                const groups: Record<number, Assignment[]> = {};
                dayAsgn.forEach((a) => {
                  if (!groups[a.shift_type_id]) groups[a.shift_type_id] = [];
                  groups[a.shift_type_id].push(a);
                });
                const shiftGroups = Object.entries(groups);

                return (
                  <div
                    key={date}
                    className={`relative transition-colors ${isDropTarget ? "bg-p-mint-light/40 ring-2 ring-inset ring-p-mint rounded-lg" : ""}`}
                    onDragOver={(e) => handleDragOver(e, date)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, date)}
                  >
                    {shiftGroups.map(([shiftId, members_list], gIdx) => {
                      const shift = shiftMap[Number(shiftId)];
                      if (!shift) return null;

                      const startMin = timeToMinutes(shift.start_time, 480) - GRID_START * 60;
                      let endMin = timeToMinutes(shift.end_time, 960) - GRID_START * 60;
                      if (endMin <= startMin) endMin = startMin + 480;

                      const topRem = (startMin / 60) * ROW_HEIGHT;
                      const minHeight = ROW_HEIGHT * 0.8;
                      const contentHeight = 1.2 + members_list.length * 0.95;
                      const timeHeight = ((endMin - startMin) / 60) * ROW_HEIGHT;
                      const heightRem = Math.max(timeHeight, minHeight, contentHeight);

                      // Side by side if multiple shift groups
                      const totalGroups = shiftGroups.length;
                      const widthPct = totalGroups > 1 ? Math.floor(100 / totalGroups) - 2 : 94;
                      const leftPct = totalGroups > 1 ? gIdx * Math.floor(100 / totalGroups) + 3 : 3;

                      return (
                        <div
                          key={shiftId}
                          onClick={(e) => { e.stopPropagation(); onDayClick(date); }}
                          className="absolute rounded-lg px-1 sm:px-2 py-1 sm:py-1.5 overflow-hidden cursor-pointer hover:brightness-95 transition-all"
                          style={{
                            top: `${topRem}rem`,
                            height: `${heightRem}rem`,
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            backgroundColor: shift.color + "15",
                            borderLeft: `${isMobile ? 2 : 3}px solid ${shift.color}`,
                          }}
                        >
                          <p className="text-[8px] sm:text-[10px] font-bold truncate" style={{ color: shift.color }}>
                            {shift.code}{!isMobile && ` · ${shift.start_time || "—"}-${shift.end_time || "—"}`}
                          </p>
                          <div className="mt-0.5 space-y-[1px]">
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
                                    e.dataTransfer.setData("application/json", JSON.stringify(payload));
                                    e.dataTransfer.effectAllowed = "move";
                                    dragCtx?.setDragPayload(payload);
                                  } : undefined}
                                  onDragEnd={canDrag ? () => { dragCtx?.setDragPayload(null); dragCtx?.setHighlightedDate(null); } : undefined}
                                  className={`flex items-center gap-1 ${canDrag ? "cursor-grab active:cursor-grabbing hover:bg-white/30 rounded" : ""}`}
                                >
                                  <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full shrink-0" style={{ backgroundColor: m.color_tag }} />
                                  <span className="text-[8px] sm:text-[10px] truncate text-text-primary">{isMobile ? m.full_name.split(" ")[0] : m.full_name}</span>
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
