import { useState, useEffect } from "react";
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
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  };

  const inputClass = "w-full px-3 py-2 border border-pink-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400";

  if (isLoading) return <div className="p-6 text-gray-400 text-sm">Cargando...</div>;

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-pink-900">Configuracion</h2>
        <p className="text-sm text-gray-500">Preferencias globales de generacion de horarios</p>
      </div>

      <div className="bg-white rounded-xl border border-pink-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Limite de horas semanales</label>
          <input type="number" value={weeklyLimit} onChange={(e) => setWeeklyLimit(e.target.value)} min="1" step="0.5" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horas minimas de descanso entre turnos</label>
          <input type="number" value={minRest} onChange={(e) => setMinRest(e.target.value)} min="0" max="24" className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximo dias consecutivos de trabajo</label>
          <input type="number" value={maxConsecutive} onChange={(e) => setMaxConsecutive(e.target.value)} min="1" max="14" className={inputClass} />
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={weekendWork} onChange={(e) => setWeekendWork(e.target.checked)} className="rounded border-pink-300 text-pink-500 focus:ring-pink-400" />
            <span className="text-sm text-gray-700">Permitir trabajo en fines de semana</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={balanced} onChange={(e) => setBalanced(e.target.checked)} className="rounded border-pink-300 text-pink-500 focus:ring-pink-400" />
            <span className="text-sm text-gray-700">Preferir distribucion equilibrada</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={fillUnassigned} onChange={(e) => setFillUnassigned(e.target.checked)} className="rounded border-pink-300 text-pink-500 focus:ring-pink-400" />
            <span className="text-sm text-gray-700">Solo rellenar huecos sin asignar</span>
          </label>
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={updatePrefs.isPending}
            className="bg-pink-500 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-pink-600 disabled:opacity-50"
          >
            {updatePrefs.isPending ? "Guardando..." : "Guardar cambios"}
          </button>
          {saved && <span className="ml-3 text-sm text-green-600">Guardado</span>}
        </div>
      </div>
    </div>
  );
}
