export type EonetEvent = {
  id: string;
  title: string;
  description: string | null;
  link: string;
  closed: string | null;
  categories: Array<{ id: string; title: string }>;
  sources: Array<{ id: string; url: string }>;
  geometry: Array<{
    magnitudeValue?: number | null;
    magnitudeUnit?: string | null;
    magnitudeDescription?: string | null;
    date: string;
    type: string;
    coordinates: unknown;
  }>;
};

export type EonetResponse = {
  title: string;
  description: string;
  link: string;
  events: EonetEvent[];
};

export type NaturalEventRow = {
  id: string;
  title: string;
  description: string | null;
  link: string;
  status: 'open' | 'closed';
  closed_at: string | null;
  category_ids: string[];
  category_titles: string[];
  source_ids: string[];
  source_urls: string[];
  geometry: EonetEvent['geometry'];
  geometry_count: number;
  latest_geometry_date: string | null;
  latest_geometry_type: string | null;
  latest_latitude: number | null;
  latest_longitude: number | null;
  magnitude_value: number | null;
  magnitude_unit: string | null;
  magnitude_description: string | null;
  raw_event: EonetEvent;
  last_polled_at: string;
};

function getLatestGeometry(geometry: EonetEvent['geometry']) {
  return [...geometry].sort((left, right) => {
    return Date.parse(right.date) - Date.parse(left.date);
  })[0] ?? null;
}

function extractPointCoordinates(coordinates: unknown) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return { latitude: null, longitude: null };
  }

  const [longitude, latitude] = coordinates;

  return {
    latitude: typeof latitude === 'number' ? latitude : null,
    longitude: typeof longitude === 'number' ? longitude : null
  };
}

export function normalizeEvent(event: EonetEvent, polledAt: string): NaturalEventRow {
  const latestGeometry = getLatestGeometry(event.geometry);
  const latestPoint =
    latestGeometry?.type === 'Point'
      ? extractPointCoordinates(latestGeometry.coordinates)
      : { latitude: null, longitude: null };

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    link: event.link,
    status: event.closed ? 'closed' : 'open',
    closed_at: event.closed,
    category_ids: event.categories.map((category) => category.id),
    category_titles: event.categories.map((category) => category.title),
    source_ids: event.sources.map((source) => source.id),
    source_urls: event.sources.map((source) => source.url),
    geometry: event.geometry,
    geometry_count: event.geometry.length,
    latest_geometry_date: latestGeometry?.date ?? null,
    latest_geometry_type: latestGeometry?.type ?? null,
    latest_latitude: latestPoint.latitude,
    latest_longitude: latestPoint.longitude,
    magnitude_value: latestGeometry?.magnitudeValue ?? null,
    magnitude_unit: latestGeometry?.magnitudeUnit ?? null,
    magnitude_description: latestGeometry?.magnitudeDescription ?? null,
    raw_event: event,
    last_polled_at: polledAt
  };
}

export function normalizeEvents(events: EonetEvent[], polledAt: string): NaturalEventRow[] {
  return events.map((event) => normalizeEvent(event, polledAt));
}

export async function fetchEonetEvents(baseUrl: string, params: URLSearchParams): Promise<EonetResponse> {
  const response = await fetch(`${baseUrl}?${params.toString()}`, {
    headers: {
      accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`EONET request failed with ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as EonetResponse;
}
