export interface SchedulePeriod {
  id: number;
  name: string;
  year: number;
  month: number;
  start_date: string;
  end_date: string;
  status: "draft" | "active";
  activated_at: string | null;
  created_at: string;
}

export interface PeriodCreate {
  name: string;
  year: number;
  month: number;
  start_date: string;
  end_date: string;
}

export interface Assignment {
  id: number;
  schedule_period_id: number;
  member_id: number;
  date: string;
  shift_type_id: number;
  start_time: string | null;
  end_time: string | null;
  assignment_source: string;
  is_locked: boolean;
}

export interface AssignmentCreate {
  member_id: number;
  date: string;
  shift_type_id: number;
  assignment_source?: string;
}

export interface ValidationWarning {
  type: string;
  member_id: number;
  message: string;
}
