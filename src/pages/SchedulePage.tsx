import { useState } from "react";
import PeriodSelector from "@/components/PeriodSelector";
import ScheduleGrid from "@/components/ScheduleGrid";
import GenerateDialog from "@/components/GenerateDialog";
import { useActivatePeriod, useValidation } from "@/api/schedule";
import type { SchedulePeriod } from "@/types/schedule";

export default function SchedulePage() {
  const [selectedPeriod, setSelectedPeriod] = useState<SchedulePeriod | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const activatePeriod = useActivatePeriod();
  const { data: warnings } = useValidation(selectedPeriod?.id ?? null);

  const handleActivate = () => {
    if (!selectedPeriod || selectedPeriod.status === "active") return;
    if (!confirm("Activar este periodo? No se podran editar las asignaciones despues.")) return;
    activatePeriod.mutate(selectedPeriod.id, {
      onSuccess: (updated) => setSelectedPeriod(updated),
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-pink-900">Horarios</h2>
          <p className="text-sm text-gray-500">Asigna turnos al equipo</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <PeriodSelector selected={selectedPeriod} onSelect={setSelectedPeriod} />
        {selectedPeriod && (
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              selectedPeriod.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}>
              {selectedPeriod.status === "active" ? "Activo" : "Borrador"}
            </span>
            {selectedPeriod.status === "draft" && (
              <>
                <button
                  onClick={() => setShowGenerate(true)}
                  className="bg-purple-500 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-purple-600"
                >
                  Generar
                </button>
                <button
                  onClick={handleActivate}
                  disabled={activatePeriod.isPending}
                  className="bg-green-500 text-white px-3 py-1.5 rounded-md text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                >
                  Activar periodo
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Warnings panel */}
      {warnings && warnings.length > 0 && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-amber-800 mb-1">Avisos ({warnings.length})</h4>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-xs text-amber-700 flex items-center gap-1.5">
                <span>{w.type === "hours_exceeded" ? "⏰" : "📅"}</span>
                {w.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Generate dialog */}
      {showGenerate && selectedPeriod && (
        <GenerateDialog periodId={selectedPeriod.id} onClose={() => setShowGenerate(false)} />
      )}

      {/* Grid */}
      {selectedPeriod ? (
        <div className="bg-white rounded-xl border border-pink-100 overflow-hidden">
          <ScheduleGrid
            periodId={selectedPeriod.id}
            startDate={selectedPeriod.start_date}
            endDate={selectedPeriod.end_date}
            isActive={selectedPeriod.status === "active"}
          />
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">Selecciona o crea un periodo</p>
          <p className="text-sm">Los horarios se organizan por mes</p>
        </div>
      )}
    </div>
  );
}
