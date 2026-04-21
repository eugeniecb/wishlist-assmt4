import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { updatePreferences } from '@/app/actions';
import { PreferencesForm } from '@/app/dashboard/preferences-form';
import { DashboardRealtime } from '@/app/dashboard/realtime-events';
import {
  dedupeEvents,
  eventMatchesPreferences,
  formatRelativeTime,
  formatTimestamp,
  getCategoryTone,
  getMagnitudeLevel,
  getPrimaryCategory,
  haversineDistanceKm
} from '@/lib/events';
import { createAdminClient } from '@/lib/supabase/admin';
import type { NaturalEvent, UserPreferences } from '@/lib/types';

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildFallbackPreferences(userId: string, displayName?: string | null): UserPreferences {
  return {
    clerk_user_id: userId,
    display_name: displayName ?? null,
    preferred_status: 'open',
    category_filters: [],
    watch_latitude: null,
    watch_longitude: null,
    radius_km: 500,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString()
  };
}

function getLatestRefreshTimestamp(events: NaturalEvent[]) {
  return events.reduce<string | null>((latest, event) => {
    const candidate = event.latest_geometry_date ?? event.updated_at;

    if (!candidate) {
      return latest;
    }

    if (!latest || new Date(candidate).getTime() > new Date(latest).getTime()) {
      return candidate;
    }

    return latest;
  }, null);
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { userId } = await auth();
  const clerkUser = await currentUser();
  const supabase = createAdminClient();
  const params = await searchParams;
  const message = getSingleValue(params.message);
  const errorMessage = getSingleValue(params.error);

  if (!userId) {
    redirect('/sign-in');
  }

  const preferencesResult = await supabase
    .from('user_preferences')
    .select('*')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  if (preferencesResult.error) {
    throw preferencesResult.error;
  }

  const preferences =
    (preferencesResult.data as UserPreferences | null) ??
    buildFallbackPreferences(
      userId,
      clerkUser?.fullName ?? clerkUser?.primaryEmailAddress?.emailAddress ?? null
    );

  let eventsQuery = supabase
    .from('natural_events')
    .select(
      'id, title, description, link, status, closed_at, category_titles, geometry_count, latest_geometry_date, latest_geometry_type, latest_latitude, latest_longitude, magnitude_value, magnitude_unit, magnitude_description, updated_at'
    )
    .order('latest_geometry_date', { ascending: false })
    .limit(100);

  if (preferences.preferred_status !== 'all') {
    eventsQuery = eventsQuery.eq('status', preferences.preferred_status);
  }

  if (preferences.category_filters.length > 0) {
    eventsQuery = eventsQuery.overlaps('category_titles', preferences.category_filters);
  }

  const eventsResult = await eventsQuery;
  const categoriesResult = await supabase.from('natural_events').select('category_titles').limit(200);

  if (eventsResult.error) {
    throw eventsResult.error;
  }

  if (categoriesResult.error) {
    throw categoriesResult.error;
  }

  const allEvents = dedupeEvents((eventsResult.data ?? []) as NaturalEvent[]);
  const filteredEvents = allEvents.filter((event) => eventMatchesPreferences(event, preferences));
  const latestRefresh = getLatestRefreshTimestamp(filteredEvents);
  const availableCategories = [
    ...new Set(
      ((categoriesResult.data ?? []) as Array<{ category_titles: string[] | null }>)
        .flatMap((event) => event.category_titles ?? [])
    )
  ].sort();

  const statsByTone = filteredEvents.reduce<Record<string, number>>((accumulator, event) => {
    const tone = getCategoryTone(getPrimaryCategory(event));
    accumulator[tone] = (accumulator[tone] ?? 0) + 1;
    return accumulator;
  }, {});

  return (
    <main className="shell dashboard-shell">
      <DashboardRealtime eventCount={filteredEvents.length} lastRefreshed={latestRefresh} />

      <section className="stats-bar">
        <article className="stats-bar__card stats-bar__card--total">
          <span className="stats-bar__label">Active feed</span>
          <strong>{filteredEvents.length}</strong>
          <p className="metric-note">Events currently matching your watch profile</p>
        </article>

        <article className="stats-bar__card">
          <span className="stats-bar__label">Wildfires</span>
          <strong>{statsByTone.fire ?? 0}</strong>
          <p className="metric-note">Amber-highlighted events</p>
        </article>

        <article className="stats-bar__card">
          <span className="stats-bar__label">Severe storms</span>
          <strong>{statsByTone.storm ?? 0}</strong>
          <p className="metric-note">Blue-highlighted events</p>
        </article>

        <article className="stats-bar__card">
          <span className="stats-bar__label">Volcanoes</span>
          <strong>{statsByTone.volcano ?? 0}</strong>
          <p className="metric-note">Crimson-highlighted events</p>
        </article>

        <article className="stats-bar__card stats-bar__card--refresh">
          <span className="stats-bar__label">Last refreshed</span>
          <strong>{formatRelativeTime(latestRefresh)}</strong>
          <p className="metric-note">{formatTimestamp(latestRefresh)}</p>
        </article>
      </section>

      {(message || errorMessage) && (
        <aside className={`flash ${errorMessage ? 'flash--error' : 'flash--ok'}`}>
          {errorMessage ?? message}
        </aside>
      )}

      <section className="dashboard-grid">
        <PreferencesForm
          action={updatePreferences}
          availableCategories={availableCategories}
          preferences={preferences}
        />

        <section className="feed-panel">
          <div className="feed-panel__header">
            <div>
              <p className="eyebrow">Live event feed</p>
              <h2>Current activity in your watch window</h2>
            </div>
            <p className="support-copy">
              Hover over a card to reveal geometry details, or open the source record for the full
              incident page.
            </p>
          </div>

          <div className="event-list">
            {filteredEvents.length === 0 ? (
              <article className="dashboard-panel empty-state">
                <p className="eyebrow">No matches</p>
                <h2>Your current settings are filtering out every event.</h2>
                <p>Broaden the filters or clear the location constraint to see more activity.</p>
              </article>
            ) : (
              filteredEvents.map((event) => {
                const primaryCategory = getPrimaryCategory(event);
                const tone = getCategoryTone(primaryCategory);
                const magnitudeLevel = getMagnitudeLevel(event.magnitude_value);
                const distanceKm =
                  preferences.watch_latitude !== null &&
                  preferences.watch_longitude !== null &&
                  event.latest_latitude !== null &&
                  event.latest_longitude !== null
                    ? haversineDistanceKm(
                        preferences.watch_latitude,
                        preferences.watch_longitude,
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
              })
            )}
          </div>
        </section>
      </section>
    </main>
  );
}
