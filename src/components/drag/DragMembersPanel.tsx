import { useState } from "react";
import { Search, GripVertical, Settings } from "lucide-react";
import { useMembers } from "@/api/members";
import { useDrag, type DragPayload } from "./DragContext";

interface Props {
  onOpenConfig?: () => void;
}

export default function DragMembersPanel({ onOpenConfig }: Props) {
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
    <div className="bg-surface-card rounded-xl border border-[#F0EDF3] h-[200px] flex flex-col">
      <div className="flex items-center justify-between px-3 pt-3 pb-1 shrink-0">
        <h3 className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wide">Equipo</h3>
        {onOpenConfig && (
          <button onClick={onOpenConfig} className="text-[10px] font-medium text-text-tertiary hover:text-text-primary flex items-center gap-1 transition-colors">
            <Settings size={11} /> Modificar
          </button>
        )}
      </div>

      <div className="px-3 pb-1 shrink-0">
        <div className="relative w-full">
          <Search size={12} className="absolute left-2.5 top-0 bottom-0 my-auto text-text-tertiary pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full text-xs py-1.5 pl-7 pr-2 rounded-lg border border-[#F0EDF3] bg-white outline-none focus:border-p-pink-medium transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-3 pb-3 space-y-0.5">
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
  );
}
