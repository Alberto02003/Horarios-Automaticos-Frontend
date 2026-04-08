export interface Member {
  id: number;
  full_name: string;
  role_name: string;
  weekly_hour_limit: number;
  is_active: boolean;
  color_tag: string;
  metadata_jsonb: Record<string, unknown> | null;
}

export interface MemberCreate {
  full_name: string;
  role_name: string;
  weekly_hour_limit: number;
  color_tag: string;
}

export interface MemberUpdate {
  full_name?: string;
  role_name?: string;
  weekly_hour_limit?: number;
  is_active?: boolean;
  color_tag?: string;
}
