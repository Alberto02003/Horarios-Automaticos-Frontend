import { useState } from "react";
import { Plus } from "lucide-react";
import Select from "@/components/ui/Select";
import { usePeriods, useCreatePeriod } from "@/api/schedule";
import { useToast } from "@/components/ui/ToastProvider";
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
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);

  const now = new Date();
  const [newYear, setNewYear] = useState(now.getFullYear());
  const [newMonth, setNewMonth] = useState(now.getMonth() + 1);

  const handleCreate = () => {
    // Check if active period exists for this month
    const existing = periods?.find((p) => p.year === newYear && p.month === newMonth && p.status === "active");
    if (existing) {
      toast(`Ya existe un periodo activo para ${MONTH_NAMES[newMonth - 1]} ${newYear}. Eliminalo primero.`, "error");
      return;
    }

    const days = daysInMonth(newYear, newMonth);
    const start = `${newYear}-${String(newMonth).padStart(2, "0")}-01`;
    const end = `${newYear}-${String(newMonth).padStart(2, "0")}-${String(days).padStart(2, "0")}`;
    const name = `${MONTH_NAMES[newMonth - 1]} ${newYear}`;
    createPeriod.mutate(
      { name, year: newYear, month: newMonth, start_date: start, end_date: end },
      {
        onSuccess: (period) => { onSelect(period); setShowNew(false); },
        onError: (err) => { toast(err instanceof Error ? err.message : "Error al crear periodo", "error"); },
      },
    );
  };

  const periodOptions = (periods || []).map((p) => ({
    value: String(p.id),
    label: `${p.name}${p.status === "active" ? " ✓" : " (borrador)"}`,
  }));

  const monthOptions = MONTH_NAMES.map((m, i) => ({ value: String(i + 1), label: m }));

  return (
    <div className="flex items-center gap-3">
      <Select
        value={selected ? String(selected.id) : ""}
        onValueChange={(val) => {
          const p = periods?.find((p) => p.id === Number(val));
          if (p) onSelect(p);
        }}
        options={periodOptions}
        placeholder="Seleccionar periodo"
      />

      {!showNew ? (
        <button onClick={() => setShowNew(true)} className="btn-secondary text-sm px-3 py-2">
          <Plus size={14} /> Nuevo
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <Select
            value={String(newMonth)}
            onValueChange={(val) => setNewMonth(Number(val))}
            options={monthOptions}
            placeholder="Mes"
          />
          <input type="number" value={newYear} onChange={(e) => setNewYear(Number(e.target.value))} className="input-pastel w-20" />
          <button onClick={handleCreate} disabled={createPeriod.isPending} className="btn-primary text-sm px-3 py-2">
            Crear
          </button>
          <button onClick={() => setShowNew(false)} className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
