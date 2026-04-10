import { CalendarRange, CalendarDays, CalendarClock, LayoutGrid } from "lucide-react";
import { useCalendarData, type CalendarDataProps } from "@/components/calendar/useCalendarData";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import DayView from "@/components/calendar/DayView";
import { CalendarSkeleton } from "@/components/ui/Skeleton";

type CalView = "month" | "week" | "day" | "grid";

interface Props extends CalendarDataProps {
  view?: "month" | "week" | "day";
  onViewChange?: (view: CalView) => void;
}

export default function ScheduleCalendar({ view = "week", onViewChange, ...rest }: Props) {
  const data = useCalendarData(rest);

  const viewToggle = onViewChange ? (
    <div className="flex items-center gap-0.5 bg-[#F0EDF3]/50 rounded-xl p-0.5">
      {([
        { mode: "month" as CalView, icon: CalendarRange, tip: "Mes" },
        { mode: "week" as CalView, icon: CalendarDays, tip: "Semana" },
        { mode: "day" as CalView, icon: CalendarClock, tip: "Dia" },
        { mode: "grid" as CalView, icon: LayoutGrid, tip: "Tabla" },
      ]).map((v) => (
        <button key={v.mode} onClick={() => onViewChange(v.mode)} title={v.tip}
          className={`p-1.5 rounded-lg transition-colors ${view === v.mode ? "bg-white shadow-xs text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}
        >
          <v.icon size={14} />
        </button>
      ))}
    </div>
  ) : null;

  if (!data.assignments) return <CalendarSkeleton />;

  switch (view) {
    case "month": return <MonthView data={data} viewToggle={viewToggle} />;
    case "day": return <DayView data={data} viewToggle={viewToggle} />;
    case "week":
    default: return <WeekView data={data} viewToggle={viewToggle} />;
  }
}
