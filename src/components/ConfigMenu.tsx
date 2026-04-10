import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Settings, X, Users, Clock, Sliders } from "lucide-react";
import GenerationTab from "@/components/config/GenerationTab";
import MembersTab from "@/components/config/MembersTab";
import ShiftsTab from "@/components/config/ShiftsTab";

export type ConfigTab = "generation" | "members" | "shifts";

const TABS: { id: ConfigTab; label: string; icon: typeof Sliders }[] = [
  { id: "generation", label: "Generacion", icon: Sliders },
  { id: "members", label: "Equipo", icon: Users },
  { id: "shifts", label: "Turnos", icon: Clock },
];

interface ConfigMenuProps {
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  initialTab?: ConfigTab;
}

export default function ConfigMenu({ externalOpen, onExternalOpenChange, initialTab }: ConfigMenuProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => { setInternalOpen(v); onExternalOpenChange?.(v); };
  const [tab, setTab] = useState<ConfigTab>("generation");
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");
  const [animKey, setAnimKey] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalOpen && initialTab) setTab(initialTab);
  }, [externalOpen, initialTab]);

  const switchTab = (newTab: ConfigTab) => {
    const oldIdx = TABS.findIndex((t) => t.id === tab);
    const newIdx = TABS.findIndex((t) => t.id === newTab);
    setSlideDir(newIdx > oldIdx ? "right" : "left");
    setAnimKey((k) => k + 1);
    setTab(newTab);
  };

  const touchStart = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStart.current;
    const tabIdx = TABS.findIndex((t) => t.id === tab);
    if (diff < -50 && tabIdx < TABS.length - 1) switchTab(TABS[tabIdx + 1].id);
    if (diff > 50 && tabIdx > 0) switchTab(TABS[tabIdx - 1].id);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="w-9 h-9 rounded-full bg-p-lavender-light flex items-center justify-center hover:bg-p-lavender transition-colors focus:outline-none" aria-label="Configuracion">
        <Settings size={16} className="text-text-secondary" />
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-text-primary/20 backdrop-blur-sm animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 bg-surface-card rounded-2xl w-[calc(100%-2rem)] sm:w-full max-w-xl max-h-[85vh] shadow-lg border border-[#F0EDF3] animate-scale-in focus:outline-none flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-[#F0EDF3] shrink-0">
              <Dialog.Title className="text-lg font-bold text-text-primary tracking-tight">Configuracion</Dialog.Title>
              <Dialog.Close className="p-1.5 rounded-lg text-text-tertiary hover:bg-p-lavender-light transition-colors"><X size={16} /></Dialog.Close>
            </div>

            <div className="flex border-b border-[#F0EDF3] px-5 shrink-0">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => switchTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all duration-200 ${
                    tab === t.id ? "border-text-primary text-text-primary" : "border-transparent text-text-tertiary hover:text-text-secondary"
                  }`}
                >
                  <t.icon size={13} /> {t.label}
                </button>
              ))}
            </div>

            <div ref={contentRef} className="h-[calc(70vh-100px)] sm:h-[450px] overflow-auto p-4 sm:p-5" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <div key={animKey} style={{ animation: `${slideDir === "right" ? "tab-slide-in" : "tab-slide-out"} 0.2s ease-out` }}>
                {tab === "generation" && <GenerationTab />}
                {tab === "members" && <MembersTab />}
                {tab === "shifts" && <ShiftsTab />}
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
