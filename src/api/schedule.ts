import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type { SchedulePeriod, PeriodCreate, Assignment, AssignmentCreate, ValidationWarning } from "@/types/schedule";
import type { PaginatedResponse } from "@/types/pagination";

const KEYS = {
  periods: ["periods"] as const,
  assignments: (periodId: number) => ["assignments", periodId] as const,
  warnings: (periodId: number) => ["warnings", periodId] as const,
};

export function usePeriods() {
  return useQuery({
    queryKey: KEYS.periods,
    queryFn: () => api.get<PaginatedResponse<SchedulePeriod>>("/api/schedule-periods?page_size=200"),
    select: (data) => data.items,
  });
}

export function useCreatePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PeriodCreate) => api.post<SchedulePeriod>("/api/schedule-periods", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.periods }),
  });
}

export function useDeletePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/api/schedule-periods/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.periods }),
  });
}

export function useActivatePeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.patch<SchedulePeriod>(`/api/schedule-periods/${id}/activate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.periods }),
  });
}

export function useAssignments(periodId: number | null) {
  return useQuery({
    queryKey: KEYS.assignments(periodId!),
    queryFn: () => api.get<Assignment[]>(`/api/schedule-periods/${periodId}/assignments`),
    enabled: !!periodId,
  });
}

export function useCreateAssignment(periodId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AssignmentCreate) =>
      api.post<Assignment>(`/api/schedule-periods/${periodId}/assignments`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.assignments(periodId) });
      qc.invalidateQueries({ queryKey: KEYS.warnings(periodId) });
    },
  });
}

export function useDeleteAssignment(periodId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: number) =>
      api.delete(`/api/schedule-periods/${periodId}/assignments/${assignmentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.assignments(periodId) });
      qc.invalidateQueries({ queryKey: KEYS.warnings(periodId) });
    },
  });
}

export function useToggleLock(periodId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, is_locked }: { assignmentId: number; is_locked: boolean }) =>
      api.put<Assignment>(`/api/schedule-periods/${periodId}/assignments/${assignmentId}`, { is_locked }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.assignments(periodId) }),
  });
}

export function useValidation(periodId: number | null) {
  return useQuery({
    queryKey: KEYS.warnings(periodId!),
    queryFn: () => api.get<{ warnings: ValidationWarning[] }>(`/api/schedule-periods/${periodId}/validate`),
    enabled: !!periodId,
    select: (data) => data.warnings,
  });
}
