import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { updatePreferences } from '@/app/actions';
import { FeedPanel } from '@/app/dashboard/feed-panel';
import { PreferencesForm } from '@/app/dashboard/preferences-form';
import { DashboardRealtime } from '@/app/dashboard/realtime-events';
import {
  dedupeEvents,
  eventMatchesPreferences,
  formatRelativeTime,
  formatTimestamp,
  getCategoryTone,
  getPrimaryCategory
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

function getRelativeTimeParts(value: string | null) {
  const formatted = formatRelativeTime(value);
  const [primary, ...rest] = formatted.split(' ');

  return {
    primary,
    suffix: rest.join(' ')
  };
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
  const latestRefreshParts = getRelativeTimeParts(latestRefresh);
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
        </article>

        <article className="stats-bar__card">
          <span className="stats-bar__label">Severe storms</span>
          <strong>{statsByTone.storm ?? 0}</strong>
        </article>

        <article className="stats-bar__card">
          <span className="stats-bar__label">Volcanoes</span>
          <strong>{statsByTone.volcano ?? 0}</strong>
        </article>

        <article className="stats-bar__card stats-bar__card--refresh">
          <span className="stats-bar__label">Last refreshed</span>
          <strong className="stats-bar__relative">
            <span>{latestRefreshParts.primary}</span>
            {latestRefreshParts.suffix ? (
              <small>{latestRefreshParts.suffix}</small>
            ) : null}
          </strong>
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
        <FeedPanel
          events={filteredEvents}
          watchLatitude={preferences.watch_latitude}
          watchLongitude={preferences.watch_longitude}
        />
      </section>
    </main>
  );
}
