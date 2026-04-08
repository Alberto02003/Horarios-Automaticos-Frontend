import { useState } from "react";
import { useGenerate, useGenerationRuns } from "@/api/generation";

const STRATEGIES = [
  { value: "balanced", label: "Equilibrado", desc: "Distribuye horas equitativamente entre miembros" },
  { value: "coverage", label: "Cobertura", desc: "Prioriza llenar todos los slots disponibles" },
  { value: "conservative", label: "Conservador", desc: "Solo rellena huecos sin asignar" },
];

interface Props {
  periodId: number;
  onClose: () => void;
}

export default function GenerateDialog({ periodId, onClose }: Props) {
  const [strategy, setStrategy] = useState("balanced");
  const [fillOnly, setFillOnly] = useState(true);
  const generate = useGenerate(periodId);
  const { data: runs } = useGenerationRuns(periodId);
  const [result, setResult] = useState<{ proposals_count: number; created_count: number } | null>(null);

  const handleGenerate = () => {
    generate.mutate(
      { strategy, fill_unassigned_only: fillOnly },
      { onSuccess: (data) => setResult(data) },
    );
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-lg border border-pink-100">
        <h3 className="text-lg font-semibold text-pink-900 mb-4">Generar horario</h3>

        {result ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">Generacion completada</p>
              <p className="text-sm text-green-700 mt-1">
                {result.created_count} asignaciones creadas con estrategia "{strategy}"
              </p>
            </div>
            <button onClick={onClose} className="w-full bg-pink-500 text-white py-2 rounded-md text-sm font-medium hover:bg-pink-600">
              Cerrar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estrategia</label>
              <div className="space-y-2">
                {STRATEGIES.map((s) => (
                  <label
                    key={s.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      strategy === s.value ? "border-pink-400 bg-pink-50/50" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="strategy"
                      value={s.value}
                      checked={strategy === s.value}
                      onChange={() => setStrategy(s.value)}
                      className="mt-0.5 text-pink-500 focus:ring-pink-400"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.label}</p>
                      <p className="text-xs text-gray-500">{s.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={fillOnly}
                onChange={(e) => setFillOnly(e.target.checked)}
                className="rounded border-pink-300 text-pink-500 focus:ring-pink-400"
              />
              <span className="text-sm text-gray-700">Solo rellenar huecos (no sobreescribir)</span>
            </label>

            {runs && runs.length > 0 && (
              <div className="text-xs text-gray-500 border-t border-pink-50 pt-3">
                Ultima generacion: {STRATEGIES.find(s => s.value === runs[0].strategy)?.label} —{" "}
                {runs[0].result_summary_jsonb?.created_count} asignaciones
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleGenerate}
                disabled={generate.isPending}
                className="flex-1 bg-pink-500 text-white py-2 rounded-md text-sm font-medium hover:bg-pink-600 disabled:opacity-50"
              >
                {generate.isPending ? "Generando..." : "Generar"}
              </button>
              <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md text-sm font-medium hover:bg-gray-200">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
