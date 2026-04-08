import { useState } from "react";
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
      {
        onSuccess: (period) => {
          onSelect(period);
          setShowNew(false);
        },
      },
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
        className="px-3 py-2 border border-pink-200 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
      >
        <option value="">Seleccionar periodo</option>
        {periods?.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} {p.status === "active" ? "✓" : "(borrador)"}
          </option>
        ))}
      </select>

      {!showNew ? (
        <button onClick={() => setShowNew(true)} className="text-pink-600 hover:text-pink-800 text-sm font-medium">
          + Nuevo
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <select value={newMonth} onChange={(e) => setNewMonth(Number(e.target.value))} className="px-2 py-1.5 border border-pink-200 rounded text-sm">
            {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" value={newYear} onChange={(e) => setNewYear(Number(e.target.value))} className="w-20 px-2 py-1.5 border border-pink-200 rounded text-sm" />
          <button onClick={handleCreate} disabled={createPeriod.isPending} className="bg-pink-500 text-white px-3 py-1.5 rounded text-sm hover:bg-pink-600 disabled:opacity-50">
            Crear
          </button>
          <button onClick={() => setShowNew(false)} className="text-gray-400 text-sm">Cancelar</button>
        </div>
      )}
    </div>
  );
}
