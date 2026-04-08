import { useState, useEffect } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Settings, Check } from "lucide-react";
import { useGlobalPreferences, useUpdateGlobalPreferences } from "@/api/preferences";

export default function ConfigMenu() {
  const { data: prefs } = useGlobalPreferences();
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

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
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

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="w-9 h-9 rounded-full bg-p-lavender-light flex items-center justify-center hover:bg-p-lavender transition-colors focus:outline-none">
          <Settings size={16} className="text-text-secondary" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 bg-surface-card rounded-xl border border-[#F0EDF3] shadow-lg p-4 w-[300px] animate-scale-in"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-3">Ajustes de generacion</h3>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="block text-[10px] text-text-tertiary mb-1">Horas/sem</label>
              <input type="number" value={weeklyLimit} onChange={(e) => setWeeklyLimit(e.target.value)} min="1" step="0.5" className="input-pastel text-xs py-1.5 px-2" />
            </div>
            <div>
              <label className="block text-[10px] text-text-tertiary mb-1">Descanso</label>
              <input type="number" value={minRest} onChange={(e) => setMinRest(e.target.value)} min="0" max="24" className="input-pastel text-xs py-1.5 px-2" />
            </div>
            <div>
              <label className="block text-[10px] text-text-tertiary mb-1">Max dias</label>
              <input type="number" value={maxConsecutive} onChange={(e) => setMaxConsecutive(e.target.value)} min="1" max="14" className="input-pastel text-xs py-1.5 px-2" />
            </div>
          </div>

          <div className="space-y-0.5 mb-3">
            {[
              { checked: weekendWork, set: setWeekendWork, label: "Fines de semana" },
              { checked: balanced, set: setBalanced, label: "Distribucion equilibrada" },
              { checked: fillUnassigned, set: setFillUnassigned, label: "Solo rellenar huecos" },
            ].map((item, i) => (
              <label key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-p-lavender-light/50 transition-colors cursor-pointer">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                  item.checked ? "bg-text-primary border-text-primary" : "border-[#D8D5DD] bg-white"
                }`}>
                  {item.checked && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>
                <input type="checkbox" checked={item.checked} onChange={(e) => item.set(e.target.checked)} className="sr-only" />
                <span className="text-xs text-text-primary">{item.label}</span>
              </label>
            ))}
          </div>

          <button onClick={handleSave} disabled={updatePrefs.isPending} className="btn-primary w-full text-xs py-2">
            {saved ? "Guardado ✓" : updatePrefs.isPending ? "Guardando..." : "Guardar"}
          </button>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
