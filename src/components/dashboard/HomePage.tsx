import { memo } from "react";
import { Calendar, FileEdit, CheckCircle2, Users, Clock } from "lucide-react";
import { StatsSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import type { SchedulePeriod } from "@/types/schedule";
import type { Member } from "@/types/member";
import type { ShiftType } from "@/types/shift";

interface Props {
  drafts: SchedulePeriod[];
  activeCurrentYear: SchedulePeriod[];
  activeMembers: Member[];
  activeShifts: ShiftType[];
  currentYear: number;
  onOpenPeriod: (p: SchedulePeriod) => void;
  onOpenTeam: () => void;
  onOpenShifts: () => void;
  loading?: boolean;
}

export default memo(function HomePage({ drafts, activeCurrentYear, activeMembers, activeShifts, currentYear, onOpenPeriod, onOpenTeam, onOpenShifts, loading }: Props) {
  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-5xl mx-auto space-y-8">
        <StatsSkeleton />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {[
          { icon: Users, label: "Miembros", value: activeMembers.length, color: "bg-p-blue-light text-blue-600", onClick: onOpenTeam },
          { icon: Clock, label: "Turnos", value: activeShifts.length, color: "bg-p-lilac/30 text-purple-600", onClick: onOpenShifts },
          { icon: FileEdit, label: "Borradores", value: drafts.length, color: "bg-p-yellow/40 text-amber-600", onClick: undefined },
          { icon: CheckCircle2, label: "Activos", value: activeCurrentYear.length, color: "bg-p-mint-light text-green-600", onClick: undefined },
        ].map((s) => (
          <button key={s.label} onClick={s.onClick} disabled={!s.onClick}
            className={`flex items-center gap-2.5 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 rounded-2xl border border-[#F0EDF3] bg-surface-card transition-all text-left ${s.onClick ? "hover:shadow-sm hover:-translate-y-0.5 cursor-pointer" : "cursor-default"}`}
          >
            <div className={`w-8 sm:w-10 h-8 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}><s.icon size={16} /></div>
            <div>
              <p className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight leading-none">{s.value}</p>
              <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wide mt-0.5">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Drafts */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <FileEdit size={16} className="text-text-tertiary" />
          <h3 className="text-sm font-bold text-text-primary">Borradores</h3>
        </div>
        {drafts.length === 0 ? (
          <div className="bg-surface-card rounded-2xl border border-[#F0EDF3] px-6 py-10 text-center">
            <p className="text-sm text-text-tertiary">No hay borradores. Crea un nuevo horario para empezar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {drafts.map((p) => (
              <div key={p.id} onClick={() => onOpenPeriod(p)} className="bg-surface-card rounded-2xl border border-[#F0EDF3] p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-p-yellow/50 text-amber-700">Borrador</span>
                  <Calendar size={14} className="text-text-tertiary" />
                </div>
                <p className="text-lg font-bold text-text-primary tracking-tight">{p.name}</p>
                <p className="text-xs text-text-tertiary mt-1">{p.start_date} — {p.end_date}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 size={16} className="text-text-tertiary" />
          <h3 className="text-sm font-bold text-text-primary">Horarios activos — {currentYear}</h3>
        </div>
        {activeCurrentYear.length === 0 ? (
          <div className="bg-surface-card rounded-2xl border border-[#F0EDF3] px-6 py-10 text-center">
            <p className="text-sm text-text-tertiary">No hay horarios activos para este año.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCurrentYear.map((p) => (
              <div key={p.id} onClick={() => onOpenPeriod(p)} className="bg-surface-card rounded-2xl border border-[#F0EDF3] p-5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-p-mint text-green-800">Activo</span>
                  <Calendar size={14} className="text-text-tertiary" />
                </div>
                <p className="text-lg font-bold text-text-primary tracking-tight">{p.name}</p>
                <p className="text-xs text-text-tertiary mt-1">{p.start_date} — {p.end_date}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
