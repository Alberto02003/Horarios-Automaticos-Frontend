import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

interface GenerationRequest {
  strategy: string;
  fill_unassigned_only: boolean;
}

interface GenerationResponse {
  strategy: string;
  proposals_count: number;
  created_count: number;
}

export interface GenerationRun {
  id: number;
  strategy: string;
  result_summary_jsonb: { proposals_count?: number; created_count?: number } | null;
  created_at: string | null;
}

export function useGenerate(periodId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerationRequest) =>
      api.post<GenerationResponse>(`/api/schedule-periods/${periodId}/generate`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments", periodId] });
      qc.invalidateQueries({ queryKey: ["warnings", periodId] });
      qc.invalidateQueries({ queryKey: ["generation-runs", periodId] });
    },
  });
}

export function useGenerationRuns(periodId: number | null) {
  return useQuery({
    queryKey: ["generation-runs", periodId],
    queryFn: () => api.get<GenerationRun[]>(`/api/schedule-periods/${periodId}/generation-runs`),
    enabled: !!periodId,
  });
}
