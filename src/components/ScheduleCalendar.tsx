import { useMemo } from "react";
import { useMembers } from "@/api/members";
import { useShiftTypes } from "@/api/shiftTypes";
import { useAssignments } from "@/api/schedule";
import type { Assignment } from "@/types/schedule";
import type { Member } from "@/types/member";
import type { ShiftType } from "@/types/shift";

const DAY_HEADERS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

interface Props {
  periodId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  onDayClick: (date: string) => void;
  selectedDay: string | null;
}

interface CalendarDay {
  date: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  assignments: { assignment: Assignment; member: Member; shift: ShiftType }[];
}

export default function ScheduleCalendar({ periodId, startDate, endDate, isActive, onDayClick, selectedDay }: Props) {
  const { data: members } = useMembers();
  const { data: shiftTypes } = useShiftTypes();
  const { data: assignments } = useAssignments(periodId);

  const memberMap = useMemo(() => {
    const map: Record<number, Member> = {};
    members?.forEach((m) => { map[m.id] = m; });
    return map;
  }, [members]);

  const shiftMap = useMemo(() => {
    const map: Record<number, ShiftType> = {};
    shiftTypes?.forEach((s) => { map[s.id] = s; });
    return map;
  }, [shiftTypes]);

  const assignmentsByDate = useMemo(() => {
    const map: Record<string, { assignment: Assignment; member: Member; shift: ShiftType }[]> = {};
    assignments?.forEach((a) => {
      const member = memberMap[a.member_id];
      const shift = shiftMap[a.shift_type_id];
      if (member && shift) {
        if (!map[a.date]) map[a.date] = [];
        map[a.date].push({ assignment: a, member, shift });
      }
    });
    // Sort by member name within each day
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.member.full_name.localeCompare(b.member.full_name)));
    return map;
  }, [assignments, memberMap, shiftMap]);

  const calendarWeeks = useMemo(() => {
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    const year = start.getFullYear();
    const month = start.getMonth();
    const today = new Date().toISOString().slice(0, 10);

    // Find the Monday before or on the 1st of the month
    const firstDay = new Date(year, month, 1);
    const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0
    const calStart = new Date(firstDay);
    calStart.setDate(calStart.getDate() - startDow);

    const weeks: CalendarDay[][] = [];
    const current = new Date(calStart);

    for (let w = 0; w < 6; w++) {
      const week: CalendarDay[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = current.toISOString().slice(0, 10);
        const inMonth = current >= start && current <= end;
        const dow = current.getDay();
        week.push({
          date: dateStr,
          day: current.getDate(),
          inMonth,
          isToday: dateStr === today,
          isWeekend: dow === 0 || dow === 6,
          assignments: assignmentsByDate[dateStr] || [],
        });
        current.setDate(current.getDate() + 1);
      }
      // Only include week if at least one day is in the month
      if (week.some((d) => d.inMonth)) weeks.push(week);
    }
    return weeks;
  }, [startDate, endDate, assignmentsByDate]);

  return (
    <div className="bg-surface-card rounded-xl border border-[#F0EDF3] overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-[#F0EDF3]">
        {DAY_HEADERS.map((h, i) => (
          <div key={h} className={`px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wider ${
            i >= 5 ? "text-purple-400 bg-p-lavender-light/30" : "text-text-tertiary"
          }`}>
            {h}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {calendarWeeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 border-b border-[#F0EDF3] last:border-b-0">
          {week.map((day) => (
            <div
              key={day.date}
              onClick={() => day.inMonth && onDayClick(day.date)}
              className={`min-h-[100px] p-1.5 border-r border-[#F0EDF3] last:border-r-0 transition-colors ${
                !day.inMonth ? "bg-[#FAFBFE]/50 opacity-40" : ""
              } ${day.isWeekend ? "bg-p-lavender-light/20" : ""
              } ${day.inMonth && !isActive ? "cursor-pointer hover:bg-p-pink-light/30" : ""
              } ${selectedDay === day.date ? "bg-p-pink-light/50 ring-1 ring-inset ring-p-pink-medium" : ""}`}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full ${
                  day.isToday
                    ? "bg-text-primary text-white"
                    : day.inMonth
                      ? "text-text-primary"
                      : "text-text-tertiary"
                }`}>
                  {day.day}
                </span>
                {day.assignments.length > 0 && (
                  <span className="text-[9px] font-medium text-text-tertiary">{day.assignments.length}</span>
                )}
              </div>

              {/* Assignment pills */}
              <div className="space-y-0.5">
                {day.assignments.slice(0, 4).map(({ assignment, member, shift }) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-1 rounded-md px-1 py-[2px] text-[10px] leading-tight"
                    style={{ backgroundColor: shift.color + "20", color: shift.color }}
                  >
                    <span className="font-bold">{shift.code}</span>
                    <span className="truncate font-medium opacity-80">{member.full_name.split(" ")[0]}</span>
                    {assignment.is_locked && <span className="ml-auto text-[8px]">🔒</span>}
                  </div>
                ))}
                {day.assignments.length > 4 && (
                  <div className="text-[9px] text-text-tertiary font-medium px-1">
                    +{day.assignments.length - 4} mas
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
