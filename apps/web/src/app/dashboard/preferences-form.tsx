'use client';

import { useEffect, useState } from 'react';
import { getCategoryTone } from '@/lib/events';
import type { PreferredStatus, UserPreferences } from '@/lib/types';

type UpdatePreferencesAction = (formData: FormData) => void | Promise<void>;

type CitySuggestion = {
  displayName: string;
  latitude: number;
  longitude: number;
};

type PreferencesFormProps = {
  action: UpdatePreferencesAction;
  availableCategories: string[];
  preferences: UserPreferences;
};

const LOCATION_LABEL_KEY = 'planet-watch-location-label';

function buildLocationFallback(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) {
    return '';
  }

  return `Saved location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;
}

export function PreferencesForm({
  action,
  availableCategories,
  preferences
}: PreferencesFormProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(preferences.category_filters);
  const [latitude, setLatitude] = useState<number | null>(preferences.watch_latitude);
  const [longitude, setLongitude] = useState<number | null>(preferences.watch_longitude);
  const [radiusKm, setRadiusKm] = useState<number>(preferences.radius_km);
  const [cityQuery, setCityQuery] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [statusFocus, setStatusFocus] = useState<PreferredStatus>(preferences.preferred_status);

  useEffect(() => {
    const savedLabel = window.localStorage.getItem(LOCATION_LABEL_KEY);

    if (savedLabel) {
      setLocationLabel(savedLabel);
      return;
    }

    setLocationLabel(buildLocationFallback(preferences.watch_latitude, preferences.watch_longitude));
  }, [preferences.watch_latitude, preferences.watch_longitude]);

  useEffect(() => {
    const query = cityQuery.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsSearching(true);

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`,
          {
            signal: controller.signal,
            headers: {
              Accept: 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Location search failed.');
        }

        const data = (await response.json()) as Array<{
          display_name: string;
          lat: string;
          lon: string;
        }>;

        setSuggestions(
          data.map((item) => ({
            displayName: item.display_name,
            latitude: Number(item.lat),
            longitude: Number(item.lon)
          }))
        );
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setSuggestions([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 260);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [cityQuery]);

  function toggleCategory(category: string) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((value) => value !== category)
        : [...current, category]
    );
  }

  function selectCity(suggestion: CitySuggestion) {
    setLatitude(suggestion.latitude);
    setLongitude(suggestion.longitude);
    setCityQuery(suggestion.displayName);
    setLocationLabel(suggestion.displayName);
    setSuggestions([]);

    if (radiusKm === 0) {
      setRadiusKm(500);
    }

    window.localStorage.setItem(LOCATION_LABEL_KEY, suggestion.displayName);
  }

  function clearLocation() {
    setLatitude(null);
    setLongitude(null);
    setCityQuery('');
    setLocationLabel('');
    setRadiusKm(0);
    setSuggestions([]);
    window.localStorage.removeItem(LOCATION_LABEL_KEY);
  }

  return (
    <>
      <button
        type="button"
        className="filters-toggle"
        onClick={() => setIsPanelOpen(true)}
        aria-expanded={isPanelOpen}
      >
        Filters and preferences
      </button>

      {isPanelOpen ? (
        <button
          type="button"
          className="filters-overlay"
          aria-label="Close filters"
          onClick={() => setIsPanelOpen(false)}
        />
      ) : null}

      <form action={action} className={`preferences-panel ${isPanelOpen ? 'preferences-panel--open' : ''}`}>
        <div className="panel-header">
          <p className="eyebrow">Preferences</p>
          <h2>Refine your watch profile</h2>
          <p className="support-copy">
            Adjust how the feed is filtered, where it centers, and which categories stay in view.
          </p>
        </div>

        <div className="preferences-panel__body">
          <label className="field">
            <span>Display name</span>
            <input name="display_name" type="text" defaultValue={preferences.display_name ?? ''} />
          </label>

          <label className="field">
            <span>Status focus</span>
            <select
              name="preferred_status"
              defaultValue={preferences.preferred_status}
              onChange={(event) => setStatusFocus(event.target.value as PreferredStatus)}
            >
              <option value="open">Open events</option>
              <option value="closed">Closed events</option>
              <option value="all">All events</option>
            </select>
            <small>
              {statusFocus === 'all'
                ? 'Show every event regardless of status.'
                : `Only ${statusFocus} events will appear in the feed.`}
            </small>
          </label>

          <div className="field">
            <span>City</span>
            <div className="city-picker">
              <input
                type="text"
                value={cityQuery}
                onChange={(event) => setCityQuery(event.target.value)}
                placeholder="Search for a city"
                autoComplete="off"
              />
              {cityQuery.trim().length >= 2 ? (
                <div className="city-picker__results">
                  {isSearching ? (
                    <p className="city-picker__hint">Searching cities…</p>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((suggestion) => (
                      <button
                        key={`${suggestion.displayName}-${suggestion.latitude}-${suggestion.longitude}`}
                        type="button"
                        className="city-picker__option"
                        onClick={() => selectCity(suggestion)}
                      >
                        {suggestion.displayName}
                      </button>
                    ))
                  ) : (
                    <p className="city-picker__hint">No matches found.</p>
                  )}
                </div>
              ) : null}
            </div>
            <small>
              Search for a city and choose it from the list. Coordinates are resolved for you in
              the background.
            </small>
          </div>

          {locationLabel ? (
            <div className="location-summary">
              <span>Watching from: {locationLabel}</span>
              <button type="button" className="text-link" onClick={clearLocation}>
                Clear location
              </button>
            </div>
          ) : (
            <div className="location-summary">
              <span>Watching from: Global view</span>
            </div>
          )}

          <input name="watch_latitude" type="hidden" value={latitude ?? ''} readOnly />
          <input name="watch_longitude" type="hidden" value={longitude ?? ''} readOnly />
          <input
            name="category_filters"
            type="hidden"
            value={selectedCategories.join(', ')}
            readOnly
          />

          <div className="field">
            <span>Categories</span>
            <div className="category-chips">
              {availableCategories.map((category) => {
                const tone = getCategoryTone(category);
                const isActive = selectedCategories.includes(category);

                return (
                  <button
                    key={category}
                    type="button"
                    className={`category-chip category-chip--${tone} ${isActive ? 'category-chip--active' : ''}`}
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
            <small>
              Leave every chip off to show all event categories, or select one or more to narrow
              the feed.
            </small>
          </div>

          <label className="field">
            <span>Show events within {radiusKm} km of your city</span>
            <input
              name="radius_km"
              type="range"
              min="0"
              max="5000"
              step="50"
              value={radiusKm}
              onChange={(event) => setRadiusKm(Number(event.target.value))}
            />
            <div className="range-meta">
              <small>0 shows all global events.</small>
              <span>{radiusKm} km</span>
            </div>
          </label>
        </div>

        <div className="preferences-panel__footer">
          <button type="submit" className="button button--primary">
            Save preferences
          </button>
        </div>
      </form>
    </>
  );
}
