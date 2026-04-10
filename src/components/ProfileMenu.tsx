import { useRef } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { User, LogOut, Camera } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useProfile, useUploadAvatar } from "@/api/auth";
import { API_BASE } from "@/api/client";
import { useToast } from "@/components/ui/ToastProvider";

export default function ProfileMenu() {
  const logout = useAuthStore((s) => s.logout);
  const { data: profile } = useProfile();
  const uploadAvatar = useUploadAvatar();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarSrc = profile?.avatar_url
    ? profile.avatar_url.startsWith("http") ? profile.avatar_url : `${API_BASE}${profile.avatar_url}`
    : null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatar.mutate(file, {
      onSuccess: () => toast("Foto actualizada"),
      onError: (err) => toast(err instanceof Error ? err.message : "Error al subir", "error"),
    });
    e.target.value = "";
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button aria-label="Menu de perfil" className="w-9 h-9 rounded-full overflow-hidden bg-p-pink flex items-center justify-center hover:ring-2 hover:ring-p-pink-medium transition-all focus:outline-none">
            {avatarSrc ? (
              <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-text-primary" />
            )}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 bg-surface-card rounded-xl border border-[#F0EDF3] shadow-lg p-1 w-[220px] sm:w-[260px] animate-scale-in"
          >
            {/* Profile info */}
            <div className="px-3 py-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-p-lavender flex items-center justify-center shrink-0">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-text-primary font-bold text-lg">
                    {profile?.display_name?.charAt(0) || "?"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{profile?.display_name || "..."}</p>
                <p className="text-[11px] text-text-tertiary truncate">{profile?.email || "..."}</p>
              </div>
            </div>

            <DropdownMenu.Separator className="h-px bg-[#F0EDF3] mx-1 my-1" />

            <DropdownMenu.Item
              onSelect={() => fileInputRef.current?.click()}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-text-secondary outline-none cursor-pointer data-[highlighted]:bg-p-lavender-light/50 transition-colors"
            >
              <Camera size={15} />
              {uploadAvatar.isPending ? "Subiendo..." : "Cambiar foto"}
            </DropdownMenu.Item>

            <DropdownMenu.Separator className="h-px bg-[#F0EDF3] mx-1 my-1" />

            <DropdownMenu.Item
              onSelect={logout}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-500 outline-none cursor-pointer data-[highlighted]:bg-red-50 transition-colors"
            >
              <LogOut size={15} />
              Cerrar sesion
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </>
  );
}
