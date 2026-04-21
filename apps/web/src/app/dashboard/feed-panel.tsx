'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  formatRelativeTime,
  formatTimestamp,
  getCategoryTone,
  getMagnitudeLevel,
  getPrimaryCategory,
  haversineDistanceKm
} from '@/lib/events';
import type { NaturalEvent } from '@/lib/types';

const EventMap = dynamic(
  () => import('@/app/dashboard/event-map').then((module) => module.EventMap),
  {
    ssr: false
  }
);

type FeedPanelProps = {
  events: NaturalEvent[];
  watchLatitude: number | null;
  watchLongitude: number | null;
};

export function FeedPanel({ events, watchLatitude, watchLongitude }: FeedPanelProps) {
  const [view, setView] = useState<'list' | 'map'>('list');

  return (
    <section className="feed-panel">
      <div className="feed-panel__header">
        <div>
          <p className="eyebrow">Live event feed</p>
          <h2>Current activity in your watch window</h2>
        </div>
        <div className="feed-panel__controls">
          <p className="support-copy">
            Switch between a structured list and a category-marked map view of the same events.
          </p>
          <div className="view-toggle" role="tablist" aria-label="Feed view">
            <button
              type="button"
              className={`view-toggle__button ${view === 'list' ? 'view-toggle__button--active' : ''}`}
              onClick={() => setView('list')}
              role="tab"
              aria-selected={view === 'list'}
            >
              List
            </button>
            <button
              type="button"
              className={`view-toggle__button ${view === 'map' ? 'view-toggle__button--active' : ''}`}
              onClick={() => setView('map')}
              role="tab"
              aria-selected={view === 'map'}
            >
              Map
            </button>
          </div>
        </div>
      </div>

      {events.length === 0 ? (
        <article className="dashboard-panel empty-state">
          <p className="eyebrow">No matches</p>
          <h2>Your current settings are filtering out every event.</h2>
          <p>Broaden the filters or clear the location constraint to see more activity.</p>
        </article>
      ) : view === 'map' ? (
        <EventMap
          events={events}
          watchLatitude={watchLatitude}
          watchLongitude={watchLongitude}
        />
      ) : (
        <div className="event-list">
          {events.map((event) => {
            const primaryCategory = getPrimaryCategory(event);
            const tone = getCategoryTone(primaryCategory);
            const magnitudeLevel = getMagnitudeLevel(event.magnitude_value);
            const distanceKm =
              watchLatitude !== null &&
              watchLongitude !== null &&
              event.latest_latitude !== null &&
              event.latest_longitude !== null
                ? haversineDistanceKm(
                    watchLatitude,
                    watchLongitude,
                    event.latest_latitude,
                    event.latest_longitude
                  )
                : null;

            return (
              <article key={event.id} className={`event-card event-card--${tone}`}>
                <div className="event-card__header">
                  <div className="event-card__title-block">
                    <div className="event-card__chips">
                      <span className={`event-chip event-chip--${tone}`}>{primaryCategory}</span>
                      <span className={`badge badge--${event.status}`}>{event.status}</span>
                      {distanceKm !== null ? (
                        <span className="distance-badge">{Math.round(distanceKm)} km away</span>
                      ) : null}
                    </div>
                    <h3>{event.title}</h3>
                  </div>

                  <div className="event-card__time">
                    <strong>{formatRelativeTime(event.latest_geometry_date)}</strong>
                    <span>{formatTimestamp(event.latest_geometry_date)}</span>
                  </div>
                </div>

                <p className="event-card__summary">
                  {event.description ?? 'No additional event description is available yet.'}
                </p>

                <div className="event-card__metrics">
                  <div className="event-magnitude">
                    <span className="event-magnitude__label">Magnitude</span>
                    <div className="event-magnitude__scale" aria-hidden="true">
                      {Array.from({ length: 5 }, (_, index) => (
                        <span
                          key={`${event.id}-magnitude-${index}`}
                          className={
                            index < magnitudeLevel
                              ? 'event-magnitude__dot event-magnitude__dot--active'
                              : 'event-magnitude__dot'
                          }
                        />
                      ))}
                    </div>
                    <strong>
                      {event.magnitude_value !== null
                        ? `${event.magnitude_value} ${event.magnitude_unit ?? ''}`.trim()
                        : 'Unavailable'}
                    </strong>
                  </div>

                  <div className="event-inline-meta">
                    <span>{event.category_titles.join(' · ')}</span>
                    <span>{event.geometry_count} geometry records</span>
                  </div>
                </div>

                <div className="event-card__details">
                  <dl className="event-meta">
                    <div>
                      <dt>Latest geometry</dt>
                      <dd>{event.latest_geometry_type ?? 'Unavailable'}</dd>
                    </div>
                    <div>
                      <dt>Last update</dt>
                      <dd>{formatTimestamp(event.updated_at)}</dd>
                    </div>
                    <div>
                      <dt>Closed at</dt>
                      <dd>{event.closed_at ? formatTimestamp(event.closed_at) : 'Still active'}</dd>
                    </div>
                    <div>
                      <dt>Magnitude note</dt>
                      <dd>{event.magnitude_description ?? 'No detail available'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="event-card__footer">
                  <span className="event-card__id">Event ID: {event.id}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
