'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatRelativeTime, formatTimestamp } from '@/lib/events';

type DashboardRealtimeProps = {
  eventCount: number;
  lastRefreshed: string | null;
};

export function DashboardRealtime({ eventCount, lastRefreshed }: DashboardRealtimeProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('natural-events-feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'natural_events'
        },
        () => {
          startTransition(() => {
            router.refresh();
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return (
    <div className="status-banner" aria-live="polite">
      <span className={`status-dot ${isPending ? 'status-dot--busy' : ''}`} />
      <div className="status-banner__content">
        <strong>Live feed monitoring {eventCount} events</strong>
        <span>
          {isPending ? 'Refreshing now' : `Last refreshed ${formatRelativeTime(lastRefreshed)}`} ·{' '}
          {formatTimestamp(lastRefreshed)}
        </span>
      </div>
    </div>
  );
}
