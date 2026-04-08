import { useState } from "react";
import { Scale, LayoutGrid, Shield, CheckCircle } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useGenerate, useGenerationRuns } from "@/api/generation";

const STRATEGIES = [
  { value: "balanced", label: "Equilibrado", desc: "Distribuye horas equitativamente entre miembros", icon: Scale },
  { value: "coverage", label: "Cobertura", desc: "Prioriza llenar todos los slots disponibles", icon: LayoutGrid },
  { value: "conservative", label: "Conservador", desc: "Solo rellena huecos sin asignar", icon: Shield },
];

interface Props {
  periodId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GenerateDialog({ periodId, open, onOpenChange }: Props) {
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

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => setResult(null), 200);
  };

  return (
    <Modal open={open} onOpenChange={handleClose} title="Generar horario">
      {result ? (
        <div className="space-y-5">
          <div className="bg-pastel-mint-light/70 border border-pastel-mint rounded-2xl p-5 flex items-start gap-3">
            <CheckCircle size={20} className="text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-warm-dark">Generacion completada</p>
              <p className="text-sm text-warm-secondary mt-1">
                {result.created_count} asignaciones creadas con estrategia "{STRATEGIES.find(s => s.value === strategy)?.label}"
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="btn-primary w-full">Cerrar</button>
        </div>
      ) : (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-warm-dark mb-3">Estrategia</label>
            <div className="space-y-2">
              {STRATEGIES.map((s) => (
                <label
                  key={s.value}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    strategy === s.value
                      ? "border-pastel-pink-medium bg-pastel-pink-light/40 shadow-soft"
                      : "border-pastel-pink/20 hover:bg-pastel-pink-light/20"
                  }`}
                >
                  <input type="radio" name="strategy" value={s.value} checked={strategy === s.value} onChange={() => setStrategy(s.value)} className="sr-only" />
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    strategy === s.value ? "gradient-pink text-white" : "bg-pastel-pink-light text-pastel-pink-medium"
                  }`}>
                    <s.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-warm-dark">{s.label}</p>
                    <p className="text-xs text-warm-secondary mt-0.5">{s.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-pastel-pink-light/50 transition-colors cursor-pointer">
            <input type="checkbox" checked={fillOnly} onChange={(e) => setFillOnly(e.target.checked)} className="rounded border-pastel-pink text-pastel-pink-deep focus:ring-pastel-pink-medium" />
            <span className="text-sm text-warm-dark">Solo rellenar huecos (no sobreescribir)</span>
          </label>

          {runs && runs.length > 0 && (
            <div className="text-xs text-warm-secondary border-t border-pastel-pink/20 pt-3">
              Ultima generacion: {STRATEGIES.find(s => s.value === runs[0].strategy)?.label} — {runs[0].result_summary_jsonb?.created_count} asignaciones
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={handleGenerate} disabled={generate.isPending} className="btn-primary flex-1">
              {generate.isPending ? "Generando..." : "Generar"}
            </button>
            <button onClick={handleClose} className="btn-secondary flex-1">Cancelar</button>
          </div>
        </div>
      )}
    </Modal>
  );
}
