drop trigger if exists on_auth_user_created_user_preferences on auth.users;
drop function if exists private.handle_new_user_preferences();

drop policy if exists "Users can read their preferences" on public.user_preferences;
drop policy if exists "Users can insert their preferences" on public.user_preferences;
drop policy if exists "Users can update their preferences" on public.user_preferences;

alter table public.user_preferences
  drop constraint if exists user_preferences_user_id_fkey;

alter table public.user_preferences
  rename column user_id to clerk_user_id;

alter table public.user_preferences
  alter column clerk_user_id type text using clerk_user_id::text;
