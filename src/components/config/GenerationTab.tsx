import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { useGlobalPreferences, useUpdateGlobalPreferences } from "@/api/preferences";
import { useShiftTypes } from "@/api/shiftTypes";
import type { ShiftCoverage } from "@/types/preferences";

export default function GenerationTab() {
  const { data: prefs } = useGlobalPreferences();
  const { data: shiftTypes } = useShiftTypes();
  const updatePrefs = useUpdateGlobalPreferences();

  const [weeklyLimit, setWeeklyLimit] = useState("40");
  const [minRest, setMinRest] = useState("12");
  const [maxConsecutive, setMaxConsecutive] = useState("6");
  const [weekendWork, setWeekendWork] = useState(true);
  const [balanced, setBalanced] = useState(true);
  const [fillUnassigned, setFillUnassigned] = useState(true);
  const [coverage, setCoverage] = useState<Record<string, ShiftCoverage>>({});
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
      if (p.shift_coverage) setCoverage(p.shift_coverage);
    }
  }, [prefs]);

  useEffect(() => {
    if (shiftTypes) {
      setCoverage((prev) => {
        const next = { ...prev };
        shiftTypes.filter((s) => s.is_active && s.counts_as_work_time).forEach((s) => {
          if (!next[String(s.id)]) next[String(s.id)] = { min: 0, max: 10 };
        });
        return next;
      });
    }
  }, [shiftTypes]);

  const updateCov = (id: string, field: "min" | "max", val: number) => {
    setCoverage((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));
  };

  const handleSave = () => {
    updatePrefs.mutate({
      general_weekly_hour_limit: parseFloat(weeklyLimit),
      preferences_jsonb: { min_rest_hours: parseInt(minRest), max_consecutive_days: parseInt(maxConsecutive), allow_weekend_work: weekendWork, prefer_balanced_distribution: balanced, fill_unassigned_only: fillUnassigned, shift_coverage: coverage },
    }, { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2000); } });
  };

  const workShifts = (shiftTypes || []).filter((s) => s.is_active && s.counts_as_work_time);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-3">General</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div><label className="block text-[10px] text-text-tertiary mb-1">Horas/sem</label><input type="number" value={weeklyLimit} onChange={(e) => setWeeklyLimit(e.target.value)} className="input-pastel text-xs py-1.5" /></div>
          <div><label className="block text-[10px] text-text-tertiary mb-1">Descanso (h)</label><input type="number" value={minRest} onChange={(e) => setMinRest(e.target.value)} className="input-pastel text-xs py-1.5" /></div>
          <div><label className="block text-[10px] text-text-tertiary mb-1">Max dias</label><input type="number" value={maxConsecutive} onChange={(e) => setMaxConsecutive(e.target.value)} className="input-pastel text-xs py-1.5" /></div>
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-2">Reglas</h3>
        <div className="space-y-0.5">
          {[
            { checked: weekendWork, set: setWeekendWork, label: "Fines de semana" },
            { checked: balanced, set: setBalanced, label: "Distribucion equilibrada" },
            { checked: fillUnassigned, set: setFillUnassigned, label: "Solo rellenar huecos" },
          ].map((item, i) => (
            <label key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-p-lavender-light/50 transition-colors cursor-pointer">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${item.checked ? "bg-text-primary border-text-primary" : "border-[#D8D5DD] bg-white"}`}>
                {item.checked && <Check size={10} className="text-white" strokeWidth={3} />}
              </div>
              <input type="checkbox" checked={item.checked} onChange={(e) => item.set(e.target.checked)} className="sr-only" />
              <span className="text-xs text-text-primary">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {workShifts.length > 0 && (
        <div>
          <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-2">Cobertura por turno</h3>
          <div className="space-y-2">
            {workShifts.map((st) => {
              const cov = coverage[String(st.id)] || { min: 0, max: 10 };
              return (
                <div key={st.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-[#F0EDF3]">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ backgroundColor: st.color }}>{st.code}</div>
                  <span className="text-xs text-text-primary flex-1 truncate">{st.name}</span>
                  <div className="flex gap-1">
                    <div className="text-center"><label className="block text-[8px] text-text-tertiary">Min</label><input type="number" value={cov.min} onChange={(e) => updateCov(String(st.id), "min", parseInt(e.target.value) || 0)} className="input-pastel text-xs py-1 px-1.5 w-12 text-center" /></div>
                    <div className="text-center"><label className="block text-[8px] text-text-tertiary">Max</label><input type="number" value={cov.max} onChange={(e) => updateCov(String(st.id), "max", parseInt(e.target.value) || 0)} className="input-pastel text-xs py-1 px-1.5 w-12 text-center" /></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <button onClick={handleSave} disabled={updatePrefs.isPending} className="btn-primary w-full text-xs py-2 rounded-xl">
        {saved ? "Guardado ✓" : updatePrefs.isPending ? "Guardando..." : "Guardar"}
      </button>
    </div>
  );
}
