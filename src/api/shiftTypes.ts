import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { ShiftType, ShiftTypeCreate, ShiftTypeUpdate } from "@/types/shift";
import type { PaginatedResponse } from "@/types/pagination";

const KEYS = { all: ["shift-types"] as const };

export function useShiftTypes() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => api.get<PaginatedResponse<ShiftType>>("/api/shift-types?page_size=200"),
    select: (data) => data.items,
  });
}

export function useCreateShiftType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ShiftTypeCreate) => api.post<ShiftType>("/api/shift-types", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateShiftType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ShiftTypeUpdate }) =>
      api.put<ShiftType>(`/api/shift-types/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeleteShiftType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<ShiftType>(`/api/shift-types/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
