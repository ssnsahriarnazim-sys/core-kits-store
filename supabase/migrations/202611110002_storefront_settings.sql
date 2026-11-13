create table if not exists public.storefront_settings (
  id text primary key check (id = 'default'),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.storefront_settings enable row level security;

drop policy if exists "Public can read storefront settings" on public.storefront_settings;
create policy "Public can read storefront settings"
on public.storefront_settings for select
to anon, authenticated
using (true);

drop policy if exists "Admins can insert storefront settings" on public.storefront_settings;
create policy "Admins can insert storefront settings"
on public.storefront_settings for insert
to authenticated
with check (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
));

drop policy if exists "Admins can update storefront settings" on public.storefront_settings;
create policy "Admins can update storefront settings"
on public.storefront_settings for update
to authenticated
using (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.admin_users
  where admin_users.user_id = (select auth.uid())
));

insert into public.storefront_settings (id, settings)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;
