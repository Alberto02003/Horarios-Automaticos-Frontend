export interface GlobalPreferences {
  id: number;
  general_weekly_hour_limit: number;
  preferences_jsonb: {
    min_rest_hours?: number;
    max_consecutive_days?: number;
    allow_weekend_work?: boolean;
    prefer_balanced_distribution?: boolean;
    fill_unassigned_only?: boolean;
  };
}

export interface GlobalPreferencesUpdate {
  general_weekly_hour_limit?: number;
  preferences_jsonb?: Record<string, unknown>;
}
