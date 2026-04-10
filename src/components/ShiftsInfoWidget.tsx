import { Settings } from "lucide-react";
import { useShiftTypes } from "@/api/shiftTypes";
import { CATEGORY_LABELS } from "@/constants";

interface Props {
  onOpenConfig?: () => void;
}

export default function ShiftsInfoWidget({ onOpenConfig }: Props) {
  const { data: shiftTypes } = useShiftTypes();
  const active = (shiftTypes || []).filter((s) => s.is_active);

  return (
    <div className="bg-surface-card rounded-xl border border-[#F0EDF3] h-[200px] sm:h-[400px] flex flex-col">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <h3 className="text-sm font-bold text-text-primary">Turnos</h3>
        {onOpenConfig && (
          <button onClick={onOpenConfig} className="text-[10px] font-medium text-text-tertiary hover:text-text-primary flex items-center gap-1 transition-colors">
            <Settings size={11} /> Modificar
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto px-4 pb-4">
        {active.length === 0 ? (
          <p className="text-xs text-text-tertiary">Sin turnos configurados</p>
        ) : (
          <div className="space-y-2">
            {active.map((st) => (
              <div key={st.id} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ backgroundColor: st.color }}>
                  {st.code}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text-primary truncate">{st.name}</p>
                  <p className="text-[10px] text-text-tertiary">
                    {CATEGORY_LABELS[st.category] || st.category}
                    {st.default_start_time && ` · ${st.default_start_time}-${st.default_end_time}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
