import { useState, useEffect } from "react";
import { Calendar, Download, Sparkles, CheckCircle, Trash2, LayoutGrid, CalendarDays, CalendarClock, CalendarPlus } from "lucide-react";
import ProfileMenu from "@/components/ProfileMenu";
import ConfigMenu from "@/components/ConfigMenu";
import QuickStats from "@/components/QuickStats";
import PeriodSelector from "@/components/PeriodSelector";
import ScheduleCalendar from "@/components/ScheduleCalendar";
import ScheduleGrid from "@/components/ScheduleGrid";
import DayDetailPanel from "@/components/DayDetailPanel";
import TeamModal from "@/components/TeamModal";
import ShiftsModal from "@/components/ShiftsModal";
import GenerateDialog from "@/components/GenerateDialog";
import DraftsSection from "@/components/DraftsSection";
import HistorySection from "@/components/HistorySection";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import { usePeriods, useActivatePeriod, useDeletePeriod, useValidation } from "@/api/schedule";
import { useToast } from "@/components/ui/ToastProvider";
import type { SchedulePeriod } from "@/types/schedule";

type ViewMode = "week" | "day" | "grid";

export default function DashboardPage() {
  const { data: periods } = usePeriods();
  const [selectedPeriod, setSelectedPeriod] = useState<SchedulePeriod | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("week");

  // Auto-select active period on load
  useEffect(() => {
    if (periods && !selectedPeriod) {
      const active = periods.find((p) => p.status === "active");
      if (active) setSelectedPeriod(active);
    }
  }, [periods, selectedPeriod]);

  // Modals
  const [showGenerate, setShowGenerate] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [showShifts, setShowShifts] = useState(false);

  const activatePeriod = useActivatePeriod();
  const deletePeriod = useDeletePeriod();
  const { data: warnings } = useValidation(selectedPeriod?.id ?? null);
  const { toast } = useToast();

  const handleExportExcel = async () => {
    if (!selectedPeriod) return;
    const token = localStorage.getItem("token");
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
    try {
      const res = await fetch(`${apiBase}/api/schedule-periods/${selectedPeriod.id}/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `horarios_${selectedPeriod.name.replace(/ /g, "_")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Excel exportado");
    } catch {
      toast("Error al exportar", "error");
    }
  };

  const handleActivate = () => {
    if (!selectedPeriod) return;
    activatePeriod.mutate(selectedPeriod.id, {
      onSuccess: (updated) => { setSelectedPeriod(updated); setShowActivateConfirm(false); toast("Periodo activado"); },
    });
  };

  const handleDelete = () => {
    if (!selectedPeriod) return;
    deletePeriod.mutate(selectedPeriod.id, {
      onSuccess: () => { setSelectedPeriod(null); setShowDeleteConfirm(false); setSelectedDay(null); toast("Periodo eliminado"); },
    });
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-surface/80 border-b border-[#F0EDF3]/60">
        <div className="flex items-center justify-between px-6 h-14">
          {/* Left: Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-p-pink flex items-center justify-center">
              <Calendar size={15} className="text-text-primary" />
            </div>
            <span className="text-[15px] font-bold text-text-primary tracking-tight">Horarios</span>
          </div>

          {/* Center: Period selector + actions */}
          <div className="flex items-center gap-2">
            <PeriodSelector selected={selectedPeriod} onSelect={setSelectedPeriod} />
            {selectedPeriod && (
              <>
                <span className={`text-[9px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                  selectedPeriod.status === "active" ? "bg-p-mint text-text-primary" : "bg-p-yellow/60 text-text-primary"
                }`}>
                  {selectedPeriod.status === "active" ? "Activo" : "Borrador"}
                </span>
                {selectedPeriod.status === "draft" && (
                  <>
                    <button onClick={() => setShowGenerate(true)} className="btn-pastel-lilac text-[11px] px-2.5 py-1.5"><Sparkles size={13} /> Generar</button>
                    <button onClick={() => setShowActivateConfirm(true)} className="btn-pastel-mint text-[11px] px-2.5 py-1.5"><CheckCircle size={13} /> Activar</button>
                  </>
                )}
                <button onClick={handleExportExcel} className="btn-secondary text-[11px] px-2.5 py-1.5"><Download size={13} /></button>
                <Tooltip content="Eliminar periodo">
                  <button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 rounded-lg hover:bg-p-pink-light transition-colors"><Trash2 size={14} className="text-text-tertiary" /></button>
                </Tooltip>
              </>
            )}
          </div>

          {/* Right: View toggle + Config + Profile */}
          <div className="flex items-center gap-2">
            {selectedPeriod && (
              <div className="flex items-center gap-0.5 bg-[#F0EDF3]/60 rounded-lg p-0.5 mr-2">
                <Tooltip content="Semana">
                  <button onClick={() => setViewMode("week")} className={`p-1.5 rounded-md transition-colors ${viewMode === "week" ? "bg-surface-card shadow-xs text-text-primary" : "text-text-tertiary"}`}>
                    <CalendarDays size={14} />
                  </button>
                </Tooltip>
                <Tooltip content="Dia">
                  <button onClick={() => setViewMode("day")} className={`p-1.5 rounded-md transition-colors ${viewMode === "day" ? "bg-surface-card shadow-xs text-text-primary" : "text-text-tertiary"}`}>
                    <CalendarClock size={14} />
                  </button>
                </Tooltip>
                <Tooltip content="Tabla">
                  <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-surface-card shadow-xs text-text-primary" : "text-text-tertiary"}`}>
                    <LayoutGrid size={14} />
                  </button>
                </Tooltip>
              </div>
            )}
            <ConfigMenu />
            <ProfileMenu />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-6 py-5">
        {/* Quick stats */}
        <div className="mb-5">
          <QuickStats
            period={selectedPeriod}
            warnings={warnings || []}
            onOpenTeam={() => setShowTeam(true)}
            onOpenShifts={() => setShowShifts(true)}
          />
        </div>

        {/* Calendar / Grid */}
        {selectedPeriod ? (
          viewMode === "week" || viewMode === "day" ? (
            <ScheduleCalendar
              periodId={selectedPeriod.id}
              startDate={selectedPeriod.start_date}
              endDate={selectedPeriod.end_date}
              isActive={selectedPeriod.status === "active"}
              onDayClick={(date) => setSelectedDay(date)}
              selectedDay={selectedDay}
              view={viewMode}
            />
          ) : (
            <div className="bg-surface-card rounded-xl border border-[#F0EDF3] overflow-hidden shadow-xs">
              <ScheduleGrid
                periodId={selectedPeriod.id}
                startDate={selectedPeriod.start_date}
                endDate={selectedPeriod.end_date}
                isActive={selectedPeriod.status === "active"}
              />
            </div>
          )
        ) : (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-p-lavender-light flex items-center justify-center mx-auto mb-4">
              <CalendarPlus size={28} className="text-text-tertiary" />
            </div>
            <p className="text-lg font-semibold text-text-primary">Selecciona o crea un periodo</p>
            <p className="text-sm text-text-secondary mt-1">Los horarios se organizan por mes</p>
          </div>
        )}

        {/* Drafts + History sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <DraftsSection onLoadDraft={(p) => setSelectedPeriod(p)} />
          <HistorySection onSelectPeriod={(p) => setSelectedPeriod(p)} />
        </div>
      </div>

      {/* Modals */}
      {selectedDay && selectedPeriod && (
        <DayDetailPanel
          open={!!selectedDay}
          onOpenChange={(open) => { if (!open) setSelectedDay(null); }}
          periodId={selectedPeriod.id}
          date={selectedDay}
          isActive={selectedPeriod.status === "active"}
        />
      )}

      <TeamModal open={showTeam} onOpenChange={setShowTeam} />
      <ShiftsModal open={showShifts} onOpenChange={setShowShifts} />
      <GenerateDialog periodId={selectedPeriod?.id ?? 0} open={showGenerate && !!selectedPeriod} onOpenChange={setShowGenerate} />

      <ConfirmDialog open={showActivateConfirm} onOpenChange={setShowActivateConfirm} title="Activar periodo" description="No se podran editar las asignaciones." onConfirm={handleActivate} confirmLabel="Activar" variant="warning" />
      <ConfirmDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm} title="Eliminar periodo" description={`Se eliminara "${selectedPeriod?.name}" y todas sus asignaciones. Esta accion no se puede deshacer.`} onConfirm={handleDelete} confirmLabel="Eliminar" variant="danger" />
    </div>
  );
}
