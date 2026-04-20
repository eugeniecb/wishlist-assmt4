create extension if not exists pgcrypto;

create table if not exists public.natural_events (
  id text primary key,
  title text not null,
  description text,
  link text not null,
  status text not null check (status in ('open', 'closed')),
  closed_at timestamptz,
  category_ids text[] not null default '{}',
  category_titles text[] not null default '{}',
  source_ids text[] not null default '{}',
  source_urls text[] not null default '{}',
  geometry jsonb not null default '[]'::jsonb,
  geometry_count integer not null default 0,
  latest_geometry_date timestamptz,
  latest_geometry_type text,
  latest_latitude double precision,
  latest_longitude double precision,
  magnitude_value double precision,
  magnitude_unit text,
  magnitude_description text,
  raw_event jsonb not null,
  last_polled_at timestamptz not null default timezone('utc', now()),
  inserted_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists natural_events_status_idx
  on public.natural_events (status);

create index if not exists natural_events_latest_geometry_date_idx
  on public.natural_events (latest_geometry_date desc);

create index if not exists natural_events_category_titles_gin_idx
  on public.natural_events using gin (category_titles);

alter table public.natural_events enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'natural_events'
      and policyname = 'Public can read natural events'
  ) then
    create policy "Public can read natural events"
      on public.natural_events
      for select
      using (true);
  end if;
end $$;

create or replace function public.set_natural_events_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists natural_events_set_updated_at on public.natural_events;

create trigger natural_events_set_updated_at
before update on public.natural_events
for each row
execute function public.set_natural_events_updated_at();
