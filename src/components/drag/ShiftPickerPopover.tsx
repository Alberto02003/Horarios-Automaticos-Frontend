import { useShiftTypes } from "@/api/shiftTypes";
import { useCreateAssignment, useDeleteAssignment } from "@/api/schedule";
import { useDrag } from "./DragContext";

interface Props {
  periodId: number;
}

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default function ShiftPickerPopover({ periodId }: Props) {
  const dragCtx = useDrag();
  const { data: shiftTypes } = useShiftTypes();
  const createAssignment = useCreateAssignment(periodId);
  const deleteAssignment = useDeleteAssignment(periodId);

  if (!dragCtx?.dropResult) return null;

  const { date, payload, x, y } = dragCtx.dropResult;
  const d = new Date(date + "T00:00:00");
  const dateLabel = `${d.getDate()} ${MONTHS[d.getMonth()]}`;

  const handleSelectShift = (shiftTypeId: number) => {
    if (payload.type === "move-assignment" && payload.assignmentId) {
      // Move: delete old, create new
      deleteAssignment.mutate(payload.assignmentId, {
        onSuccess: () => {
          createAssignment.mutate({ member_id: payload.memberId, date, shift_type_id: shiftTypeId });
        },
      });
    } else {
      // New assignment
      createAssignment.mutate({ member_id: payload.memberId, date, shift_type_id: shiftTypeId });
    }
    dragCtx.setDropResult(null);
  };

  const handleClose = () => {
    dragCtx.setDropResult(null);
  };

  // Keep popover on screen
  const popX = Math.min(x, window.innerWidth - 220);
  const popY = Math.min(y, window.innerHeight - 300);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50" onClick={handleClose} />

      {/* Popover */}
      <div className="fixed z-50 animate-scale-in" style={{ left: popX, top: popY }}>
        <div className="bg-surface-card rounded-xl border border-[#F0EDF3] shadow-lg p-2.5 min-w-[200px]">
          <div className="px-2 py-1.5 mb-1">
            <p className="text-xs font-semibold text-text-primary">{payload.memberName}</p>
            <p className="text-[10px] text-text-tertiary">{dateLabel} — Selecciona turno</p>
          </div>

          <div className="space-y-0.5">
            {shiftTypes?.filter((st) => st.is_active).map((st) => (
              <button
                key={st.id}
                onClick={() => handleSelectShift(st.id)}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm hover:bg-p-lavender-light/50 text-left transition-colors"
              >
                <div className="w-6 h-6 rounded-lg text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: st.color }}>
                  {st.code}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-text-primary">{st.name}</span>
                  {st.default_start_time && (
                    <span className="text-[10px] text-text-tertiary ml-1">{st.default_start_time}-{st.default_end_time}</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-[#F0EDF3] mt-1.5 pt-1.5">
            <button onClick={handleClose} className="w-full text-center text-[10px] text-text-tertiary hover:text-text-primary py-1 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
