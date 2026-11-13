-- CORE KITS: reliable atomic checkout, customer profile settings and review permissions
-- Safe additive migration: creates a new profile table and RPC; does not drop or alter existing data.

create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  address text not null default '',
  delivery_area text not null default 'inside' check (delivery_area in ('inside','outside')),
  updated_at timestamptz not null default now()
);

alter table public.customer_profiles enable row level security;

-- Allow signed-in customers to reach their own profile rows; RLS restricts each row to auth.uid().
grant select, insert, update on table public.customer_profiles to authenticated;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='customer_profiles' and policyname='Customers read own profile') then
    create policy "Customers read own profile" on public.customer_profiles for select to authenticated using (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='customer_profiles' and policyname='Customers insert own profile') then
    create policy "Customers insert own profile" on public.customer_profiles for insert to authenticated with check (user_id = auth.uid());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='customer_profiles' and policyname='Customers update own profile') then
    create policy "Customers update own profile" on public.customer_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
  end if;
end
$$;

-- RLS policies govern row access; these grants allow the intended operations to reach RLS.
grant select on table public.product_reviews to anon, authenticated;
grant insert, update on table public.product_reviews to authenticated;
grant select on table public.orders, public.order_items to authenticated;

-- A single database transaction creates the order and all its item rows.
-- If any item fails, PostgreSQL rolls back the entire function call automatically.
create or replace function public.place_customer_order(
  p_customer_name text,
  p_phone text,
  p_address text,
  p_delivery_area text,
  p_delivery_fee numeric,
  p_subtotal numeric,
  p_customer_id uuid,
  p_product_id uuid,
  p_product_name text,
  p_size text,
  p_quantity integer,
  p_total_price numeric,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_item_count integer;
begin
  if coalesce(trim(p_customer_name), '') = ''
     or coalesce(trim(p_phone), '') = ''
     or coalesce(trim(p_address), '') = '' then
    raise exception 'Name, phone and delivery address are required';
  end if;

  if p_delivery_area not in ('inside','outside') then
    raise exception 'Invalid delivery area';
  end if;

  if p_delivery_fee <> (case when p_delivery_area = 'inside' then 70 else 130 end) then
    raise exception 'Delivery fee does not match the selected area';
  end if;

  if p_quantity is null or p_quantity < 1 or p_subtotal < 0
     or p_total_price <> p_subtotal + p_delivery_fee then
    raise exception 'Invalid order quantity or total';
  end if;

  if auth.uid() is null then
    if p_customer_id is not null then
      raise exception 'Guest checkout cannot create an account-linked order';
    end if;
  elsif p_customer_id is distinct from auth.uid() then
    raise exception 'Customer account mismatch';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) < 1 then
    raise exception 'Order must contain at least one item';
  end if;

  select count(*) into v_item_count
  from jsonb_to_recordset(p_items) as x(
    product_id uuid, product_name text, size text,
    quantity integer, unit_price numeric, line_total numeric
  );

  if v_item_count <> jsonb_array_length(p_items) then
    raise exception 'Invalid order item data';
  end if;

  insert into public.orders (
    customer_name, phone, address, delivery_area, delivery_fee, subtotal,
    customer_id, product_id, product_name, size, quantity, unit_price,
    total_price, status
  ) values (
    trim(p_customer_name), trim(p_phone), trim(p_address), p_delivery_area,
    p_delivery_fee, p_subtotal, p_customer_id, p_product_id,
    p_product_name, p_size, p_quantity, null, p_total_price, 'Pending'
  )
  returning id into v_order_id;

  insert into public.order_items (
    order_id, product_id, product_name, size, quantity, unit_price, line_total
  )
  select
    v_order_id, x.product_id, x.product_name, x.size,
    x.quantity, x.unit_price, x.line_total
  from jsonb_to_recordset(p_items) as x(
    product_id uuid, product_name text, size text,
    quantity integer, unit_price numeric, line_total numeric
  );

  return v_order_id;
end;
$$;

revoke all on function public.place_customer_order(
  text,text,text,text,numeric,numeric,uuid,uuid,text,text,integer,numeric,jsonb
) from public;

grant execute on function public.place_customer_order(
  text,text,text,text,numeric,numeric,uuid,uuid,text,text,integer,numeric,jsonb
) to anon, authenticated;
