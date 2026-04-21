'use client';

import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function DashboardRealtime() {
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
      Feed status: watching for fresh event activity.
    </div>
  );
}
