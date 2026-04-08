import { useState, useEffect } from "react";
import { Settings, Check } from "lucide-react";
import { useGlobalPreferences, useUpdateGlobalPreferences } from "@/api/preferences";

export default function ConfigPage() {
  const { data: prefs, isLoading } = useGlobalPreferences();
  const updatePrefs = useUpdateGlobalPreferences();

  const [weeklyLimit, setWeeklyLimit] = useState("40");
  const [minRest, setMinRest] = useState("12");
  const [maxConsecutive, setMaxConsecutive] = useState("6");
  const [weekendWork, setWeekendWork] = useState(true);
  const [balanced, setBalanced] = useState(true);
  const [fillUnassigned, setFillUnassigned] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (prefs) {
      setWeeklyLimit(String(prefs.general_weekly_hour_limit));
      const p = prefs.preferences_jsonb;
      if (p.min_rest_hours != null) setMinRest(String(p.min_rest_hours));
      if (p.max_consecutive_days != null) setMaxConsecutive(String(p.max_consecutive_days));
      if (p.allow_weekend_work != null) setWeekendWork(p.allow_weekend_work);
      if (p.prefer_balanced_distribution != null) setBalanced(p.prefer_balanced_distribution);
      if (p.fill_unassigned_only != null) setFillUnassigned(p.fill_unassigned_only);
    }
  }, [prefs]);

  const handleSave = () => {
    updatePrefs.mutate(
      {
        general_weekly_hour_limit: parseFloat(weeklyLimit),
        preferences_jsonb: {
          min_rest_hours: parseInt(minRest),
          max_consecutive_days: parseInt(maxConsecutive),
          allow_weekend_work: weekendWork,
          prefer_balanced_distribution: balanced,
          fill_unassigned_only: fillUnassigned,
        },
      },
      { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); } },
    );
  };

  if (isLoading) return <div className="p-6 text-warm-secondary text-sm">Cargando...</div>;

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl gradient-pink flex items-center justify-center">
          <Settings size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-warm-dark">Configuracion</h2>
          <p className="text-sm text-warm-secondary">Preferencias globales de generacion</p>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-8 shadow-soft space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-warm-dark mb-4">Limites de horas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-warm-secondary mb-1.5">Horas semanales</label>
              <input type="number" value={weeklyLimit} onChange={(e) => setWeeklyLimit(e.target.value)} min="1" step="0.5" className="input-pastel" />
            </div>
            <div>
              <label className="block text-sm text-warm-secondary mb-1.5">Descanso minimo (h)</label>
              <input type="number" value={minRest} onChange={(e) => setMinRest(e.target.value)} min="0" max="24" className="input-pastel" />
            </div>
            <div>
              <label className="block text-sm text-warm-secondary mb-1.5">Max dias consecutivos</label>
              <input type="number" value={maxConsecutive} onChange={(e) => setMaxConsecutive(e.target.value)} min="1" max="14" className="input-pastel" />
            </div>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-pastel-pink to-transparent" />

        <div>
          <h3 className="text-sm font-semibold text-warm-dark mb-4">Reglas de generacion</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-pastel-pink-light/50 transition-colors cursor-pointer">
              <input type="checkbox" checked={weekendWork} onChange={(e) => setWeekendWork(e.target.checked)} className="rounded border-pastel-pink text-pastel-pink-deep focus:ring-pastel-pink-medium" />
              <span className="text-sm text-warm-dark">Permitir trabajo en fines de semana</span>
            </label>
            <label className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-pastel-pink-light/50 transition-colors cursor-pointer">
              <input type="checkbox" checked={balanced} onChange={(e) => setBalanced(e.target.checked)} className="rounded border-pastel-pink text-pastel-pink-deep focus:ring-pastel-pink-medium" />
              <span className="text-sm text-warm-dark">Preferir distribucion equilibrada</span>
            </label>
            <label className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-pastel-pink-light/50 transition-colors cursor-pointer">
              <input type="checkbox" checked={fillUnassigned} onChange={(e) => setFillUnassigned(e.target.checked)} className="rounded border-pastel-pink text-pastel-pink-deep focus:ring-pastel-pink-medium" />
              <span className="text-sm text-warm-dark">Solo rellenar huecos sin asignar</span>
            </label>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-pastel-pink to-transparent" />

        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={updatePrefs.isPending} className="btn-primary">
            {updatePrefs.isPending ? "Guardando..." : "Guardar cambios"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 animate-fade-in">
              <Check size={16} /> Guardado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
