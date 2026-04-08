import { useState } from "react";
import { Plus } from "lucide-react";
import { usePeriods, useCreatePeriod } from "@/api/schedule";
import type { SchedulePeriod } from "@/types/schedule";

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

interface Props {
  selected: SchedulePeriod | null;
  onSelect: (period: SchedulePeriod) => void;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function PeriodSelector({ selected, onSelect }: Props) {
  const { data: periods } = usePeriods();
  const createPeriod = useCreatePeriod();
  const [showNew, setShowNew] = useState(false);

  const now = new Date();
  const [newYear, setNewYear] = useState(now.getFullYear());
  const [newMonth, setNewMonth] = useState(now.getMonth() + 1);

  const handleCreate = () => {
    const days = daysInMonth(newYear, newMonth);
    const start = `${newYear}-${String(newMonth).padStart(2, "0")}-01`;
    const end = `${newYear}-${String(newMonth).padStart(2, "0")}-${String(days).padStart(2, "0")}`;
    const name = `${MONTH_NAMES[newMonth - 1]} ${newYear}`;
    createPeriod.mutate(
      { name, year: newYear, month: newMonth, start_date: start, end_date: end },
      { onSuccess: (period) => { onSelect(period); setShowNew(false); } },
    );
  };

  return (
    <div className="flex items-center gap-3">
      <select
        value={selected?.id ?? ""}
        onChange={(e) => {
          const p = periods?.find((p) => p.id === Number(e.target.value));
          if (p) onSelect(p);
        }}
        className="input-pastel w-auto min-w-[200px]"
      >
        <option value="">Seleccionar periodo</option>
        {periods?.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} {p.status === "active" ? " ✓" : " (borrador)"}
          </option>
        ))}
      </select>

      {!showNew ? (
        <button onClick={() => setShowNew(true)} className="btn-secondary text-sm px-3 py-2">
          <Plus size={14} /> Nuevo
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <select value={newMonth} onChange={(e) => setNewMonth(Number(e.target.value))} className="input-pastel w-auto">
            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={newYear} onChange={(e) => setNewYear(Number(e.target.value))} className="input-pastel w-20" />
          <button onClick={handleCreate} disabled={createPeriod.isPending} className="btn-primary text-sm px-3 py-2">
            Crear
          </button>
          <button onClick={() => setShowNew(false)} className="text-sm text-warm-secondary hover:text-warm-dark transition-colors">
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
