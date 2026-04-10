import DragMembersPanel from "@/components/drag/DragMembersPanel";
import ShiftsInfoWidget from "@/components/ShiftsInfoWidget";
import type { CalendarData } from "./useCalendarData";
import type { ReactNode } from "react";

interface Props {
  data: CalendarData;
  viewToggle: ReactNode;
}

export default function MonthView({ data, viewToggle }: Props) {
  const { periodStart, assignmentsByDate, shiftMap, memberMap, today, selectedDay, isActive, dragCtx, onDayClick, handleDragOver, handleDragLeave, handleDrop, onOpenConfig, CAL_HEIGHT, MONTHS_FULL, assignments } = data;

  const year = periodStart.getFullYear();
  const month = periodStart.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startDow = firstOfMonth.getDay() === 0 ? 6 : firstOfMonth.getDay() - 1;

  const calDays: { date: string; day: number; inMonth: boolean }[] = [];
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    calDays.push({ day: d.getDate(), date: d.toISOString().slice(0, 10), inMonth: false });
  }
  for (let i = 1; i <= lastOfMonth.getDate(); i++) {
    const d = new Date(year, month, i);
    calDays.push({ day: i, date: d.toISOString().slice(0, 10), inMonth: true });
  }
  const trailing = 7 - (calDays.length % 7);
  if (trailing < 7) {
    for (let i = 1; i <= trailing; i++) {
      const d = new Date(year, month + 1, i);
      calDays.push({ day: i, date: d.toISOString().slice(0, 10), inMonth: false });
    }
  }

  const calWeeks: typeof calDays[] = [];
  for (let i = 0; i < calDays.length; i += 7) calWeeks.push(calDays.slice(i, i + 7));

  return (
    <div className="flex gap-6">
      <div className="hidden lg:flex lg:w-[240px] shrink-0 flex-col gap-3" style={{ maxHeight: CAL_HEIGHT }}>
        {!isActive && dragCtx && <DragMembersPanel onOpenConfig={onOpenConfig} />}
        <ShiftsInfoWidget onOpenConfig={onOpenConfig} />
      </div>
      <div className="flex-1 min-w-0 bg-surface-card rounded-xl border border-[#F0EDF3] overflow-auto" style={{ height: CAL_HEIGHT }}>
        <div className="px-5 py-4 border-b border-[#F0EDF3] flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-text-primary tracking-tight">{MONTHS_FULL[month]} {year}</h2>
          <div className="flex items-center gap-3">
            <p className="text-xs text-text-tertiary">{(assignments || []).length} asignaciones</p>
            {viewToggle}
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-[#F0EDF3]">
          {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((h, i) => (
            <div key={h} className={`px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider ${i >= 5 ? "text-purple-400 bg-p-lavender-light/30" : "text-text-tertiary"}`}>{h}</div>
          ))}
        </div>
        {calWeeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-[#F0EDF3] last:border-b-0">
            {week.map((day) => {
              const dayAsgn = assignmentsByDate[day.date] || [];
              const isToday = day.date === today;
              const isSelected = day.date === selectedDay;
              const isWeekend = (() => { const d = new Date(day.date + "T00:00:00"); return d.getDay() === 0 || d.getDay() === 6; })();
              const isDropHere = dragCtx?.highlightedDate === day.date;
              return (
                <div key={day.date} onClick={() => day.inMonth && onDayClick(day.date)}
                  onDragOver={(e) => day.inMonth && handleDragOver(e, day.date)} onDragLeave={handleDragLeave} onDrop={(e) => day.inMonth && handleDrop(e, day.date)}
                  className={`min-h-[60px] sm:min-h-[90px] p-1.5 border-r border-[#F0EDF3] last:border-r-0 transition-colors ${!day.inMonth ? "opacity-30" : ""} ${isWeekend ? "bg-p-lavender-light/15" : ""} ${day.inMonth && !isActive ? "cursor-pointer hover:bg-p-pink-light/20" : ""} ${isSelected ? "bg-p-pink-light/40 ring-1 ring-inset ring-p-pink-medium" : ""} ${isDropHere ? "bg-p-mint-light/40 ring-2 ring-inset ring-p-mint" : ""}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-text-primary text-white" : "text-text-primary"}`}>{day.day}</span>
                    {dayAsgn.length > 0 && <span className="text-[9px] font-medium text-text-tertiary">{dayAsgn.length}</span>}
                  </div>
                  <div className="space-y-0.5">
                    {dayAsgn.slice(0, 3).map((a) => {
                      const shift = shiftMap[a.shift_type_id]; const member = memberMap[a.member_id];
                      if (!shift || !member) return null;
                      return (
                        <div key={a.id} className="flex items-center gap-1 rounded px-1 py-[1px] text-[9px] leading-tight" style={{ backgroundColor: shift.color + "18", color: shift.color }}>
                          <span className="font-bold">{shift.code}</span>
                          <span className="truncate opacity-80">{member.full_name.split(" ")[0]}</span>
                        </div>
                      );
                    })}
                    {dayAsgn.length > 3 && <div className="text-[8px] text-text-tertiary px-1">+{dayAsgn.length - 3}</div>}
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
