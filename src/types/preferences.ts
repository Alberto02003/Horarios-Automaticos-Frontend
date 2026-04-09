export interface ShiftCoverage {
  min: number;
  max: number;
}

export interface GlobalPreferences {
  id: number;
  general_weekly_hour_limit: number;
  preferences_jsonb: {
    min_rest_hours?: number;
    max_consecutive_days?: number;
    allow_weekend_work?: boolean;
    prefer_balanced_distribution?: boolean;
    fill_unassigned_only?: boolean;
    shift_coverage?: Record<string, ShiftCoverage>; // key = shift_type_id
  };
}

export interface GlobalPreferencesUpdate {
  general_weekly_hour_limit?: number;
  preferences_jsonb?: Record<string, unknown>;
}
