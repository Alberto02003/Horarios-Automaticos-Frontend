import { useState, useEffect } from "react";
import type { ShiftType, ShiftTypeCreate } from "@/types/shift";

const CATEGORY_OPTIONS = [
  { value: "work", label: "Trabajo" },
  { value: "vacation", label: "Vacaciones" },
  { value: "special", label: "Especial" },
];

const PRESET_COLORS = [
  "#3B82F6", "#F59E0B", "#6366F1", "#10B981",
  "#EF4444", "#9CA3AF", "#F472B6", "#8B5CF6",
  "#14B8A6", "#FB923C",
];

interface Props {
  shiftType?: ShiftType | null;
  onSubmit: (data: ShiftTypeCreate) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ShiftTypeForm({ shiftType, onSubmit, onCancel, loading }: Props) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("work");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [countsAsWork, setCountsAsWork] = useState(true);
  const [color, setColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    if (shiftType) {
      setCode(shiftType.code);
      setName(shiftType.name);
      setCategory(shiftType.category);
      setStartTime(shiftType.default_start_time || "");
      setEndTime(shiftType.default_end_time || "");
      setCountsAsWork(shiftType.counts_as_work_time);
      setColor(shiftType.color);
    }
  }, [shiftType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category,
      default_start_time: startTime || null,
      default_end_time: endTime || null,
      counts_as_work_time: countsAsWork,
      color,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-secondary mb-1.5">Codigo</label>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="input-pastel" required maxLength={10} />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-secondary mb-1.5">Nombre</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-pastel" required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-warm-secondary mb-1.5">Categoria</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-pastel">
          {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-warm-secondary mb-1.5">Hora inicio</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-pastel" />
        </div>
        <div>
          <label className="block text-sm font-medium text-warm-secondary mb-1.5">Hora fin</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-pastel" />
        </div>
      </div>
      <label className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-pastel-pink-light/50 transition-colors cursor-pointer">
        <input type="checkbox" checked={countsAsWork} onChange={(e) => setCountsAsWork(e.target.checked)} className="rounded border-pastel-pink text-pastel-pink-deep focus:ring-pastel-pink-medium" />
        <span className="text-sm text-warm-dark">Cuenta como tiempo de trabajo</span>
      </label>
      <div>
        <label className="block text-sm font-medium text-warm-secondary mb-1.5">Color</label>
        <div className="flex gap-2.5 flex-wrap bg-pastel-pink-light/30 rounded-2xl p-3">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 ${
                color === c ? "ring-2 ring-offset-2 ring-pastel-pink-deep scale-110" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Guardando..." : shiftType ? "Actualizar" : "Crear"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancelar
        </button>
      </div>
    </form>
  );
}
