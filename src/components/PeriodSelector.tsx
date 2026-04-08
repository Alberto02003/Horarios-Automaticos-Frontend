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
  showAll?: boolean; // show all periods (active+draft) instead of just active current year
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function PeriodSelector({ selected, onSelect, showAll = false }: Props) {
  const { data: periods } = usePeriods();
  const createPeriod = useCreatePeriod();
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);

  const currentYear = new Date().getFullYear();
  const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);

  const filteredPeriods = showAll
    ? (periods || [])
    : (periods || []).filter((p) => p.year === currentYear && p.status === "active");

  const periodOptions = filteredPeriods.map((p) => ({
    value: String(p.id),
    label: showAll ? `${p.name}${p.status === "active" ? " ✓" : " (borrador)"}` : p.name,
  }));

  const monthOptions = MONTH_NAMES.map((m, i) => ({ value: String(i + 1), label: m }));

  const handleCreate = () => {
    const existing = periods?.find((p) => p.year === currentYear && p.month === newMonth && p.status === "active");
    if (existing) {
      toast(`Ya existe un periodo activo para ${MONTH_NAMES[newMonth - 1]} ${currentYear}. Eliminalo primero.`, "error");
      return;
    }

    const days = daysInMonth(currentYear, newMonth);
    const start = `${currentYear}-${String(newMonth).padStart(2, "0")}-01`;
    const end = `${currentYear}-${String(newMonth).padStart(2, "0")}-${String(days).padStart(2, "0")}`;
    const name = `${MONTH_NAMES[newMonth - 1]} ${currentYear}`;
    createPeriod.mutate(
      { name, year: currentYear, month: newMonth, start_date: start, end_date: end },
      {
        onSuccess: (period) => { onSelect(period); setShowNew(false); },
        onError: (err) => { toast(err instanceof Error ? err.message : "Error al crear periodo", "error"); },
      },
    );
  };

  return (
    <div className="flex items-center gap-3">
      <Select
        value={selected ? String(selected.id) : ""}
        onValueChange={(val) => {
          const p = periods?.find((p) => p.id === Number(val));
          if (p) onSelect(p);
        }}
        options={periodOptions}
        placeholder="Seleccionar periodo activo"
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
          <span className="text-sm font-medium text-text-secondary">{currentYear}</span>
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
