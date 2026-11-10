-- CORE KITS: customer-linked orders and itemized order lines
alter table public.orders
  add column if not exists customer_id uuid references auth.users(id) on delete set null,
  add column if not exists delivery_area text,
  add column if not exists delivery_fee numeric(10,2) not null default 0,
  add column if not exists subtotal numeric(10,2);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  size text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null default 0,
  line_total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.order_items enable row level security;

-- Customers can view only orders linked to their authenticated account.
create policy "Customers read own orders"
on public.orders for select to authenticated
using (customer_id = auth.uid());

-- Customers may insert their own signed-in orders; existing guest checkout policies remain.
create policy "Customers create own orders"
on public.orders for insert to authenticated
with check (customer_id = auth.uid() or customer_id is null);

-- A signed-in customer can read item rows belonging to their orders.
create policy "Customers read own order items"
on public.order_items for select to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.customer_id = auth.uid()
  )
);

-- Checkout can add item rows to a newly-created order owned by this customer.
create policy "Customers add own order items"
on public.order_items for insert to authenticated
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.customer_id = auth.uid() or o.customer_id is null)
  )
);

-- Admins can read and manage item rows through the existing admin_users allow-list.
create policy "Admins manage order items"
on public.order_items for all to authenticated
using (
  exists (select 1 from public.admin_users a where a.user_id = auth.uid())
)
with check (
  exists (select 1 from public.admin_users a where a.user_id = auth.uid())
);
