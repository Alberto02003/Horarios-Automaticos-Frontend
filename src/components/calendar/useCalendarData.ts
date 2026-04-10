import { useMemo, useCallback } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useMembers } from "@/api/members";
import { useShiftTypes } from "@/api/shiftTypes";
import { useAssignments } from "@/api/schedule";
import { useMemberMap, useShiftMap, useAssignmentsByDate } from "@/hooks/useMaps";
import { useDrag, type DragPayload } from "@/components/drag/DragContext";
import { MONTHS_FULL, MONTHS_SHORT, DAYS_SHORT } from "@/constants";
import type { Assignment } from "@/types/schedule";

export interface CalendarDataProps {
  periodId: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  onDayClick: (date: string) => void;
  selectedDay: string | null;
  onOpenConfig?: () => void;
}

export function useCalendarData(props: CalendarDataProps) {
  const { periodId, startDate, endDate, isActive } = props;
  const { data: members } = useMembers();
  const { data: shiftTypes } = useShiftTypes();
  const { data: assignments } = useAssignments(periodId);
  const dragCtx = useDrag();
  const isMobile = useIsMobile();

  const periodStart = new Date(startDate + "T00:00:00");
  const periodEnd = new Date(endDate + "T00:00:00");
  const today = new Date().toISOString().slice(0, 10);

  // Responsive layout values
  const ROW_HEIGHT = isMobile ? 2.5 : 3.5;
  const GRID_START = 6;
  const CAL_HEIGHT = isMobile ? "calc(100vh - 220px)" : "650px";
  const TIME_COL = isMobile ? "40px" : "50px";

  // Maps (from reusable hooks)
  const memberMap = useMemberMap(members);
  const shiftMap = useShiftMap(shiftTypes);
  const assignmentsByDate = useAssignmentsByDate(assignments);

  // Mini calendar days
  const miniCalDays = useMemo(() => {
    const year = periodStart.getFullYear();
    const month = periodStart.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDow = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { day: number; date: string; inMonth: boolean }[] = [];
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ day: d.getDate(), date: d.toISOString().slice(0, 10), inMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({ day: i, date: d.toISOString().slice(0, 10), inMonth: true });
    }
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({ day: i, date: d.toISOString().slice(0, 10), inMonth: false });
      }
    }
    return days;
  }, [startDate]);

  // Drag handlers
  const handleDragOver = useCallback((e: React.DragEvent, date: string) => {
    if (isActive) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    dragCtx?.setHighlightedDate(date);
  }, [isActive, dragCtx]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    dragCtx?.setHighlightedDate(null);
  }, [dragCtx]);

  const handleDrop = useCallback((e: React.DragEvent, date: string) => {
    e.preventDefault();
    dragCtx?.setHighlightedDate(null);
    try {
      const data = e.dataTransfer.getData("application/json");
      const payload: DragPayload = JSON.parse(data);
      if (payload.type === "move-assignment" && payload.sourceDate === date) return;
      dragCtx?.setDropResult({ date, payload, x: e.clientX, y: e.clientY });
    } catch { /* ignore */ }
  }, [dragCtx]);

  return {
    members, shiftTypes, assignments,
    dragCtx, isMobile,
    periodStart, periodEnd, today,
    ROW_HEIGHT, GRID_START, CAL_HEIGHT, TIME_COL,
    memberMap, shiftMap, assignmentsByDate,
    miniCalDays,
    handleDragOver, handleDragLeave, handleDrop,
    MONTHS_FULL, MONTHS_SHORT, DAYS_SHORT,
    ...props,
  };
}

export type CalendarData = ReturnType<typeof useCalendarData>;

export function timeToMinutes(timeStr: string | null, fallback: number): number {
  if (!timeStr) return fallback;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}
