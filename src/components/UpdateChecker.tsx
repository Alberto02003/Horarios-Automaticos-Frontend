import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

// Only import Tauri APIs when running in Tauri (not in browser)
const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export default function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [version, setVersion] = useState("");
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isTauri) return;

    const checkUpdate = async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const update = await check();
        if (update) {
          setUpdateAvailable(true);
          setVersion(update.version);
        }
      } catch {
        // Silently fail — no update or no network
      }
    };

    // Check after 5 seconds to not block app startup
    const timer = setTimeout(checkUpdate, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      }
    } catch {
      setInstalling(false);
    }
  };

  if (!isTauri || !updateAvailable || dismissed) return null;

  return (
    <div className="fixed top-16 right-4 z-50 animate-slide-in">
      <div className="bg-surface-card rounded-2xl border border-[#F0EDF3] shadow-lg p-4 w-[280px]">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-p-mint-light flex items-center justify-center">
              <Download size={14} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Nueva version</p>
              <p className="text-[10px] text-text-tertiary">v{version} disponible</p>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="p-1 rounded-lg hover:bg-p-lavender-light transition-colors">
            <X size={12} className="text-text-tertiary" />
          </button>
        </div>
        <button
          onClick={handleInstall}
          disabled={installing}
          className="btn-primary w-full text-xs py-2 rounded-xl mt-2"
        >
          {installing ? "Instalando..." : "Actualizar ahora"}
        </button>
      </div>
    </div>
  );
}
