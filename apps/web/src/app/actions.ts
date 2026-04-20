'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function getOrigin(headerStore: Headers) {
  const forwardedProto = headerStore.get('x-forwarded-proto');
  const forwardedHost = headerStore.get('x-forwarded-host');
  const host = forwardedHost ?? headerStore.get('host');
  const protocol = forwardedProto ?? 'http';

  if (!host) {
    throw new Error('Unable to determine request host for auth redirect.');
  }

  return `${protocol}://${host}`;
}

function parseCategoryFilters(rawValue: FormDataEntryValue | null) {
  return String(rawValue ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseNullableNumber(rawValue: FormDataEntryValue | null) {
  const value = String(rawValue ?? '').trim();

  if (!value) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export async function login(formData: FormData) {
  const supabase = await createClient();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const destination = '/dashboard';

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`);
  }

  redirect(destination);
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const headerStore = await headers();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const displayName = String(formData.get('display_name') ?? '').trim();
  const origin = getOrigin(headerStore);

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      data: {
        display_name: displayName
      }
    }
  });

  if (error) {
    redirect(`/?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/?message=Check your email to confirm your account.');
}

export async function signout() {
  const supabase = await createClient();

  await supabase.auth.signOut();
  redirect('/');
}

export async function updatePreferences(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  const displayName = String(formData.get('display_name') ?? '').trim() || null;
  const preferredStatus = String(formData.get('preferred_status') ?? 'open');
  const categoryFilters = parseCategoryFilters(formData.get('category_filters'));
  const watchLatitude = parseNullableNumber(formData.get('watch_latitude'));
  const watchLongitude = parseNullableNumber(formData.get('watch_longitude'));
  const radiusKm = Number(formData.get('radius_km') ?? '0');

  const { error } = await supabase.from('user_preferences').upsert({
    user_id: user.id,
    display_name: displayName,
    preferred_status: preferredStatus,
    category_filters: categoryFilters,
    watch_latitude: watchLatitude,
    watch_longitude: watchLongitude,
    radius_km: Number.isFinite(radiusKm) && radiusKm >= 0 ? radiusKm : 0
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/dashboard?message=Preferences updated.');
}
