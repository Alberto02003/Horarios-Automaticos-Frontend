import { useShiftTypes } from "@/api/shiftTypes";

interface Props {
  onSelect: (shiftTypeId: number) => void;
  onRemove?: () => void;
  onClose: () => void;
}

export default function ShiftSelector({ onSelect, onRemove, onClose }: Props) {
  const { data: shiftTypes } = useShiftTypes();

  return (
    <div className="absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-pink-100 p-2 min-w-[160px]">
      <div className="space-y-1">
        {shiftTypes?.map((st) => (
          <button
            key={st.id}
            onClick={() => { onSelect(st.id); onClose(); }}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-pink-50 text-left"
          >
            <div className="w-5 h-5 rounded text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: st.color }}>
              {st.code}
            </div>
            <span className="text-gray-700">{st.name}</span>
          </button>
        ))}
        {onRemove && (
          <>
            <div className="border-t border-pink-50 my-1" />
            <button
              onClick={() => { onRemove(); onClose(); }}
              className="w-full text-left px-2 py-1.5 rounded text-sm text-red-500 hover:bg-red-50"
            >
              Quitar asignacion
            </button>
          </>
        )}
      </div>
      <div className="border-t border-pink-50 mt-1 pt-1">
        <button onClick={onClose} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 py-1">
          Cerrar
        </button>
      </div>
    </div>
  );
}
