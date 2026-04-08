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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Nombre completo</label>
        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-pastel" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Rol</label>
        <input type="text" value={roleName} onChange={(e) => setRoleName(e.target.value)} className="input-pastel" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Horas semanales</label>
        <input type="number" value={weeklyHours} onChange={(e) => setWeeklyHours(e.target.value)} min="1" max="168" step="0.5" className="input-pastel" required />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">Color</label>
        <div className="flex gap-2.5 flex-wrap bg-p-lavender-light/50 rounded-2xl p-3">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColorTag(c)}
              className={`w-8 h-8 rounded-full transition-all duration-200 hover:scale-110 ${
                colorTag === c ? "ring-2 ring-offset-2 ring-p-pink-deep scale-110" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Guardando..." : member ? "Actualizar" : "Crear"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancelar
        </button>
      </div>
    </form>
  );
}
