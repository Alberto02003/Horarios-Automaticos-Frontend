import { useState, useEffect } from "react";
import { Check } from "lucide-react";
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

  if (isLoading) return <div className="p-8 text-text-tertiary text-sm">Cargando...</div>;

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Ajustes</h2>
        <p className="text-sm text-text-secondary mt-0.5">Preferencias de generacion de horarios</p>
      </div>

      <div className="space-y-6">
        {/* Limites */}
        <div className="bg-surface-card rounded-xl border border-[#F0EDF3] p-6">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">Limites de horas</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Horas/semana</label>
              <input type="number" value={weeklyLimit} onChange={(e) => setWeeklyLimit(e.target.value)} min="1" step="0.5" className="input-pastel" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Descanso min (h)</label>
              <input type="number" value={minRest} onChange={(e) => setMinRest(e.target.value)} min="0" max="24" className="input-pastel" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1.5">Max dias seguidos</label>
              <input type="number" value={maxConsecutive} onChange={(e) => setMaxConsecutive(e.target.value)} min="1" max="14" className="input-pastel" />
            </div>
          </div>
        </div>

        {/* Reglas */}
        <div className="bg-surface-card rounded-xl border border-[#F0EDF3] p-6">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">Reglas de generacion</h3>
          <div className="space-y-1">
            {[
              { checked: weekendWork, set: setWeekendWork, label: "Permitir trabajo en fines de semana" },
              { checked: balanced, set: setBalanced, label: "Preferir distribucion equilibrada" },
              { checked: fillUnassigned, set: setFillUnassigned, label: "Solo rellenar huecos sin asignar" },
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-p-lavender-light/50 transition-colors cursor-pointer">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  item.checked ? "bg-text-primary border-text-primary" : "border-[#D8D5DD] bg-white"
                }`}>
                  {item.checked && <Check size={12} className="text-white" strokeWidth={3} />}
                </div>
                <input type="checkbox" checked={item.checked} onChange={(e) => item.set(e.target.checked)} className="sr-only" />
                <span className="text-sm text-text-primary">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

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
