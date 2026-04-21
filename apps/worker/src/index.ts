import { createClient } from '@supabase/supabase-js';
import { fetchEonetEvents, normalizeEvents } from './eonet.js';

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const supabaseServiceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const eonetApiUrl = process.env.EONET_API_URL ?? 'https://eonet.gsfc.nasa.gov/api/v3/events';
  const eonetDays = process.env.EONET_DAYS ?? '30';
  const eonetLimit = process.env.EONET_LIMIT ?? '100';
  const eonetStatus = process.env.EONET_STATUS ?? 'open';
  const polledAt = new Date().toISOString();

  const params = new URLSearchParams({
    days: eonetDays,
    limit: eonetLimit,
    status: eonetStatus
  });

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log(`Polling ${eonetApiUrl}?${params.toString()}`);
  const payload = await fetchEonetEvents(eonetApiUrl, params);
  const rows = normalizeEvents(payload.events, polledAt);

  if (rows.length === 0) {
    console.log('No events returned by EONET.');
    return;
  }

  const { error } = await supabase.from('natural_events').upsert(rows, {
    onConflict: 'id'
  });

  if (error) {
    throw error;
  }

  console.log(`Upserted ${rows.length} natural events at ${polledAt}.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
