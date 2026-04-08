import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { GlobalPreferences, GlobalPreferencesUpdate } from "@/types/preferences";

const KEYS = { global: ["preferences"] as const };

export function useGlobalPreferences() {
  return useQuery({
    queryKey: KEYS.global,
    queryFn: () => api.get<GlobalPreferences>("/api/preferences"),
  });
}

export function useUpdateGlobalPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GlobalPreferencesUpdate) => api.put<GlobalPreferences>("/api/preferences", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.global }),
  });
}
