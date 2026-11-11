-- CORE KITS: single-admin web push subscriptions and automatic order notifications
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create table if not exists public.admin_push_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  endpoint text not null unique,
  subscription jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.admin_push_subscriptions enable row level security;
drop policy if exists "Admins manage own push subscription" on public.admin_push_subscriptions;
create policy "Admins manage own push subscription"
on public.admin_push_subscriptions
for all to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid() and a.user_id = admin_push_subscriptions.user_id))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid() and a.user_id = admin_push_subscriptions.user_id));
grant select, insert, update, delete on public.admin_push_subscriptions to authenticated;

-- The webhook secret is stored in Supabase Vault, never in browser code or Git.
select vault.create_secret('ck_push_hook_2026_11_najim_7f4c9d2a', 'core_kits_push_webhook_secret', 'Authenticates the database-to-Edge-Function order notification call')
where not exists (select 1 from vault.decrypted_secrets where name = 'core_kits_push_webhook_secret');

create or replace function public.notify_admin_new_order_push()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  hook_secret text;
begin
  select decrypted_secret into hook_secret
  from vault.decrypted_secrets
  where name = 'core_kits_push_webhook_secret'
  limit 1;

  if hook_secret is null then
    raise warning 'CORE KITS push webhook secret is not configured';
    return new;
  end if;

  perform net.http_post(
    url := 'https://rjpphcrpqfdfmqjfbjwf.supabase.co/functions/v1/send-order-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-push-secret', hook_secret
    ),
    body := jsonb_build_object('record', to_jsonb(new))
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_admin_new_order_push on public.orders;
create trigger trg_notify_admin_new_order_push
after insert on public.orders
for each row execute function public.notify_admin_new_order_push();
