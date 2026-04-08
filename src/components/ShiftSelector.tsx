import { Trash2 } from "lucide-react";
import { useShiftTypes } from "@/api/shiftTypes";

interface Props {
  onSelect: (shiftTypeId: number) => void;
  onRemove?: () => void;
  onClose: () => void;
}

export default function ShiftSelector({ onSelect, onRemove, onClose }: Props) {
  const { data: shiftTypes } = useShiftTypes();

  return (
    <div className="space-y-0.5">
      {shiftTypes?.map((st) => (
        <button
          key={st.id}
          onClick={() => { onSelect(st.id); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-pastel-pink-light/50 text-left transition-colors"
        >
          <div className="w-6 h-6 rounded-lg text-[10px] font-bold text-white flex items-center justify-center shadow-sm" style={{ backgroundColor: st.color }}>
            {st.code}
          </div>
          <span className="text-warm-dark">{st.name}</span>
        </button>
      ))}
      {onRemove && (
        <>
          <div className="h-px bg-pastel-pink/20 my-1" />
          <button
            onClick={() => { onRemove(); onClose(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Quitar asignacion
          </button>
        </>
      )}
    </div>
  );
}
