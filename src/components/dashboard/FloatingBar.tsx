import { CalendarDays, Sparkles, Plus, X } from "lucide-react";
import type { SchedulePeriod } from "@/types/schedule";

interface Props {
  currentMonthPeriod: SchedulePeriod | null;
  browsePeriod: SchedulePeriod | null;
  setPage: (p: "home" | "calendar") => void;
  setBrowsePeriod: (p: SchedulePeriod | null) => void;
  onGenerate: () => void;
  onCreateNew: () => void;
}

export default function FloatingBar({ currentMonthPeriod, browsePeriod, setPage, setBrowsePeriod, onGenerate, onCreateNew }: Props) {
  return (
    <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] sm:w-auto">
      <div className="flex items-center justify-center gap-2 sm:gap-3 bg-surface-card/95 backdrop-blur-lg border border-[#F0EDF3] rounded-2xl shadow-lg px-3 sm:px-5 py-2.5 sm:py-3">
        {currentMonthPeriod ? (
          <>
            <button onClick={() => { setBrowsePeriod(null); setPage("calendar"); }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <CalendarDays size={15} className="text-text-secondary" />
              <span className="text-sm font-semibold text-text-primary">{currentMonthPeriod.name}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-p-mint text-green-800">Activo</span>
            </button>
            <div className="w-px h-6 bg-[#F0EDF3]" />
            <button onClick={onGenerate} className="btn-pastel-lilac text-[11px] px-3 py-1.5 rounded-xl">
              <Sparkles size={13} /> Generar
            </button>
          </>
        ) : browsePeriod ? (
          <>
            <button onClick={() => setPage("calendar")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <CalendarDays size={15} className="text-text-secondary" />
              <span className="text-sm font-semibold text-text-primary">{browsePeriod.name}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-p-yellow/60 text-amber-700">Borrador</span>
            </button>
            <div className="w-px h-6 bg-[#F0EDF3]" />
            <button onClick={onGenerate} className="btn-pastel-lilac text-[11px] px-3 py-1.5 rounded-xl">
              <Sparkles size={13} /> Generar
            </button>
            <button onClick={() => setBrowsePeriod(null)} className="p-1.5 rounded-lg hover:bg-p-pink-light transition-colors" title="Deseleccionar">
              <X size={13} className="text-text-tertiary" />
            </button>
          </>
        ) : (
          <>
            <span className="text-xs text-text-tertiary">Sin horario activo este mes</span>
            <div className="w-px h-6 bg-[#F0EDF3]" />
            <button onClick={onCreateNew} className="btn-pastel-lilac text-[11px] px-3 py-1.5 rounded-xl">
              <Plus size={13} /> Nuevo
            </button>
          </>
        )}
      </div>
    </div>
  );
}
