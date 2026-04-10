import { Calendar, CalendarDays, Home } from "lucide-react";
import ConfigMenu from "@/components/ConfigMenu";
import ProfileMenu from "@/components/ProfileMenu";

type Page = "home" | "calendar";

interface Props {
  page: Page;
  setPage: (p: Page) => void;
  showConfig: boolean;
  setShowConfig: (v: boolean) => void;
}

export default function TopBar({ page, setPage, showConfig, setShowConfig }: Props) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-surface/80 border-b border-[#F0EDF3]/60">
      <div className="relative flex items-center justify-between px-3 sm:px-6 h-12 sm:h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-xl bg-p-pink flex items-center justify-center">
            <Calendar size={14} className="text-text-primary" />
          </div>
          <span className="text-sm sm:text-[15px] font-bold text-text-primary tracking-tight hidden sm:inline">Horarios</span>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 sm:gap-1 bg-[#F0EDF3]/50 rounded-xl p-0.5 sm:p-1">
          <button onClick={() => setPage("home")} aria-label="Inicio"
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${page === "home" ? "bg-surface-card shadow-xs text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}
          >
            <Home size={13} /> <span className="hidden sm:inline">Inicio</span>
          </button>
          <button onClick={() => setPage("calendar")} aria-label="Calendario"
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${page === "calendar" ? "bg-surface-card shadow-xs text-text-primary" : "text-text-tertiary hover:text-text-secondary"}`}
          >
            <CalendarDays size={13} /> <span className="hidden sm:inline">Calendario</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <ConfigMenu externalOpen={showConfig} onExternalOpenChange={setShowConfig} initialTab="shifts" />
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
