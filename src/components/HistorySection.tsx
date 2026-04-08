import { useState } from "react";
import { History, ChevronDown, ChevronUp, Calendar, Download } from "lucide-react";
import { usePeriods } from "@/api/schedule";
import { useToast } from "@/components/ui/ToastProvider";
import type { SchedulePeriod } from "@/types/schedule";

interface Props {
  onSelectPeriod: (period: SchedulePeriod) => void;
}

export default function HistorySection({ onSelectPeriod }: Props) {
  const { data: periods } = usePeriods();
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);

  const currentYear = new Date().getFullYear();

  // Historic = active periods from past years
  const historic = (periods || []).filter((p) => p.status === "active" && p.year < currentYear);

  // Group by year
  const byYear: Record<number, typeof historic> = {};
  historic.forEach((p) => {
    if (!byYear[p.year]) byYear[p.year] = [];
    byYear[p.year].push(p);
  });
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a);

  const handleExport = async (period: SchedulePeriod) => {
    const token = localStorage.getItem("token");
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
    try {
      const res = await fetch(`${apiBase}/api/schedule-periods/${period.id}/export/excel`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `horarios_${period.name.replace(/ /g, "_")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Excel exportado");
    } catch {
      toast("Error al exportar", "error");
    }
  };

  if (!years.length) return null;

  return (
    <div className="bg-surface-card rounded-xl border border-[#F0EDF3] p-5">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <History size={16} className="text-text-tertiary" />
          <h3 className="text-sm font-bold text-text-primary">Historico</h3>
          <span className="text-[10px] font-semibold text-text-tertiary bg-[#F0EDF3] px-2 py-0.5 rounded-full">{historic.length}</span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-text-tertiary" /> : <ChevronDown size={16} className="text-text-tertiary" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {years.map((year) => (
            <div key={year}>
              <p className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-2">{year}</p>
              <div className="space-y-1.5">
                {byYear[year].map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[#F0EDF3] group hover:shadow-xs transition-all">
                    <div className="w-7 h-7 rounded-lg bg-p-mint-light flex items-center justify-center shrink-0">
                      <Calendar size={12} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">{p.name}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onSelectPeriod(p)} className="px-2 py-1 rounded-md text-[10px] font-medium bg-p-lavender-light text-purple-600 hover:bg-p-lavender/40 transition-colors">
                        Ver
                      </button>
                      <button onClick={() => handleExport(p)} className="p-1 rounded-md hover:bg-p-lavender-light transition-colors">
                        <Download size={12} className="text-text-tertiary" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
