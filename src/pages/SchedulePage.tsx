import { useState } from "react";
import { Calendar, Download, Sparkles, CheckCircle, AlertTriangle, Clock, CalendarPlus } from "lucide-react";
import PeriodSelector from "@/components/PeriodSelector";
import ScheduleGrid from "@/components/ScheduleGrid";
import GenerateDialog from "@/components/GenerateDialog";
import { useActivatePeriod, useValidation } from "@/api/schedule";
import { showToast } from "@/components/Toast";
import type { SchedulePeriod } from "@/types/schedule";

export default function SchedulePage() {
  const [selectedPeriod, setSelectedPeriod] = useState<SchedulePeriod | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const activatePeriod = useActivatePeriod();
  const { data: warnings } = useValidation(selectedPeriod?.id ?? null);

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
      showToast("Excel exportado", "success");
    } catch {
      showToast("Error al exportar Excel", "error");
    }
  };

  const handleActivate = () => {
    if (!selectedPeriod || selectedPeriod.status === "active") return;
    if (!confirm("Activar este periodo? No se podran editar las asignaciones despues.")) return;
    activatePeriod.mutate(selectedPeriod.id, {
      onSuccess: (updated) => setSelectedPeriod(updated),
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
          <Calendar size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-warm-dark">Horarios</h2>
          <p className="text-sm text-warm-secondary">Asigna turnos al equipo</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-3 flex items-center justify-between mb-5">
        <PeriodSelector selected={selectedPeriod} onSelect={setSelectedPeriod} />
        {selectedPeriod && (
          <div className="flex items-center gap-2.5">
            <button onClick={handleExportExcel} className="btn-secondary text-sm px-3 py-2">
              <Download size={14} /> Excel
            </button>
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium border ${
              selectedPeriod.status === "active"
                ? "bg-pastel-mint-light text-green-700 border-pastel-mint"
                : "bg-pastel-peach-light text-amber-700 border-pastel-peach"
            }`}>
              {selectedPeriod.status === "active" ? "Activo" : "Borrador"}
            </span>
            {selectedPeriod.status === "draft" && (
              <>
                <button onClick={() => setShowGenerate(true)} className="btn-primary text-sm px-3 py-2" style={{ background: "linear-gradient(135deg, #c4b5fd, #e8d5f5)" }}>
                  <Sparkles size={14} /> Generar
                </button>
                <button onClick={handleActivate} disabled={activatePeriod.isPending} className="btn-primary text-sm px-3 py-2" style={{ background: "linear-gradient(135deg, #86efac, #c5eadb)" }}>
                  <CheckCircle size={14} /> Activar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {warnings && warnings.length > 0 && (
        <div className="mb-5 glass-card bg-pastel-peach-light/70 border-pastel-peach rounded-2xl p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
            <AlertTriangle size={15} /> Avisos ({warnings.length})
          </h4>
          <ul className="space-y-1.5">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-700 flex items-center gap-2">
                {w.type === "hours_exceeded" ? <Clock size={12} /> : <Calendar size={12} />}
                {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showGenerate && selectedPeriod && (
        <GenerateDialog periodId={selectedPeriod.id} onClose={() => setShowGenerate(false)} />
      )}

      {selectedPeriod ? (
        <div className="glass-card rounded-2xl shadow-soft overflow-hidden">
          <ScheduleGrid
            periodId={selectedPeriod.id}
            startDate={selectedPeriod.start_date}
            endDate={selectedPeriod.end_date}
            isActive={selectedPeriod.status === "active"}
          />
        </div>
      ) : (
        <div className="text-center py-16">
          <CalendarPlus size={48} className="mx-auto text-pastel-pink mb-3" />
          <p className="text-lg text-warm-dark mb-1">Selecciona o crea un periodo</p>
          <p className="text-sm text-warm-secondary">Los horarios se organizan por mes</p>
        </div>
      )}
    </div>
  );
}
