import { useState, useMemo, useRef, useCallback } from "react";
import { CalendarPlus } from "lucide-react";
import CatPaws from "@/components/CatPaws";
import TopBar from "@/components/dashboard/TopBar";
import FloatingBar from "@/components/dashboard/FloatingBar";
import HomePage from "@/components/dashboard/HomePage";
import CalendarPage from "@/components/dashboard/CalendarPage";
import DayDetailPanel from "@/components/DayDetailPanel";
import TeamModal from "@/components/TeamModal";
import ShiftsModal from "@/components/ShiftsModal";
import GenerateDialog from "@/components/GenerateDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import SelectUI from "@/components/ui/Select";
import { usePeriods, useValidation } from "@/api/schedule";
import { useMembers } from "@/api/members";
import { useShiftTypes } from "@/api/shiftTypes";
import { useDashboardModals } from "@/hooks/useDashboardModals";
import { useDashboardActions } from "@/hooks/useDashboardActions";
import { MONTHS_SHORT } from "@/constants";
import type { SchedulePeriod } from "@/types/schedule";

type Page = "home" | "calendar";
type CalView = "month" | "week" | "day" | "grid";

export default function DashboardPage() {
  const { data: periods, isLoading: loadingPeriods } = usePeriods();
  const { data: members, isLoading: loadingMembers } = useMembers();
  const { data: shiftTypes, isLoading: loadingShifts } = useShiftTypes();
  const dataLoading = loadingPeriods || loadingMembers || loadingShifts;

  // Page navigation with animation
  const [page, setPageRaw] = useState<Page>("home");
  const [pageSlideDir, setPageSlideDir] = useState<"left" | "right">("right");
  const [pageAnimKey, setPageAnimKey] = useState(0);
  const setPage = (newPage: Page) => {
    setPageSlideDir(newPage === "calendar" ? "right" : "left");
    setPageAnimKey((k) => k + 1);
    setPageRaw(newPage);
  };

  // Calendar state
  const [browsePeriod, setBrowsePeriod] = useState<SchedulePeriod | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [calView, setCalView] = useState<CalView>("week");
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);

  // Modals
  const modals = useDashboardModals();

  // Derived data
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const drafts = useMemo(() => (periods || []).filter((p) => p.status === "draft"), [periods]);
  const activeCurrentYear = useMemo(() => (periods || []).filter((p) => p.status === "active" && p.year === currentYear), [periods, currentYear]);
  const activeMembers = useMemo(() => (members || []).filter((m) => m.is_active), [members]);
  const activeShiftsArr = useMemo(() => (shiftTypes || []).filter((s) => s.is_active), [shiftTypes]);

  const currentMonthPeriod = useMemo(() =>
    (periods || []).find((p) => p.status === "active" && p.year === currentYear && p.month === currentMonth) || null
  , [periods, currentYear, currentMonth]);

  const calendarPeriod = browsePeriod || currentMonthPeriod;
  useValidation(calendarPeriod?.id ?? null);

  // Actions
  const openPeriod = useCallback((p: SchedulePeriod) => { setBrowsePeriod(p); setPage("calendar"); }, []);

  const actions = useDashboardActions(periods, calendarPeriod, {
    onPeriodCreated: (p) => { openPeriod(p); modals.setShowCreateModal(false); },
    onPeriodActivated: () => { setBrowsePeriod(null); modals.setShowActivateConfirm(false); },
    onPeriodDeleted: () => { setBrowsePeriod(null); modals.setShowDeleteConfirm(false); },
  });

  const monthOptions = MONTHS_SHORT.map((m, i) => ({ value: String(i + 1), label: m }));

  // Swipe
  const swipeStart = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { swipeStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - swipeStart.current;
    if (diff < -80 && page === "home") setPage("calendar");
    if (diff > 80 && page === "calendar") setPage("home");
  };

  return (
    <div className="min-h-screen bg-surface relative">
      <CatPaws />
      <TopBar page={page} setPage={setPage} showConfig={modals.showConfig} setShowConfig={modals.setShowConfig} />

      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div key={pageAnimKey} style={{ animation: `${pageSlideDir === "right" ? "tab-slide-in" : "tab-slide-out"} 0.25s ease-out` }}>
          {page === "home" ? (
            <HomePage drafts={drafts} activeCurrentYear={activeCurrentYear} activeMembers={activeMembers} activeShifts={activeShiftsArr}
              currentYear={currentYear} onOpenPeriod={openPeriod} onOpenTeam={() => modals.setShowTeam(true)} onOpenShifts={() => modals.setShowShifts(true)} loading={dataLoading} />
          ) : (
            <CalendarPage calendarPeriod={calendarPeriod} calView={calView} setCalView={setCalView}
              selectedDay={selectedDay} setSelectedDay={setSelectedDay} setBrowsePeriod={setBrowsePeriod}
              onActivate={() => modals.setShowActivateConfirm(true)} onDelete={() => modals.setShowDeleteConfirm(true)}
              onExportExcel={actions.handleExportExcel} onOpenConfig={() => modals.setShowConfig(true)} />
          )}
        </div>
      </div>

      <FloatingBar currentMonthPeriod={currentMonthPeriod} browsePeriod={browsePeriod}
        setPage={setPage} setBrowsePeriod={setBrowsePeriod}
        onGenerate={() => modals.setShowGenerate(true)} onCreateNew={() => modals.setShowCreateModal(true)} />

      {selectedDay && calendarPeriod && (
        <DayDetailPanel open={!!selectedDay} onOpenChange={(o) => { if (!o) setSelectedDay(null); }} periodId={calendarPeriod.id} date={selectedDay} isActive={calendarPeriod.status === "active"} />
      )}
      <TeamModal open={modals.showTeam} onOpenChange={modals.setShowTeam} />
      <ShiftsModal open={modals.showShifts} onOpenChange={modals.setShowShifts} />
      <GenerateDialog periodId={calendarPeriod?.id ?? 0} open={modals.showGenerate && !!calendarPeriod} onOpenChange={modals.setShowGenerate} />
      <ConfirmDialog open={modals.showActivateConfirm} onOpenChange={modals.setShowActivateConfirm} title="Activar periodo" description="No se podran editar las asignaciones." onConfirm={actions.handleActivate} confirmLabel="Activar" variant="warning" />
      <ConfirmDialog open={modals.showDeleteConfirm} onOpenChange={modals.setShowDeleteConfirm} title="Eliminar periodo" description={`Se eliminara "${calendarPeriod?.name}" y todas sus asignaciones.`} onConfirm={actions.handleDelete} confirmLabel="Eliminar" variant="danger" />

      <Modal open={modals.showCreateModal} onOpenChange={modals.setShowCreateModal} title="Nuevo horario">
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
            <button onClick={() => actions.handleCreatePeriod(newMonth)} disabled={actions.isCreating} className="btn-primary flex-1 rounded-xl">{actions.isCreating ? "Creando..." : "Crear horario"}</button>
            <button onClick={() => modals.setShowCreateModal(false)} className="btn-secondary flex-1 rounded-xl">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
