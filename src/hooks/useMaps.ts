import { useMemo } from "react";
import type { Member } from "@/types/member";
import type { ShiftType } from "@/types/shift";
import type { Assignment } from "@/types/schedule";

export interface MemberMapEntry {
  full_name: string;
  color_tag: string;
  weekly_hour_limit: number;
}

export interface ShiftMapEntry {
  code: string;
  color: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
  counts_as_work_time: boolean;
}

export function useMemberMap(members: Member[] | undefined) {
  return useMemo(() => {
    const map: Record<number, MemberMapEntry> = {};
    members?.forEach((m) => {
      map[m.id] = { full_name: m.full_name, color_tag: m.color_tag, weekly_hour_limit: m.weekly_hour_limit };
    });
    return map;
  }, [members]);
}

export function useShiftMap(shiftTypes: ShiftType[] | undefined) {
  return useMemo(() => {
    const map: Record<number, ShiftMapEntry> = {};
    shiftTypes?.forEach((s) => {
      map[s.id] = { code: s.code, color: s.color, name: s.name, start_time: s.default_start_time, end_time: s.default_end_time, counts_as_work_time: s.counts_as_work_time };
    });
    return map;
  }, [shiftTypes]);
}

export function useAssignmentMap(assignments: Assignment[] | undefined) {
  return useMemo(() => {
    const map: Record<string, Assignment> = {};
    assignments?.forEach((a) => { map[`${a.member_id}-${a.date}`] = a; });
    return map;
  }, [assignments]);
}

export function useAssignmentsByDate(assignments: Assignment[] | undefined) {
  return useMemo(() => {
    const map: Record<string, Assignment[]> = {};
    assignments?.forEach((a) => {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    });
    return map;
  }, [assignments]);
}
