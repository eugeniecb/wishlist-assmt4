export type EventStatus = 'open' | 'closed';
export type PreferredStatus = EventStatus | 'all';

export type NaturalEvent = {
  id: string;
  title: string;
  description: string | null;
  link: string;
  status: EventStatus;
  closed_at: string | null;
  category_titles: string[];
  geometry_count: number;
  latest_geometry_date: string | null;
  latest_geometry_type: string | null;
  latest_latitude: number | null;
  latest_longitude: number | null;
  magnitude_value: number | null;
  magnitude_unit: string | null;
  magnitude_description: string | null;
  updated_at: string;
};

export type UserPreferences = {
  clerk_user_id: string;
  display_name: string | null;
  preferred_status: PreferredStatus;
  category_filters: string[];
  watch_latitude: number | null;
  watch_longitude: number | null;
  radius_km: number;
  created_at: string;
  updated_at: string;
};
