'use server';

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';

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

export async function updatePreferences(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    return redirect('/sign-in');
  }

  const supabase = createAdminClient();
  const displayName = String(formData.get('display_name') ?? '').trim() || null;
  const preferredStatus = String(formData.get('preferred_status') ?? 'open');
  const categoryFilters = parseCategoryFilters(formData.get('category_filters'));
  const watchLatitude = parseNullableNumber(formData.get('watch_latitude'));
  const watchLongitude = parseNullableNumber(formData.get('watch_longitude'));
  const radiusKm = Number(formData.get('radius_km') ?? '0');

  const { error } = await supabase.from('user_preferences').upsert({
    clerk_user_id: userId,
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
