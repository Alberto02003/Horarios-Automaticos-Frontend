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
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: KEYS.assignments(periodId) });
      const prev = qc.getQueryData<Assignment[]>(KEYS.assignments(periodId));
      qc.setQueryData<Assignment[]>(KEYS.assignments(periodId), (old = []) => [
        ...old,
        { id: -Date.now(), schedule_period_id: periodId, member_id: data.member_id, date: data.date, shift_type_id: data.shift_type_id, start_time: null, end_time: null, assignment_source: "manual", is_locked: false },
      ]);
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEYS.assignments(periodId), ctx.prev);
    },
    onSettled: () => {
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
    onMutate: async (assignmentId) => {
      await qc.cancelQueries({ queryKey: KEYS.assignments(periodId) });
      const prev = qc.getQueryData<Assignment[]>(KEYS.assignments(periodId));
      qc.setQueryData<Assignment[]>(KEYS.assignments(periodId), (old = []) =>
        old.filter((a) => a.id !== assignmentId),
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEYS.assignments(periodId), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.assignments(periodId) });
      qc.invalidateQueries({ queryKey: KEYS.warnings(periodId) });
    },
  });
}

export function useBulkCreateAssignments(periodId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignments: AssignmentCreate[]) =>
      api.post<Assignment[]>(`/api/schedule-periods/${periodId}/assignments/bulk`, { assignments }),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.assignments(periodId) });
      qc.invalidateQueries({ queryKey: KEYS.warnings(periodId) });
    },
  });
}

export function useBulkUpdateAssignments(periodId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { ids: number[]; shift_type_id?: number; is_locked?: boolean }) =>
      api.put<Assignment[]>(`/api/schedule-periods/${periodId}/assignments/bulk`, data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: KEYS.assignments(periodId) });
      const prev = qc.getQueryData<Assignment[]>(KEYS.assignments(periodId));
      qc.setQueryData<Assignment[]>(KEYS.assignments(periodId), (old = []) =>
        old.map((a) => {
          if (!data.ids.includes(a.id)) return a;
          return {
            ...a,
            ...(data.shift_type_id !== undefined && !a.is_locked ? { shift_type_id: data.shift_type_id } : {}),
            ...(data.is_locked !== undefined ? { is_locked: data.is_locked } : {}),
          };
        }),
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEYS.assignments(periodId), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: KEYS.assignments(periodId) });
      qc.invalidateQueries({ queryKey: KEYS.warnings(periodId) });
    },
  });
}

export function useBulkDeleteAssignments(periodId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) =>
      api.delete(`/api/schedule-periods/${periodId}/assignments/bulk`, { ids }),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: KEYS.assignments(periodId) });
      const prev = qc.getQueryData<Assignment[]>(KEYS.assignments(periodId));
      qc.setQueryData<Assignment[]>(KEYS.assignments(periodId), (old = []) =>
        old.filter((a) => !ids.includes(a.id) || a.is_locked),
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEYS.assignments(periodId), ctx.prev);
    },
    onSettled: () => {
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
    onMutate: async ({ assignmentId, is_locked }) => {
      await qc.cancelQueries({ queryKey: KEYS.assignments(periodId) });
      const prev = qc.getQueryData<Assignment[]>(KEYS.assignments(periodId));
      qc.setQueryData<Assignment[]>(KEYS.assignments(periodId), (old = []) =>
        old.map((a) => a.id === assignmentId ? { ...a, is_locked } : a),
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEYS.assignments(periodId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEYS.assignments(periodId) }),
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
