-- Kialikmin Clan website — database schema
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
--
-- Roles:
--   root  – the clan administrator. Manages places and creates clan chiefs.
--   chief – a clan chief assigned to ONE place. Registers and edits members of that place only.
-- Security is enforced in the database by Row Level Security (RLS), not just in the browser.

-- ---------- Tables ----------

create table if not exists public.places (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  district    text,
  province    text,
  country     text not null default 'Papua New Guinea',
  created_at  timestamptz not null default now()
);

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null,
  phone       text,
  role        text not null check (role in ('root', 'chief')),
  place_id    uuid references public.places(id),
  created_at  timestamptz not null default now()
);

create table if not exists public.members (
  id               uuid primary key default gen_random_uuid(),
  full_name        text not null,
  gender           text check (gender in ('Male', 'Female')),
  date_of_birth    date,
  village          text,
  phone            text,
  citizenship      text check (citizenship in ('Papua New Guinea', 'West Papua (Indonesia)')),
  membership_type  text not null default 'Ordinary' check (membership_type in ('Ordinary', 'Associate')),
  notes            text,
  place_id         uuid not null references public.places(id),
  registered_by    uuid references auth.users(id),
  created_at       timestamptz not null default now()
);

create index if not exists members_place_idx on public.members(place_id);

-- ---------- Helper functions (used by the policies) ----------

create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.my_place() returns uuid
language sql stable security definer set search_path = public as $$
  select place_id from public.profiles where id = auth.uid()
$$;

-- Always record who registered a member, whatever the browser sends.
create or replace function public.set_registered_by() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.registered_by := auth.uid();
  return new;
end $$;

drop trigger if exists members_set_registered_by on public.members;
create trigger members_set_registered_by
  before insert on public.members
  for each row execute function public.set_registered_by();

-- ---------- Row Level Security ----------

alter table public.places   enable row level security;
alter table public.profiles enable row level security;
alter table public.members  enable row level security;

-- places: every signed-in user can read; only root can change.
drop policy if exists places_read on public.places;
create policy places_read on public.places
  for select to authenticated using (true);

drop policy if exists places_root_write on public.places;
create policy places_root_write on public.places
  for all to authenticated
  using (public.my_role() = 'root') with check (public.my_role() = 'root');

-- profiles: you can read your own; root can read and change all.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (id = auth.uid() or public.my_role() = 'root');

drop policy if exists profiles_root_write on public.profiles;
create policy profiles_root_write on public.profiles
  for all to authenticated
  using (public.my_role() = 'root') with check (public.my_role() = 'root');

-- members: root sees everything; a chief sees and edits only their own place.
drop policy if exists members_root on public.members;
create policy members_root on public.members
  for all to authenticated
  using (public.my_role() = 'root') with check (public.my_role() = 'root');

drop policy if exists members_chief_select on public.members;
create policy members_chief_select on public.members
  for select to authenticated
  using (public.my_role() = 'chief' and place_id = public.my_place());

drop policy if exists members_chief_insert on public.members;
create policy members_chief_insert on public.members
  for insert to authenticated
  with check (public.my_role() = 'chief' and place_id = public.my_place());

drop policy if exists members_chief_update on public.members;
create policy members_chief_update on public.members
  for update to authenticated
  using (public.my_role() = 'chief' and place_id = public.my_place())
  with check (public.my_role() = 'chief' and place_id = public.my_place());

-- ---------- Starting places (from the February 2026 Public Notice) ----------

insert into public.places (name, district, province, country) values
  ('Telefomin District',  'Telefomin',           'Sandaun (West Sepik)', 'Papua New Guinea'),
  ('North Fly District',  'North Fly',           'Western',              'Papua New Guinea'),
  ('Tunap Anstein LLG',   null,                  'East Sepik',           'Papua New Guinea'),
  ('Ngalummin',           'Pegunungan Bintang',  'West Papua',           'Indonesia')
on conflict (name) do nothing;

-- ---------- Make yourself root (run AFTER creating your login) ----------
-- 1. Dashboard → Authentication → Users → Add user → enter your email + a strong password,
--    tick "Auto Confirm User".
-- 2. Replace the email below with yours, then run just these lines:
--
-- insert into public.profiles (id, full_name, role)
-- select id, 'Your Full Name', 'root' from auth.users where email = 'you@example.com';
