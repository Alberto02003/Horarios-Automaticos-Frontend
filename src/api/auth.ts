import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

interface UserProfile {
  id: number;
  email: string;
  display_name: string;
  avatar_url: string | null;
  is_active: boolean;
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<UserProfile>("/api/auth/me"),
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const token = localStorage.getItem("token");
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${apiBase}/api/auth/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Error al subir imagen");
      }
      return res.json() as Promise<UserProfile>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile"] }),
  });
}
