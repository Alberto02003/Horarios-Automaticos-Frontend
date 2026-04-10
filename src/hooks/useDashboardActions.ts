import { useCallback } from "react";
import { API_BASE } from "@/api/client";
import { useCreatePeriod, useActivatePeriod, useDeletePeriod } from "@/api/schedule";
import { useToast } from "@/components/ui/ToastProvider";
import { MONTHS_SHORT } from "@/constants";
import type { SchedulePeriod } from "@/types/schedule";

interface ActionCallbacks {
  onPeriodCreated: (p: SchedulePeriod) => void;
  onPeriodActivated: () => void;
  onPeriodDeleted: () => void;
}

export function useDashboardActions(
  periods: SchedulePeriod[] | undefined,
  calendarPeriod: SchedulePeriod | null,
  callbacks: ActionCallbacks,
) {
  const { toast } = useToast();
  const createPeriod = useCreatePeriod();
  const activatePeriod = useActivatePeriod();
  const deletePeriod = useDeletePeriod();

  const now = new Date();
  const currentYear = now.getFullYear();

  const handleCreatePeriod = useCallback((month: number) => {
    const existing = periods?.find((p) => p.year === currentYear && p.month === month && p.status === "active");
    if (existing) {
      toast(`Ya existe un periodo activo para ${MONTHS_SHORT[month - 1]} ${currentYear}.`, "error");
      return;
    }
    const days = new Date(currentYear, month, 0).getDate();
    const start = `${currentYear}-${String(month).padStart(2, "0")}-01`;
    const end = `${currentYear}-${String(month).padStart(2, "0")}-${String(days).padStart(2, "0")}`;
    createPeriod.mutate(
      { name: `${MONTHS_SHORT[month - 1]} ${currentYear}`, year: currentYear, month, start_date: start, end_date: end },
      {
        onSuccess: (p) => callbacks.onPeriodCreated(p),
        onError: (err) => toast(err instanceof Error ? err.message : "Error", "error"),
      },
    );
  }, [periods, currentYear, createPeriod, callbacks, toast]);

  const handleActivate = useCallback(() => {
    if (!calendarPeriod) return;
    activatePeriod.mutate(calendarPeriod.id, {
      onSuccess: () => { callbacks.onPeriodActivated(); toast("Periodo activado"); },
      onError: (err) => toast(err instanceof Error ? err.message : "Error", "error"),
    });
  }, [calendarPeriod, activatePeriod, callbacks, toast]);

  const handleDelete = useCallback(() => {
    if (!calendarPeriod) return;
    deletePeriod.mutate(calendarPeriod.id, {
      onSuccess: () => { callbacks.onPeriodDeleted(); toast("Periodo eliminado"); },
    });
  }, [calendarPeriod, deletePeriod, callbacks, toast]);

  const handleExportExcel = useCallback(async (period: SchedulePeriod) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE}/api/schedule-periods/${period.id}/export/excel`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Error");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `horarios_${period.name.replace(/ /g, "_")}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Excel exportado");
    } catch {
      toast("Error al exportar", "error");
    }
  }, [toast]);

  return {
    handleCreatePeriod,
    handleActivate,
    handleDelete,
    handleExportExcel,
    isCreating: createPeriod.isPending,
  };
}
