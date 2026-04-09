import { useState } from "react";
import { Search, GripVertical } from "lucide-react";
import { useMembers } from "@/api/members";
import { useDrag, type DragPayload } from "./DragContext";

export default function DragMembersPanel() {
  const { data: members } = useMembers();
  const dragCtx = useDrag();
  const [search, setSearch] = useState("");
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const activeMembers = (members || []).filter((m) => m.is_active);
  const filtered = search
    ? activeMembers.filter((m) => m.full_name.toLowerCase().includes(search.toLowerCase()))
    : activeMembers;

  const handleDragStart = (e: React.DragEvent, memberId: number, name: string, color: string) => {
    const payload: DragPayload = {
      type: "new-member",
      memberId,
      memberName: name,
      memberColor: color,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
    setDraggingId(memberId);
    dragCtx?.setDragPayload(payload);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    dragCtx?.setDragPayload(null);
    dragCtx?.setHighlightedDate(null);
  };

  return (
    <div className="w-[200px] shrink-0 space-y-3">
      <div className="bg-surface-card rounded-2xl border border-[#F0EDF3] p-3">
        <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide mb-2 px-1">Equipo</h3>

        <div className="relative mb-2 w-full">
          <Search size={12} className="absolute left-2.5 top-0 bottom-0 my-auto text-text-tertiary pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full text-xs py-1.5 pl-7 pr-2 rounded-lg border border-[#F0EDF3] bg-white outline-none focus:border-p-pink-medium transition-colors"
          />
        </div>

        <div className="space-y-0.5 max-h-[60vh] overflow-auto">
          {filtered.map((m) => (
            <div
              key={m.id}
              draggable
              onDragStart={(e) => handleDragStart(e, m.id, m.full_name, m.color_tag)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-all hover:bg-p-lavender-light/50 ${
                draggingId === m.id ? "opacity-40" : ""
              }`}
            >
              <GripVertical size={10} className="text-text-tertiary shrink-0" />
              <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: m.color_tag }}>
                {m.full_name.charAt(0)}
              </div>
              <span className="text-xs text-text-primary truncate">{m.full_name}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-[10px] text-text-tertiary text-center py-3">Sin resultados</p>
          )}
        </div>
      </div>

      <div className="px-2">
        <p className="text-[9px] text-text-tertiary leading-relaxed">
          Arrastra un miembro al calendario para asignarle un turno
        </p>
      </div>
    </div>
  );
}
