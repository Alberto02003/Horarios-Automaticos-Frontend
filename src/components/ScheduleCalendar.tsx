import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMembers } from "@/api/members";
import { useShiftTypes } from "@/api/shiftTypes";
import { useAssignments } from "@/api/schedule";
import type { Assignment } from "@/types/schedule";

const DAY_HEADERS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 - 22:00

interface Props {
  periodId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  onDayClick: (date: string) => void;
  selectedDay: string | null;
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

export default function ScheduleCalendar({ periodId, startDate, endDate, isActive, onDayClick, selectedDay }: Props) {
  const { data: members } = useMembers();
  const { data: shiftTypes } = useShiftTypes();
  const { data: assignments } = useAssignments(periodId);

  const periodStart = new Date(startDate + "T00:00:00");
  const periodEnd = new Date(endDate + "T00:00:00");
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMondayOfWeek(periodStart));

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

  const categorySummary = useMemo(() => {
    const counts: Record<string, { name: string; color: string; hours: number }> = {};
    const weekAssignments = weekDates.flatMap((d) => assignmentsByDate[d] || []);
    weekAssignments.forEach((a) => {
      const shift = shiftMap[a.shift_type_id];
      if (shift) {
        if (!counts[shift.code]) counts[shift.code] = { name: shift.name, color: shift.color, hours: 0 };
        const startMin = timeToMinutes(shift.start_time, 480);
        let endMin = timeToMinutes(shift.end_time, 960);
        let dur = endMin - startMin;
        if (dur <= 0) dur += 24 * 60;
        counts[shift.code].hours += dur / 60;
      }
    });
    return Object.values(counts);
  }, [weekDates, assignmentsByDate, shiftMap]);

  const ROW_HEIGHT = 3.5; // rem per hour
  const GRID_START = 6; // 06:00

  return (
    <div className="flex gap-6">
      {/* Left sidebar */}
      <div className="w-[240px] shrink-0 space-y-5">
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

        <div className="bg-surface-card rounded-xl border border-[#F0EDF3] p-4">
          <h3 className="text-sm font-bold text-text-primary mb-3">Turnos esta semana</h3>
          {categorySummary.length === 0 ? (
            <p className="text-xs text-text-tertiary">Sin asignaciones</p>
          ) : (
            <div className="space-y-2.5">
              {categorySummary.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-text-primary flex-1">{cat.name}</span>
                  <span className="text-xs text-text-tertiary font-medium">{Math.round(cat.hours)}h</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main weekly view */}
      <div className="flex-1 min-w-0">
        {/* Week navigation */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors"><ChevronLeft size={18} className="text-text-secondary" /></button>
          <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-p-lavender-light transition-colors"><ChevronRight size={18} className="text-text-secondary" /></button>
          <h2 className="text-xl font-extrabold text-text-primary tracking-tight">{formatDateRange(currentWeekStart)}</h2>
          <span className="text-[10px] font-semibold text-text-tertiary bg-[#F0EDF3] px-2.5 py-1 rounded-full uppercase tracking-wide">Semana {getWeekNumber(currentWeekStart)}</span>
        </div>

        {/* Day headers */}
        <div className="bg-surface-card rounded-t-xl border border-b-0 border-[#F0EDF3]">
          <div className="grid" style={{ gridTemplateColumns: "50px repeat(7, 1fr)" }}>
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
        <div className="bg-surface-card rounded-b-xl border border-t-0 border-[#F0EDF3] overflow-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
          <div className="relative" style={{ height: `${HOURS.length * ROW_HEIGHT}rem` }}>
            {/* Hour lines */}
            {HOURS.map((hour, i) => (
              <div key={hour} className="absolute left-0 right-0 border-t border-[#F0EDF3]/60" style={{ top: `${i * ROW_HEIGHT}rem` }}>
                <div className="w-[50px] text-right pr-2 -mt-2">
                  <span className="text-[10px] font-medium text-text-tertiary">{String(hour).padStart(2, "0")}:00</span>
                </div>
              </div>
            ))}

            {/* Column backgrounds */}
            <div className="absolute inset-0 pointer-events-none" style={{ display: "grid", gridTemplateColumns: "50px repeat(7, 1fr)" }}>
              <div />
              {weekDates.map((date) => (
                <div key={date} className={`border-l border-[#F0EDF3]/60 ${date === selectedDay ? "bg-p-pink-light/15" : date === today ? "bg-p-blue-light/10" : ""}`} />
              ))}
            </div>

            {/* Assignment blocks */}
            <div className="absolute inset-0" style={{ display: "grid", gridTemplateColumns: "50px repeat(7, 1fr)" }}>
              <div />
              {weekDates.map((date) => {
                const dayAssignments = assignmentsByDate[date] || [];
                return (
                  <div key={date} className="relative">
                    {dayAssignments.map((a, idx) => {
                      const shift = shiftMap[a.shift_type_id];
                      const member = memberMap[a.member_id];
                      if (!shift || !member) return null;

                      const startMin = timeToMinutes(a.start_time || shift.start_time, 480) - GRID_START * 60;
                      let endMin = timeToMinutes(a.end_time || shift.end_time, 960) - GRID_START * 60;
                      if (endMin <= startMin) endMin = startMin + 480;

                      const topRem = (startMin / 60) * ROW_HEIGHT;
                      const heightRem = Math.max(((endMin - startMin) / 60) * ROW_HEIGHT, ROW_HEIGHT * 0.6);

                      // Slight horizontal offset for overlapping assignments
                      const total = dayAssignments.length;
                      const leftPct = total > 1 ? (idx / total) * 30 : 0;
                      const widthPct = total > 1 ? 100 - (total - 1) * 8 : 100;

                      return (
                        <div
                          key={a.id}
                          onClick={(e) => { e.stopPropagation(); onDayClick(date); }}
                          className="absolute rounded-lg px-2 py-1.5 overflow-hidden cursor-pointer hover:brightness-95 transition-all"
                          style={{
                            top: `${topRem}rem`,
                            height: `${heightRem}rem`,
                            left: `${leftPct + 3}%`,
                            width: `${widthPct - 6}%`,
                            backgroundColor: shift.color + "20",
                            borderLeft: `3px solid ${shift.color}`,
                          }}
                        >
                          <p className="text-[11px] font-semibold truncate" style={{ color: shift.color }}>{member.full_name}</p>
                          <p className="text-[9px] mt-0.5 opacity-70" style={{ color: shift.color }}>
                            {a.start_time || shift.start_time || "—"} - {a.end_time || shift.end_time || "—"}
                          </p>
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
  );
}
