import { create } from "zustand";
import { API_BASE } from "@/api/client";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),

  login: (accessToken: string) => {
    localStorage.setItem("token", accessToken);
    set({ token: accessToken, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, isAuthenticated: false });
    // Clear refresh + csrf cookies on server
    const csrfMatch = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
    const csrf = csrfMatch ? decodeURIComponent(csrfMatch[1]) : "";
    fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: csrf ? { "X-CSRF-Token": csrf } : {},
    }).catch(() => {});
  },
}));
