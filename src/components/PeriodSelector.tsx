import { useState } from "react";
import { Plus, CalendarPlus } from "lucide-react";
import SelectUI from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import { usePeriods, useCreatePeriod } from "@/api/schedule";
import { useToast } from "@/components/ui/ToastProvider";
import type { SchedulePeriod } from "@/types/schedule";

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

interface Props {
  selected: SchedulePeriod | null;
  onSelect: (period: SchedulePeriod) => void;
  showAll?: boolean;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export default function PeriodSelector({ selected, onSelect, showAll = false }: Props) {
  const { data: periods } = usePeriods();
  const createPeriod = useCreatePeriod();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);

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
        onSuccess: (period) => { onSelect(period); setShowModal(false); },
        onError: (err) => { toast(err instanceof Error ? err.message : "Error al crear periodo", "error"); },
      },
    );
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <SelectUI
          value={selected ? String(selected.id) : ""}
          onValueChange={(val) => {
            const p = periods?.find((p) => p.id === Number(val));
            if (p) onSelect(p);
          }}
          options={periodOptions}
          placeholder="Seleccionar periodo"
        />
        <button onClick={() => setShowModal(true)} className="btn-secondary text-sm px-3 py-2 rounded-xl">
          <Plus size={14} /> Nuevo
        </button>
      </div>

      <Modal open={showModal} onOpenChange={setShowModal} title="Nuevo horario">
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-p-lavender-light/40 border border-p-lavender/30">
            <CalendarPlus size={20} className="text-text-tertiary shrink-0" />
            <p className="text-sm text-text-secondary">Selecciona el mes para crear un nuevo periodo de horarios.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Mes</label>
            <SelectUI
              value={String(newMonth)}
              onValueChange={(val) => setNewMonth(Number(val))}
              options={monthOptions}
              placeholder="Seleccionar mes"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Año</label>
            <div className="input-pastel flex items-center justify-center text-sm font-medium text-text-primary">{currentYear}</div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleCreate} disabled={createPeriod.isPending} className="btn-primary flex-1 rounded-xl">
              {createPeriod.isPending ? "Creando..." : "Crear horario"}
            </button>
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 rounded-xl">
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
