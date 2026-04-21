'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  formatRelativeTime,
  formatTimestamp,
  getCategoryTone,
  getPrimaryCategory
} from '@/lib/events';
import type { NaturalEvent } from '@/lib/types';

type EventMapProps = {
  events: NaturalEvent[];
  watchLatitude: number | null;
  watchLongitude: number | null;
};

const CATEGORY_ICONS: Record<string, string> = {
  fire: '🔥',
  storm: '⛈️',
  volcano: '🌋',
  flood: '🌊',
  ice: '❄️',
  general: '📍'
};

const CATEGORY_COLORS: Record<string, string> = {
  fire: '#c8872d',
  storm: '#2d6cdf',
  volcano: '#c1424a',
  flood: '#2b8c7a',
  ice: '#5e86d6',
  general: '#0f5c5b'
};

function getMarkerIcon(tone: string) {
  const icon = CATEGORY_ICONS[tone] ?? CATEGORY_ICONS.general;
  const color = CATEGORY_COLORS[tone] ?? CATEGORY_COLORS.general;

  return L.divIcon({
    className: 'event-map__marker-wrapper',
    html: `<div class="event-map__marker" style="--marker-color: ${color}"><span>${icon}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -16]
  });
}

function getMapCenter(events: NaturalEvent[], watchLatitude: number | null, watchLongitude: number | null) {
  if (watchLatitude !== null && watchLongitude !== null) {
    return [watchLatitude, watchLongitude] as [number, number];
  }

  const withCoordinates = events.filter(
    (event) => event.latest_latitude !== null && event.latest_longitude !== null
  );

  if (withCoordinates.length === 0) {
    return [20, 0] as [number, number];
  }

  const latitudeTotal = withCoordinates.reduce(
    (sum, event) => sum + (event.latest_latitude ?? 0),
    0
  );
  const longitudeTotal = withCoordinates.reduce(
    (sum, event) => sum + (event.latest_longitude ?? 0),
    0
  );

  return [
    latitudeTotal / withCoordinates.length,
    longitudeTotal / withCoordinates.length
  ] as [number, number];
}

export function EventMap({ events, watchLatitude, watchLongitude }: EventMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const mappableEvents = events.filter(
    (event) => event.latest_latitude !== null && event.latest_longitude !== null
  );

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (!mapRef.current) {
      mapRef.current = L.map(containerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;
    const center = getMapCenter(mappableEvents, watchLatitude, watchLongitude);

    map.setView(center, 2);

    const markers = mappableEvents.map((event) => {
      const tone = getCategoryTone(getPrimaryCategory(event));
      const marker = L.marker([event.latest_latitude ?? 0, event.latest_longitude ?? 0], {
        icon: getMarkerIcon(tone)
      });

      marker.bindPopup(
        `
          <div class="event-map__popup">
            <strong>${event.title}</strong>
            <span>${getPrimaryCategory(event)}</span>
            <span>${event.status}</span>
            <span>${formatRelativeTime(event.latest_geometry_date)}</span>
            <span>${formatTimestamp(event.latest_geometry_date)}</span>
          </div>
        `
      );

      marker.addTo(map);
      return marker;
    });

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [mappableEvents, watchLatitude, watchLongitude]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  if (mappableEvents.length === 0) {
    return (
      <div className="dashboard-panel empty-state">
        <p className="eyebrow">No mapped events</p>
        <h2>None of the current results include usable coordinates.</h2>
        <p>Switch back to the list view to review the events that are still available.</p>
      </div>
    );
  }

  return (
    <div className="event-map">
      <div ref={containerRef} className="event-map__canvas" />
    </div>
  );
}
