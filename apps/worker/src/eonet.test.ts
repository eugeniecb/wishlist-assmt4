import { describe, expect, it } from 'vitest';
import { normalizeEvent } from './eonet.js';

describe('normalizeEvent', () => {
  it('flattens the latest point geometry into the Supabase row shape', () => {
    const polledAt = '2026-04-20T02:00:00.000Z';
    const row = normalizeEvent(
      {
        id: 'EONET_1',
        title: 'Sample wildfire',
        description: 'Synthetic event for testing.',
        link: 'https://example.com/events/EONET_1',
        closed: null,
        categories: [{ id: 'wildfires', title: 'Wildfires' }],
        sources: [{ id: 'InciWeb', url: 'https://inciweb.wildfire.gov/' }],
        geometry: [
          {
            date: '2026-04-18T00:00:00Z',
            type: 'Point',
            coordinates: [-118.25, 34.05]
          },
          {
            date: '2026-04-19T00:00:00Z',
            type: 'Point',
            coordinates: [-119.25, 35.05],
            magnitudeValue: 12.5,
            magnitudeUnit: 'acres',
            magnitudeDescription: 'Estimated burn area'
          }
        ]
      },
      polledAt
    );

    expect(row.status).toBe('open');
    expect(row.category_titles).toEqual(['Wildfires']);
    expect(row.source_ids).toEqual(['InciWeb']);
    expect(row.geometry_count).toBe(2);
    expect(row.latest_geometry_date).toBe('2026-04-19T00:00:00Z');
    expect(row.latest_latitude).toBe(35.05);
    expect(row.latest_longitude).toBe(-119.25);
    expect(row.magnitude_value).toBe(12.5);
    expect(row.last_polled_at).toBe(polledAt);
  });
});
