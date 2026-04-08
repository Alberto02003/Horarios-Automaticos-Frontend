import { useState } from "react";
import { Download, Sparkles, CheckCircle, AlertTriangle, Clock, Calendar, CalendarPlus, LayoutGrid, CalendarDays, Trash2 } from "lucide-react";
import PeriodSelector from "@/components/PeriodSelector";
import ScheduleCalendar from "@/components/ScheduleCalendar";
import ScheduleGrid from "@/components/ScheduleGrid";
import DayDetailPanel from "@/components/DayDetailPanel";
import GenerateDialog from "@/components/GenerateDialog";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Tooltip from "@/components/ui/Tooltip";
import { useActivatePeriod, useDeletePeriod, useValidation } from "@/api/schedule";
import { useToast } from "@/components/ui/ToastProvider";
import type { SchedulePeriod } from "@/types/schedule";

type ViewMode = "calendar" | "grid";

export default function SchedulePage() {
  const [selectedPeriod, setSelectedPeriod] = useState<SchedulePeriod | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
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
      if (!res.ok) throw new Error("Error al exportar");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `horarios_${selectedPeriod.name.replace(/ /g, "_")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Excel exportado");
    } catch {
      toast("Error al exportar Excel", "error");
    }
  };

  const handleActivate = () => {
    if (!selectedPeriod) return;
    activatePeriod.mutate(selectedPeriod.id, {
      onSuccess: (updated) => {
        setSelectedPeriod(updated);
        setShowActivateConfirm(false);
        toast("Periodo activado");
      },
    });
  };

  const handleDelete = () => {
    if (!selectedPeriod) return;
    deletePeriod.mutate(selectedPeriod.id, {
      onSuccess: () => {
        setSelectedPeriod(null);
        setShowDeleteConfirm(false);
        setSelectedDay(null);
        toast("Periodo eliminado");
      },
    });
  };

  const handleDayClick = (date: string) => {
    setSelectedDay(selectedDay === date ? null : date);
  };

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 overflow-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Horarios</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              {selectedPeriod ? selectedPeriod.name : "Selecciona un periodo para comenzar"}
            </p>
          </div>

          {/* View toggle */}
          {selectedPeriod && (
            <div className="flex items-center gap-1 bg-[#F0EDF3]/60 rounded-lg p-1">
              <Tooltip content="Vista calendario">
                <button
                  onClick={() => setViewMode("calendar")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "calendar" ? "bg-surface-card shadow-xs text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}
                >
                  <CalendarDays size={16} />
                </button>
              </Tooltip>
              <Tooltip content="Vista tabla">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-surface-card shadow-xs text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}
                >
                  <LayoutGrid size={16} />
                </button>
              </Tooltip>
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5 gap-4">
          <PeriodSelector selected={selectedPeriod} onSelect={setSelectedPeriod} />
          {selectedPeriod && (
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={handleExportExcel} className="btn-secondary text-xs px-3 py-2">
                <Download size={14} /> Excel
              </button>
              <span className={`text-[10px] font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full ${
                selectedPeriod.status === "active"
                  ? "bg-p-mint text-text-primary"
                  : "bg-p-yellow text-text-primary"
              }`}>
                {selectedPeriod.status === "active" ? "Activo" : "Borrador"}
              </span>
              {selectedPeriod.status === "draft" && (
                <>
                  <button onClick={() => setShowGenerate(true)} className="btn-pastel-lilac text-xs px-3 py-2">
                    <Sparkles size={14} /> Generar
                  </button>
                  <button onClick={() => setShowActivateConfirm(true)} disabled={activatePeriod.isPending} className="btn-pastel-mint text-xs px-3 py-2">
                    <CheckCircle size={14} /> Activar
                  </button>
                  <Tooltip content="Eliminar borrador">
                    <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-lg hover:bg-p-pink-light transition-colors">
                      <Trash2 size={14} className="text-text-tertiary" />
                    </button>
                  </Tooltip>
                </>
              )}
            </div>
          )}
        </div>

        {/* Warnings */}
        {warnings && warnings.length > 0 && (
          <div className="mb-5 bg-p-peach-light border border-p-peach rounded-xl p-4 animate-slide-up">
            <h4 className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
              <AlertTriangle size={14} /> {warnings.length} aviso{warnings.length > 1 ? "s" : ""}
            </h4>
            <ul className="space-y-1">
              {warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-700 flex items-center gap-2">
                  {w.type === "hours_exceeded" ? <Clock size={12} /> : <Calendar size={12} />}
                  {w.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Calendar / Grid */}
        {selectedPeriod ? (
          viewMode === "calendar" ? (
            <ScheduleCalendar
              periodId={selectedPeriod.id}
              startDate={selectedPeriod.start_date}
              endDate={selectedPeriod.end_date}
              isActive={selectedPeriod.status === "active"}
              onDayClick={handleDayClick}
              selectedDay={selectedDay}
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
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-p-lavender-light flex items-center justify-center mx-auto mb-4">
              <CalendarPlus size={28} className="text-text-tertiary" />
            </div>
            <p className="text-lg font-semibold text-text-primary">Selecciona o crea un periodo</p>
            <p className="text-sm text-text-secondary mt-1">Los horarios se organizan por mes</p>
          </div>
        )}
      </div>

      {/* Day detail panel (slides in from right) */}
      {selectedDay && selectedPeriod && viewMode === "calendar" && (
        <DayDetailPanel
          periodId={selectedPeriod.id}
          date={selectedDay}
          isActive={selectedPeriod.status === "active"}
          onClose={() => setSelectedDay(null)}
        />
      )}

      {/* Dialogs */}
      <GenerateDialog periodId={selectedPeriod?.id ?? 0} open={showGenerate && !!selectedPeriod} onOpenChange={setShowGenerate} />
      <ConfirmDialog
        open={showActivateConfirm}
        onOpenChange={setShowActivateConfirm}
        title="Activar periodo"
        description="Una vez activado, no se podran editar las asignaciones."
        onConfirm={handleActivate}
        confirmLabel="Activar"
        variant="warning"
      />
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Eliminar borrador"
        description={`Se eliminara "${selectedPeriod?.name}" y todas sus asignaciones. Esta accion no se puede deshacer.`}
        onConfirm={handleDelete}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
