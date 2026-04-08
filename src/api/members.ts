import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { Member, MemberCreate, MemberUpdate } from "@/types/member";

const KEYS = {
  all: ["members"] as const,
  detail: (id: number) => ["members", id] as const,
};

export function useMembers() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: () => api.get<Member[]>("/api/members"),
  });
}

export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MemberCreate) => api.post<Member>("/api/members", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MemberUpdate }) =>
      api.put<Member>(`/api/members/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeleteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<Member>(`/api/members/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
