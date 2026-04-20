import { redirect } from 'next/navigation';
import { signout, updatePreferences } from '@/app/actions';
import { DashboardRealtime } from '@/app/dashboard/realtime-events';
import { eventMatchesPreferences, formatTimestamp, haversineDistanceKm } from '@/lib/events';
import { createClient } from '@/lib/supabase/server';
import type { NaturalEvent, UserPreferences } from '@/lib/types';

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildFallbackPreferences(userId: string, email?: string | null): UserPreferences {
  return {
    user_id: userId,
    display_name: email ?? null,
    preferred_status: 'open',
    category_filters: [],
    watch_latitude: null,
    watch_longitude: null,
    radius_km: 0,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString()
  };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient();
  const params = await searchParams;
  const message = getSingleValue(params.message);
  const errorMessage = getSingleValue(params.error);
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const preferencesResult = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (preferencesResult.error) {
    throw preferencesResult.error;
  }

  const preferences =
    (preferencesResult.data as UserPreferences | null) ?? buildFallbackPreferences(user.id, user.email);

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

  if (eventsResult.error) {
    throw eventsResult.error;
  }

  const filteredEvents = ((eventsResult.data ?? []) as NaturalEvent[]).filter((event) =>
    eventMatchesPreferences(event, preferences)
  );

  const displayName =
    preferences.display_name || user.user_metadata.display_name || user.email || 'Signal Atlas user';

  return (
    <main className="shell">
      <DashboardRealtime />

      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Live personal dashboard</p>
          <h1>{displayName}</h1>
          <p className="lede">
            Your event feed is generated from Supabase with row-level preferences and refreshed when
            `natural_events` changes in Realtime.
          </p>
        </div>
        <form action={signout}>
          <button type="submit" className="button button--ghost">
            Sign out
          </button>
        </form>
      </section>

      {(message || errorMessage) && (
        <aside className={`flash ${errorMessage ? 'flash--error' : 'flash--ok'}`}>
          {errorMessage ?? message}
        </aside>
      )}

      <section className="dashboard-grid">
        <article className="card card--tall">
          <div className="card-header">
            <p className="eyebrow">Preferences</p>
            <h2>Control your signal window</h2>
          </div>
          <form action={updatePreferences} className="stack">
            <label className="field">
              <span>Display name</span>
              <input name="display_name" type="text" defaultValue={preferences.display_name ?? ''} />
            </label>

            <label className="field">
              <span>Status focus</span>
              <select name="preferred_status" defaultValue={preferences.preferred_status}>
                <option value="open">Open events</option>
                <option value="closed">Closed events</option>
                <option value="all">All events</option>
              </select>
            </label>

            <label className="field">
              <span>Category filters</span>
              <input
                name="category_filters"
                type="text"
                defaultValue={preferences.category_filters.join(', ')}
                placeholder="Wildfires, Severe Storms"
              />
              <small>Comma-separated category titles from EONET.</small>
            </label>

            <div className="field-row">
              <label className="field">
                <span>Watch latitude</span>
                <input
                  name="watch_latitude"
                  type="number"
                  step="0.0001"
                  defaultValue={preferences.watch_latitude ?? ''}
                  placeholder="41.8781"
                />
              </label>
              <label className="field">
                <span>Watch longitude</span>
                <input
                  name="watch_longitude"
                  type="number"
                  step="0.0001"
                  defaultValue={preferences.watch_longitude ?? ''}
                  placeholder="-87.6298"
                />
              </label>
            </div>

            <label className="field">
              <span>Radius (km)</span>
              <input
                name="radius_km"
                type="number"
                min="0"
                step="1"
                defaultValue={preferences.radius_km}
              />
              <small>Set to 0 to disable distance filtering.</small>
            </label>

            <button type="submit" className="button button--primary">
              Save preferences
            </button>
          </form>
        </article>

        <section className="stack stack--wide">
          <article className="stats">
            <div className="stat">
              <span>Visible events</span>
              <strong>{filteredEvents.length}</strong>
            </div>
            <div className="stat">
              <span>Status rule</span>
              <strong>{preferences.preferred_status}</strong>
            </div>
            <div className="stat">
              <span>Category filters</span>
              <strong>
                {preferences.category_filters.length > 0
                  ? preferences.category_filters.length
                  : 'none'}
              </strong>
            </div>
          </article>

          <div className="event-list">
            {filteredEvents.length === 0 ? (
              <article className="card empty-state">
                <p className="eyebrow">No matches</p>
                <h2>Your current filters exclude every event.</h2>
                <p>Broaden status, categories, or radius to see more activity.</p>
              </article>
            ) : (
              filteredEvents.map((event) => {
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
                  <article key={event.id} className="card event-card">
                    <div className="event-card__header">
                      <div>
                        <p className="eyebrow">{event.category_titles.join(' · ')}</p>
                        <h2>{event.title}</h2>
                      </div>
                      <span className={`badge badge--${event.status}`}>{event.status}</span>
                    </div>
                    <p className="event-card__summary">
                      {event.description ?? 'No additional event description available.'}
                    </p>
                    <dl className="event-meta">
                      <div>
                        <dt>Latest update</dt>
                        <dd>{formatTimestamp(event.latest_geometry_date)}</dd>
                      </div>
                      <div>
                        <dt>Geometry records</dt>
                        <dd>{event.geometry_count}</dd>
                      </div>
                      <div>
                        <dt>Magnitude</dt>
                        <dd>
                          {event.magnitude_value !== null
                            ? `${event.magnitude_value} ${event.magnitude_unit ?? ''}`.trim()
                            : 'Unavailable'}
                        </dd>
                      </div>
                      <div>
                        <dt>Distance</dt>
                        <dd>{distanceKm !== null ? `${Math.round(distanceKm)} km` : 'N/A'}</dd>
                      </div>
                    </dl>
                    <a href={event.link} target="_blank" rel="noreferrer" className="text-link">
                      Open EONET event
                    </a>
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
