import { useState, useMemo, useRef } from "react";
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
import { usePeriods, useCreatePeriod, useActivatePeriod, useDeletePeriod, useValidation } from "@/api/schedule";
import { useMembers } from "@/api/members";
import { useShiftTypes } from "@/api/shiftTypes";
import { useToast } from "@/components/ui/ToastProvider";
import { MONTHS_SHORT } from "@/constants";
import type { SchedulePeriod } from "@/types/schedule";

type Page = "home" | "calendar";
type CalView = "month" | "week" | "day" | "grid";

export default function DashboardPage() {
  const { data: periods } = usePeriods();
  const { data: members } = useMembers();
  const { data: shiftTypes } = useShiftTypes();
  const { toast } = useToast();

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

  // Modal state
  const [showGenerate, setShowGenerate] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [showShifts, setShowShifts] = useState(false);

  // Derived data
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const drafts = (periods || []).filter((p) => p.status === "draft");
  const activeCurrentYear = (periods || []).filter((p) => p.status === "active" && p.year === currentYear);
  const activeMembers = (members || []).filter((m) => m.is_active);
  const activeShiftsArr = (shiftTypes || []).filter((s) => s.is_active);

  const currentMonthPeriod = useMemo(() =>
    (periods || []).find((p) => p.status === "active" && p.year === currentYear && p.month === currentMonth) || null
  , [periods, currentYear, currentMonth]);

  const calendarPeriod = browsePeriod || currentMonthPeriod;
  useValidation(calendarPeriod?.id ?? null);

  // Mutations
  const createPeriod = useCreatePeriod();
  const activatePeriod = useActivatePeriod();
  const deletePeriod = useDeletePeriod();
  const [newMonth, setNewMonth] = useState(currentMonth);
  const monthOptions = MONTHS_SHORT.map((m, i) => ({ value: String(i + 1), label: m }));

  const openPeriod = (p: SchedulePeriod) => { setBrowsePeriod(p); setPage("calendar"); };

  const handleCreatePeriod = () => {
    const existing = periods?.find((p) => p.year === currentYear && p.month === newMonth && p.status === "active");
    if (existing) { toast(`Ya existe un periodo activo para ${MONTHS_SHORT[newMonth - 1]} ${currentYear}.`, "error"); return; }
    const days = new Date(currentYear, newMonth, 0).getDate();
    const start = `${currentYear}-${String(newMonth).padStart(2, "0")}-01`;
    const end = `${currentYear}-${String(newMonth).padStart(2, "0")}-${String(days).padStart(2, "0")}`;
    createPeriod.mutate(
      { name: `${MONTHS_SHORT[newMonth - 1]} ${currentYear}`, year: currentYear, month: newMonth, start_date: start, end_date: end },
      { onSuccess: (p) => { openPeriod(p); setShowCreateModal(false); }, onError: (err) => toast(err instanceof Error ? err.message : "Error", "error") },
    );
  };

  const handleExportExcel = async (period: SchedulePeriod) => {
    const token = localStorage.getItem("token");
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
    try {
      const res = await fetch(`${apiBase}/api/schedule-periods/${period.id}/export/excel`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Error");
      const blob = await res.blob(); const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `horarios_${period.name.replace(/ /g, "_")}.xlsx`; a.click();
      URL.revokeObjectURL(url); toast("Excel exportado");
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
      <TopBar page={page} setPage={setPage} showConfig={showConfig} setShowConfig={setShowConfig} />

      <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div key={pageAnimKey} style={{ animation: `${pageSlideDir === "right" ? "tab-slide-in" : "tab-slide-out"} 0.25s ease-out` }}>
          {page === "home" ? (
            <HomePage drafts={drafts} activeCurrentYear={activeCurrentYear} activeMembers={activeMembers} activeShifts={activeShiftsArr}
              currentYear={currentYear} onOpenPeriod={openPeriod} onOpenTeam={() => setShowTeam(true)} onOpenShifts={() => setShowShifts(true)} />
          ) : (
            <CalendarPage calendarPeriod={calendarPeriod} calView={calView} setCalView={setCalView}
              selectedDay={selectedDay} setSelectedDay={setSelectedDay} setBrowsePeriod={setBrowsePeriod}
              onActivate={() => setShowActivateConfirm(true)} onDelete={() => setShowDeleteConfirm(true)}
              onExportExcel={handleExportExcel} onOpenConfig={() => setShowConfig(true)} />
          )}
        </div>
      </div>

      <FloatingBar currentMonthPeriod={currentMonthPeriod} browsePeriod={browsePeriod}
        setPage={setPage} setBrowsePeriod={setBrowsePeriod}
        onGenerate={() => setShowGenerate(true)} onCreateNew={() => setShowCreateModal(true)} />

      {/* Modals */}
      {selectedDay && calendarPeriod && (
        <DayDetailPanel open={!!selectedDay} onOpenChange={(o) => { if (!o) setSelectedDay(null); }} periodId={calendarPeriod.id} date={selectedDay} isActive={calendarPeriod.status === "active"} />
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
            <button onClick={handleCreatePeriod} disabled={createPeriod.isPending} className="btn-primary flex-1 rounded-xl">{createPeriod.isPending ? "Creando..." : "Crear horario"}</button>
            <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1 rounded-xl">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
