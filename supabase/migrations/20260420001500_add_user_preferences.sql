create schema if not exists private;

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  preferred_status text not null default 'open' check (preferred_status in ('open', 'closed', 'all')),
  category_filters text[] not null default '{}',
  watch_latitude double precision,
  watch_longitude double precision,
  radius_km integer not null default 0 check (radius_km >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.user_preferences enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_preferences'
      and policyname = 'Users can read their preferences'
  ) then
    create policy "Users can read their preferences"
      on public.user_preferences
      for select
      to authenticated
      using ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_preferences'
      and policyname = 'Users can insert their preferences'
  ) then
    create policy "Users can insert their preferences"
      on public.user_preferences
      for insert
      to authenticated
      with check ((select auth.uid()) = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_preferences'
      and policyname = 'Users can update their preferences'
  ) then
    create policy "Users can update their preferences"
      on public.user_preferences
      for update
      to authenticated
      using ((select auth.uid()) = user_id)
      with check ((select auth.uid()) = user_id);
  end if;
end $$;

create or replace function public.set_user_preferences_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row
execute function public.set_user_preferences_updated_at();

create or replace function private.handle_new_user_preferences()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_preferences (user_id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_user_preferences on auth.users;

create trigger on_auth_user_created_user_preferences
after insert on auth.users
for each row
execute function private.handle_new_user_preferences();

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) and not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'natural_events'
  ) then
    alter publication supabase_realtime add table public.natural_events;
  end if;
end $$;
