import { Download, CheckCircle, Trash2, LayoutGrid, CalendarDays, CalendarClock, CalendarRange, CalendarPlus } from "lucide-react";
import { DragProvider } from "@/components/drag/DragContext";
import ShiftPickerPopover from "@/components/drag/ShiftPickerPopover";
import PeriodSelector from "@/components/PeriodSelector";
import ScheduleCalendar from "@/components/ScheduleCalendar";
import ScheduleGrid from "@/components/ScheduleGrid";
import Tooltip from "@/components/ui/Tooltip";
import type { SchedulePeriod } from "@/types/schedule";

type CalView = "month" | "week" | "day" | "grid";

interface Props {
  calendarPeriod: SchedulePeriod | null;
  calView: CalView;
  setCalView: (v: CalView) => void;
  selectedDay: string | null;
  setSelectedDay: (d: string | null) => void;
  setBrowsePeriod: (p: SchedulePeriod | null) => void;
  onActivate: () => void;
  onDelete: () => void;
  onExportExcel: (p: SchedulePeriod) => void;
  onOpenConfig: () => void;
}

export default function CalendarPage({ calendarPeriod, calView, setCalView, selectedDay, setSelectedDay, setBrowsePeriod, onActivate, onDelete, onExportExcel, onOpenConfig }: Props) {
  const isDraft = calendarPeriod?.status === "draft";

  const inner = (
    <div className="px-3 sm:px-6 py-3 sm:py-5">
      {calendarPeriod && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <PeriodSelector selected={calendarPeriod} onSelect={setBrowsePeriod} showAll />
            <span className={`text-[9px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-xl ${calendarPeriod.status === "active" ? "bg-p-mint text-green-800" : "bg-p-yellow/50 text-amber-700"}`}>
              {calendarPeriod.status === "active" ? "Activo" : "Borrador"}
            </span>
            {calendarPeriod.status === "draft" && (
              <button onClick={onActivate} className="btn-pastel-mint text-[11px] px-3 py-1.5 rounded-xl"><CheckCircle size={13} /> Activar</button>
            )}
            <Tooltip content="Exportar Excel">
              <button onClick={() => onExportExcel(calendarPeriod)} aria-label="Exportar Excel" className="p-2 rounded-xl hover:bg-p-lavender-light transition-colors"><Download size={14} className="text-text-secondary" /></button>
            </Tooltip>
            <Tooltip content="Eliminar periodo">
              <button onClick={onDelete} aria-label="Eliminar periodo" className="p-2 rounded-xl hover:bg-p-pink-light transition-colors"><Trash2 size={14} className="text-text-tertiary" /></button>
            </Tooltip>
          </div>
          <div className="flex items-center gap-1 bg-[#F0EDF3]/50 rounded-xl p-0.5 self-start sm:self-auto">
            {([
              { mode: "month" as CalView, icon: CalendarRange, tip: "Mes" },
              { mode: "week" as CalView, icon: CalendarDays, tip: "Semana" },
              { mode: "day" as CalView, icon: CalendarClock, tip: "Dia" },
              { mode: "grid" as CalView, icon: LayoutGrid, tip: "Tabla" },
            ]).map((v) => (
              <Tooltip key={v.mode} content={v.tip}>
                <button onClick={() => setCalView(v.mode)} aria-label={`Vista ${v.tip}`} className={`p-2 sm:p-1.5 rounded-lg transition-colors ${calView === v.mode ? "bg-white shadow-xs text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}>
                  <v.icon size={15} />
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {calendarPeriod ? (
        calView === "month" || calView === "week" || calView === "day" ? (
          <ScheduleCalendar
            periodId={calendarPeriod.id}
            startDate={calendarPeriod.start_date}
            endDate={calendarPeriod.end_date}
            isActive={calendarPeriod.status === "active"}
            onDayClick={(date) => setSelectedDay(date)}
            selectedDay={selectedDay}
            view={calView}
            onOpenConfig={onOpenConfig}
          />
        ) : (
          <ScheduleGrid periodId={calendarPeriod.id} startDate={calendarPeriod.start_date} endDate={calendarPeriod.end_date} isActive={calendarPeriod.status === "active"} onOpenConfig={onOpenConfig} />
        )
      ) : (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl bg-p-lavender-light flex items-center justify-center mx-auto mb-4">
            <CalendarPlus size={28} className="text-text-tertiary" />
          </div>
          <p className="text-lg font-semibold text-text-primary">No hay horario activo para este mes</p>
          <p className="text-sm text-text-secondary mt-1">Crea y activa un horario desde la pestaña de inicio</p>
        </div>
      )}
    </div>
  );

  return isDraft ? (
    <DragProvider>
      {inner}
      {calendarPeriod && <ShiftPickerPopover periodId={calendarPeriod.id} />}
    </DragProvider>
  ) : inner;
}
