export interface ShiftType {
  id: number;
  code: string;
  name: string;
  category: "work" | "vacation" | "special";
  default_start_time: string | null;
  default_end_time: string | null;
  counts_as_work_time: boolean;
  color: string;
  is_active: boolean;
}

export interface ShiftTypeCreate {
  code: string;
  name: string;
  category: string;
  default_start_time: string | null;
  default_end_time: string | null;
  counts_as_work_time: boolean;
  color: string;
}

export interface ShiftTypeUpdate {
  code?: string;
  name?: string;
  category?: string;
  default_start_time?: string | null;
  default_end_time?: string | null;
  counts_as_work_time?: boolean;
  color?: string;
  is_active?: boolean;
}
