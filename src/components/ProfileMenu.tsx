import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { User, LogOut, Camera } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

export default function ProfileMenu() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="w-9 h-9 rounded-full bg-p-pink flex items-center justify-center hover:bg-p-pink-medium transition-colors focus:outline-none">
          <User size={16} className="text-text-primary" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 bg-surface-card rounded-xl border border-[#F0EDF3] shadow-lg p-1 w-[240px] animate-scale-in"
        >
          <div className="px-3 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-p-lavender flex items-center justify-center text-text-primary font-bold text-sm">
              J
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">Jeny</p>
              <p className="text-[11px] text-text-tertiary truncate">jeny@horarios.app</p>
            </div>
          </div>

          <DropdownMenu.Separator className="h-px bg-[#F0EDF3] mx-1 my-1" />

          <DropdownMenu.Item className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-text-secondary outline-none cursor-pointer data-[highlighted]:bg-p-lavender-light/50 transition-colors">
            <Camera size={15} />
            Cambiar foto
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-[#F0EDF3] mx-1 my-1" />

          <DropdownMenu.Item
            onClick={logout}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-500 outline-none cursor-pointer data-[highlighted]:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            Cerrar sesion
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
