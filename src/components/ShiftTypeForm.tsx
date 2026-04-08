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

  const inputClass = "w-full px-3 py-2 border border-pink-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Codigo</label>
          <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} required maxLength={10} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
          {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="countsAsWork"
          checked={countsAsWork}
          onChange={(e) => setCountsAsWork(e.target.checked)}
          className="rounded border-pink-300 text-pink-500 focus:ring-pink-400"
        />
        <label htmlFor="countsAsWork" className="text-sm text-gray-700">Cuenta como tiempo de trabajo</label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? "border-pink-500 scale-110" : "border-transparent"}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={loading} className="flex-1 bg-pink-500 text-white py-2 rounded-md text-sm font-medium hover:bg-pink-600 disabled:opacity-50">
          {loading ? "Guardando..." : shiftType ? "Actualizar" : "Crear"}
        </button>
        <button type="button" onClick={onCancel} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md text-sm font-medium hover:bg-gray-200">
          Cancelar
        </button>
      </div>
    </form>
  );
}
