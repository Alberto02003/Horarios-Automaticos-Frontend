import { useState, useEffect } from "react";
import type { Member, MemberCreate } from "@/types/member";

const PRESET_COLORS = [
  "#F472B6", "#FB923C", "#FBBF24", "#A3E635",
  "#34D399", "#22D3EE", "#818CF8", "#C084FC",
  "#F87171", "#9CA3AF",
];

interface Props {
  member?: Member | null;
  onSubmit: (data: MemberCreate) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function MemberForm({ member, onSubmit, onCancel, loading }: Props) {
  const [fullName, setFullName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("40");
  const [colorTag, setColorTag] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    if (member) {
      setFullName(member.full_name);
      setRoleName(member.role_name);
      setWeeklyHours(String(member.weekly_hour_limit));
      setColorTag(member.color_tag);
    }
  }, [member]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      full_name: fullName.trim(),
      role_name: roleName.trim(),
      weekly_hour_limit: parseFloat(weeklyHours),
      color_tag: colorTag,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full px-3 py-2 border border-pink-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
        <input
          type="text"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          className="w-full px-3 py-2 border border-pink-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Horas semanales</label>
        <input
          type="number"
          value={weeklyHours}
          onChange={(e) => setWeeklyHours(e.target.value)}
          min="1"
          max="168"
          step="0.5"
          className="w-full px-3 py-2 border border-pink-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColorTag(c)}
              className={`w-8 h-8 rounded-full border-2 transition-all ${
                colorTag === c ? "border-pink-500 scale-110" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-pink-500 text-white py-2 rounded-md text-sm font-medium hover:bg-pink-600 disabled:opacity-50"
        >
          {loading ? "Guardando..." : member ? "Actualizar" : "Crear"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
