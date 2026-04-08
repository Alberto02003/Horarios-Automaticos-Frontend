import { Users, Clock, AlertTriangle, FileCheck } from "lucide-react";
import { useMembers } from "@/api/members";
import { useShiftTypes } from "@/api/shiftTypes";
import type { ValidationWarning, SchedulePeriod } from "@/types/schedule";

interface Props {
  period: SchedulePeriod | null;
  warnings: ValidationWarning[];
  onOpenTeam: () => void;
  onOpenShifts: () => void;
}

export default function QuickStats({ period, warnings, onOpenTeam, onOpenShifts }: Props) {
  const { data: members } = useMembers();
  const { data: shiftTypes } = useShiftTypes();

  const stats = [
    {
      icon: Users,
      label: "Miembros",
      value: members?.filter((m) => m.is_active).length || 0,
      color: "bg-p-blue-light text-blue-600",
      onClick: onOpenTeam,
    },
    {
      icon: Clock,
      label: "Turnos",
      value: shiftTypes?.filter((s) => s.is_active).length || 0,
      color: "bg-p-lilac/30 text-purple-600",
      onClick: onOpenShifts,
    },
    {
      icon: AlertTriangle,
      label: "Avisos",
      value: warnings.length,
      color: warnings.length > 0 ? "bg-p-peach-light text-amber-600" : "bg-p-mint-light text-green-600",
      onClick: undefined,
    },
    {
      icon: FileCheck,
      label: "Estado",
      value: period?.status === "active" ? "Activo" : period ? "Borrador" : "—",
      color: period?.status === "active" ? "bg-p-mint-light text-green-600" : "bg-p-yellow/50 text-amber-600",
      onClick: undefined,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map((s) => (
        <button
          key={s.label}
          onClick={s.onClick}
          disabled={!s.onClick}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-[#F0EDF3] bg-surface-card transition-all duration-150 text-left ${
            s.onClick ? "hover:shadow-sm hover:-translate-y-0.5 cursor-pointer" : "cursor-default"
          }`}
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
            <s.icon size={16} />
          </div>
          <div>
            <p className="text-lg font-extrabold text-text-primary tracking-tight leading-none">{s.value}</p>
            <p className="text-[10px] font-medium text-text-tertiary uppercase tracking-wide mt-0.5">{s.label}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
