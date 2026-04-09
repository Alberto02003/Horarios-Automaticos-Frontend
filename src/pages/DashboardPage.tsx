import { useState, useMemo, useRef } from "react";
import { Calendar, Download, Sparkles, CheckCircle, Trash2, LayoutGrid, CalendarDays, CalendarClock, CalendarRange, CalendarPlus, Plus, X, Home, FileEdit, CheckCircle2, Users, Clock } from "lucide-react";
import CatPaws from "@/components/CatPaws";
import { DragProvider } from "@/components/drag/DragContext";
// DragMembersPanel is now rendered inside ScheduleCalendar sidebar
import ShiftPickerPopover from "@/components/drag/ShiftPickerPopover";
import ProfileMenu from "@/components/ProfileMenu";
import ConfigMenu from "@/components/ConfigMenu";
import PeriodSelector from "@/components/PeriodSelector";
import ScheduleCalendar from "@/components/ScheduleCalendar";
import ScheduleGrid from "@/components/ScheduleGrid";
import DayDetailPanel from "@/components/DayDetailPanel";
import TeamModal from "@/components/TeamModal";
import ShiftsModal from "@/components/ShiftsModal";
import GenerateDialog from "@/components/GenerateDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import Modal from "@/components/ui/Modal";
import SelectUI from "@/components/ui/Select";
import { usePeriods, useCreatePeriod, useActivatePeriod, useDeletePeriod, useValidation } from "@/api/schedule";
import { useMembers } from "@/api/members";
import { useShiftTypes } from "@/api/shiftTypes";
import { useToast } from "@/components/ui/ToastProvider";
import type { SchedulePeriod } from "@/types/schedule";

type Page = "home" | "calendar";
type CalView = "month" | "week" | "day" | "grid";

export default function DashboardPage() {
  const { data: periods } = usePeriods();
  const { data: members } = useMembers();
  const { data: shiftTypes } = useShiftTypes();
  const [page, setPageRaw] = useState<Page>("home");
  const [pageSlideDir, setPageSlideDir] = useState<"left" | "right">("right");
  const [pageAnimKey, setPageAnimKey] = useState(0);
  const [browsePeriod, setBrowsePeriod] = useState<SchedulePeriod | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [calView, setCalView] = useState<CalView>("week");

  const setPage = (newPage: Page) => {
    setPageSlideDir(newPage === "calendar" ? "right" : "left");
    setPageAnimKey((k) => k + 1);
    setPageRaw(newPage);
  };

  const [showGenerate, setShowGenerate] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [showShifts, setShowShifts] = useState(false);

  const createPeriod = useCreatePeriod();
  const activatePeriod = useActivatePeriod();
  const deletePeriod = useDeletePeriod();
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
  const { toast } = useToast();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const drafts = (periods || []).filter((p) => p.status === "draft");
  const activeCurrentYear = (periods || []).filter((p) => p.status === "active" && p.year === currentYear);
  const activeMembers = (members || []).filter((m) => m.is_active);
  const activeShifts = (shiftTypes || []).filter((s) => s.is_active);

  // The current month's active period — always shown in floating bar
  const currentMonthPeriod = useMemo(() => {
    return (periods || []).find((p) => p.status === "active" && p.year === currentYear && p.month === currentMonth) || null;
  }, [periods, currentYear, currentMonth]);

  // What the calendar is showing: browsePeriod (user selected) or currentMonthPeriod (default)
  const calendarPeriod = browsePeriod || currentMonthPeriod;

  useValidation(calendarPeriod?.id ?? null);

  const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const monthOptions = MONTH_NAMES.map((m, i) => ({ value: String(i + 1), label: m }));

  const handleCreatePeriod = () => {
    const existing = periods?.find((p) => p.year === currentYear && p.month === newMonth && p.status === "active");
    if (existing) {
      toast(`Ya existe un periodo activo para ${MONTH_NAMES[newMonth - 1]} ${currentYear}. Eliminalo primero.`, "error");
      return;
    }
    const days = new Date(currentYear, newMonth, 0).getDate();
    const start = `${currentYear}-${String(newMonth).padStart(2, "0")}-01`;
    const end = `${currentYear}-${String(newMonth).padStart(2, "0")}-${String(days).padStart(2, "0")}`;
    const name = `${MONTH_NAMES[newMonth - 1]} ${currentYear}`;
    createPeriod.mutate(
      { name, year: currentYear, month: newMonth, start_date: start, end_date: end },
      {
        onSuccess: (period) => { setBrowsePeriod(period); setPage("calendar"); setShowCreateModal(false); },
        onError: (err) => { toast(err instanceof Error ? err.message : "Error al crear", "error"); },
      },
    );
  };

  const handleExportExcel = async (period: SchedulePeriod) => {
    const token = localStorage.getItem("token");
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
    try {
      const res = await fetch(`${apiBase}/api/schedule-periods/${period.id}/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `horarios_${period.name.replace(/ /g, "_")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Excel exportado");
    } catch { toast("Error al exportar", "error"); }
  };

  const handleActivate = () => {
    if (!calendarPeriod) return;
    activatePeriod.mutate(calendarPeriod.id, {
      onSuccess: () => { setBrowsePeriod(null); setShowActivateConfirm(false); toast("Periodo activado"); },
      onError: (err) => { setShowActivateConfirm(false); toast(err instanceof Error ? err.message : "Error", "error"); },
    });
  };

  const handleDelete = () => {
    if (!calendarPeriod) return;
    deletePeriod.mutate(calendarPeriod.id, {
      onSuccess: () => { setBrowsePeriod(null); setShowDeleteConfirm(false); toast("Periodo eliminado"); },
    });
  };

  // ─── HOME PAGE ───
  const renderHome = () => (
    <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { icon: Users, label: "Miembros", value: activeMembers.length, color: "bg-p-blue-light text-blue-600", onClick: () => setShowTeam(true) },
          { icon: Clock, label: "Turnos", value: activeShifts.length, color: "bg-p-lilac/30 text-purple-600", onClick: () => setShowShifts(true) },
          { icon: FileEdit, label: "Borradores", value: drafts.length, color: "bg-p-yellow/40 text-amber-600", onClick: undefined },
          { icon: CheckCircle2, label: "Activos", value: activeCurrentYear.length, color: "bg-p-mint-light text-green-600", onClick: undefined },
        ].map((s) => (
          <button key={s.label} onClick={s.onClick} disabled={!s.onClick}
            className={`flex items-center gap-2.5 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 rounded-2xl border border-[#F0EDF3] bg-surface-card transition-all text-left ${s.onClick ? "hover:shadow-sm hover:-translate-y-0.5 cursor-pointer" : "cursor-default"}`}
          >
            <div className={`w-8 sm:w-10 h-8 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}><s.icon size={16} /></div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight leading-none">{s.value}</p>
              <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Drafts */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileEdit size={16} className="text-text-tertiary" />
          <h3 className="text-sm font-bold text-text-primary">Borradores</h3>
        </div>
        {drafts.length === 0 ? (
          <div className="bg-surface-card rounded-2xl border border-[#F0EDF3] px-6 py-10 text-center">
            <p className="text-sm text-text-tertiary">No hay borradores. Crea un nuevo horario para empezar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.map((p) => (
              <div key={p.id} onClick={() => { setBrowsePeriod(p); setPage("calendar"); }}
                className="bg-surface-card rounded-2xl border border-[#F0EDF3] p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-p-yellow/50 text-amber-700">Borrador</span>
                  <Calendar size={14} className="text-text-tertiary" />
                </div>
                <p className="text-lg font-bold text-text-primary tracking-tight">{p.name}</p>
                <p className="text-xs text-text-tertiary mt-1">{p.start_date} — {p.end_date}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={16} className="text-text-tertiary" />
          <h3 className="text-sm font-bold text-text-primary">Horarios activos — {currentYear}</h3>
        </div>
        {activeCurrentYear.length === 0 ? (
          <div className="bg-surface-card rounded-2xl border border-[#F0EDF3] px-6 py-10 text-center">
            <p className="text-sm text-text-tertiary">No hay horarios activos para este año.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCurrentYear.map((p) => (
              <div key={p.id} onClick={() => { setBrowsePeriod(p); setPage("calendar"); }}
                className="bg-surface-card rounded-2xl border border-[#F0EDF3] p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-p-mint text-green-800">Activo</span>
                  <Calendar size={14} className="text-text-tertiary" />
                </div>
                <p className="text-lg font-bold text-text-primary tracking-tight">{p.name}</p>
                <p className="text-xs text-text-tertiary mt-1">{p.start_date} — {p.end_date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ─── CALENDAR PAGE ───
  const isDraft = calendarPeriod?.status === "draft";

  const renderCalendarInner = () => (
    <div className="px-3 sm:px-6 py-3 sm:py-5">
      {/* Calendar toolbar: period selector (left) + view toggle (right) */}
      {calendarPeriod && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <PeriodSelector selected={calendarPeriod} onSelect={setBrowsePeriod} showAll />
            <span className={`text-[9px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-xl ${
              calendarPeriod.status === "active" ? "bg-p-mint text-green-800" : "bg-p-yellow/50 text-amber-700"
            }`}>
              {calendarPeriod.status === "active" ? "Activo" : "Borrador"}
            </span>
            {calendarPeriod.status === "draft" && (
              <button onClick={() => setShowActivateConfirm(true)} className="btn-pastel-mint text-[11px] px-3 py-1.5 rounded-xl"><CheckCircle size={13} /> Activar</button>
            )}
            <Tooltip content="Exportar Excel">
              <button onClick={() => handleExportExcel(calendarPeriod)} className="p-2 rounded-xl hover:bg-p-lavender-light transition-colors"><Download size={14} className="text-text-secondary" /></button>
            </Tooltip>
            <Tooltip content="Eliminar periodo">
              <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-xl hover:bg-p-pink-light transition-colors"><Trash2 size={14} className="text-text-tertiary" /></button>
            </Tooltip>
          </div>
          <div className="flex items-center gap-0.5 bg-[#F0EDF3]/50 rounded-xl p-0.5">
            {([
              { mode: "month" as CalView, icon: CalendarRange, tip: "Mes" },
              { mode: "week" as CalView, icon: CalendarDays, tip: "Semana" },
              { mode: "day" as CalView, icon: CalendarClock, tip: "Dia" },
              { mode: "grid" as CalView, icon: LayoutGrid, tip: "Tabla" },
            ]).map((v) => (
              <Tooltip key={v.mode} content={v.tip}>
                <button onClick={() => setCalView(v.mode)} className={`p-1.5 rounded-lg transition-colors ${calView === v.mode ? "bg-white shadow-xs text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}>
                  <v.icon size={14} />
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
            onOpenConfig={() => setShowConfig(true)}
          />
        ) : (
          <div className="bg-surface-card rounded-2xl border border-[#F0EDF3] overflow-hidden shadow-xs">
            <ScheduleGrid
              periodId={calendarPeriod.id}
              startDate={calendarPeriod.start_date}
              endDate={calendarPeriod.end_date}
              isActive={calendarPeriod.status === "active"}
            />
          </div>
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

  // Swipe between tabs
  const swipeStart = useRef(0);
  const handlePageTouchStart = (e: React.TouchEvent) => { swipeStart.current = e.touches[0].clientX; };
  const handlePageTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - swipeStart.current;
    if (diff < -80 && page === "home") setPage("calendar");
    if (diff > 80 && page === "calendar") { setPage("home"); setBrowsePeriod(null); }
  };

  const renderCalendar = () => isDraft ? (
    <DragProvider>
      {renderCalendarInner()}
      {calendarPeriod && <ShiftPickerPopover periodId={calendarPeriod.id} />}
    </DragProvider>
  ) : renderCalendarInner();

  return (
    <div className="min-h-screen bg-surface relative">
      <CatPaws />

      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-surface/80 border-b border-[#F0EDF3]/60">
        <div className="flex items-center justify-between px-3 sm:px-6 h-12 sm:h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-xl bg-p-pink flex items-center justify-center">
              <Calendar size={14} className="text-text-primary" />
            </div>
            <span className="text-sm sm:text-[15px] font-bold text-text-primary tracking-tight hidden sm:inline">Horarios</span>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 bg-[#F0EDF3]/50 rounded-xl p-0.5 sm:p-1">
            <button onClick={() => setPage("home")}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                page === "home" ? "bg-surface-card shadow-xs text-text-primary" : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              <Home size={13} /> <span className="hidden sm:inline">Inicio</span>
            </button>
            <button onClick={() => setPage("calendar")}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                page === "calendar" ? "bg-surface-card shadow-xs text-text-primary" : "text-text-tertiary hover:text-text-secondary"
              }`}
            >
              <CalendarDays size={13} /> <span className="hidden sm:inline">Calendario</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <ConfigMenu externalOpen={showConfig} onExternalOpenChange={setShowConfig} initialTab="shifts" />
            <ProfileMenu />
          </div>
        </div>
      </header>

      {/* Page content — swipeable with animation */}
      <div onTouchStart={handlePageTouchStart} onTouchEnd={handlePageTouchEnd}>
        <div
          key={pageAnimKey}
          style={{ animation: `${pageSlideDir === "right" ? "tab-slide-in" : "tab-slide-out"} 0.25s ease-out` }}
        >
          {page === "home" ? renderHome() : renderCalendar()}
        </div>
      </div>

      {/* Floating bottom bar */}
      <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] sm:w-auto">
        <div className="flex items-center justify-center gap-2 sm:gap-3 bg-surface-card/95 backdrop-blur-lg border border-[#F0EDF3] rounded-2xl shadow-lg px-3 sm:px-5 py-2.5 sm:py-3">
          {currentMonthPeriod ? (
            <>
              <button onClick={() => { setBrowsePeriod(null); setPage("calendar"); }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <CalendarDays size={15} className="text-text-secondary" />
                <span className="text-sm font-semibold text-text-primary">{currentMonthPeriod.name}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-p-mint text-green-800">Activo</span>
              </button>
              <div className="w-px h-6 bg-[#F0EDF3]" />
              <button onClick={() => setShowGenerate(true)} className="btn-pastel-lilac text-[11px] px-3 py-1.5 rounded-xl">
                <Sparkles size={13} /> Generar
              </button>
            </>
          ) : browsePeriod ? (
            <>
              <button onClick={() => setPage("calendar")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <CalendarDays size={15} className="text-text-secondary" />
                <span className="text-sm font-semibold text-text-primary">{browsePeriod.name}</span>
                <span className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-p-yellow/60 text-amber-700">Borrador</span>
              </button>
              <div className="w-px h-6 bg-[#F0EDF3]" />
              <button onClick={() => setShowGenerate(true)} className="btn-pastel-lilac text-[11px] px-3 py-1.5 rounded-xl">
                <Sparkles size={13} /> Generar
              </button>
              <button onClick={() => setBrowsePeriod(null)} className="p-1.5 rounded-lg hover:bg-p-pink-light transition-colors" title="Deseleccionar">
                <X size={13} className="text-text-tertiary" />
              </button>
            </>
          ) : (
            <>
              <span className="text-xs text-text-tertiary">Sin horario activo este mes</span>
              <div className="w-px h-6 bg-[#F0EDF3]" />
              <button onClick={() => setShowCreateModal(true)} className="btn-pastel-lilac text-[11px] px-3 py-1.5 rounded-xl">
                <Plus size={13} /> Nuevo
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedDay && calendarPeriod && (
        <DayDetailPanel open={!!selectedDay} onOpenChange={(open) => { if (!open) setSelectedDay(null); }} periodId={calendarPeriod.id} date={selectedDay} isActive={calendarPeriod.status === "active"} />
      )}
      <TeamModal open={showTeam} onOpenChange={setShowTeam} />
      <ShiftsModal open={showShifts} onOpenChange={setShowShifts} />
      <GenerateDialog periodId={calendarPeriod?.id ?? 0} open={showGenerate && !!calendarPeriod} onOpenChange={setShowGenerate} />
      <ConfirmDialog open={showActivateConfirm} onOpenChange={setShowActivateConfirm} title="Activar periodo" description="No se podran editar las asignaciones." onConfirm={handleActivate} confirmLabel="Activar" variant="warning" />
      <ConfirmDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} title="Eliminar periodo" description={`Se eliminara "${calendarPeriod?.name}" y todas sus asignaciones.`} onConfirm={handleDelete} confirmLabel="Eliminar" variant="danger" />

      <Modal open={showCreateModal} onOpenChange={setShowCreateModal} title="Nuevo horario">
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-p-lavender-light/40 border border-p-lavender/30">
            <CalendarPlus size={20} className="text-text-tertiary shrink-0" />
            <p className="text-sm text-text-secondary">Selecciona el mes para crear un nuevo periodo.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Mes</label>
            <SelectUI value={String(newMonth)} onValueChange={(val) => setNewMonth(Number(val))} options={monthOptions} placeholder="Seleccionar mes" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Año</label>
            <div className="input-pastel flex items-center justify-center text-sm font-medium text-text-primary">{currentYear}</div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleCreatePeriod} disabled={createPeriod.isPending} className="btn-primary flex-1 rounded-xl">
              {createPeriod.isPending ? "Creando..." : "Crear horario"}
            </button>
            <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1 rounded-xl">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
