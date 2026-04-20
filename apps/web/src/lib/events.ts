import type { NaturalEvent, UserPreferences } from '@/lib/types';

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineDistanceKm(
  fromLatitude: number,
  fromLongitude: number,
  toLatitude: number,
  toLongitude: number
) {
  const earthRadiusKm = 6371;
  const deltaLatitude = toRadians(toLatitude - fromLatitude);
  const deltaLongitude = toRadians(toLongitude - fromLongitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(fromLatitude)) *
      Math.cos(toRadians(toLatitude)) *
      Math.sin(deltaLongitude / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function eventMatchesPreferences(event: NaturalEvent, preferences: UserPreferences) {
  if (preferences.preferred_status !== 'all' && event.status !== preferences.preferred_status) {
    return false;
  }

  if (
    preferences.category_filters.length > 0 &&
    !preferences.category_filters.some((category) => event.category_titles.includes(category))
  ) {
    return false;
  }

  if (
    preferences.radius_km > 0 &&
    preferences.watch_latitude !== null &&
    preferences.watch_longitude !== null
  ) {
    if (event.latest_latitude === null || event.latest_longitude === null) {
      return false;
    }

    const distanceKm = haversineDistanceKm(
      preferences.watch_latitude,
      preferences.watch_longitude,
      event.latest_latitude,
      event.latest_longitude
    );

    return distanceKm <= preferences.radius_km;
  }

  return true;
}

export function formatTimestamp(value: string | null) {
  if (!value) {
    return 'No geometry timestamp';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}
