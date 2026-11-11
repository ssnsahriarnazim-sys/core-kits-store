-- CORE KITS product reviews
create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_id uuid not null references auth.users(id) on delete cascade,
  customer_name text not null,
  rating integer not null check (rating between 1 and 5),
  review_text text not null check (char_length(trim(review_text)) between 5 and 1200),
  created_at timestamptz not null default now(),
  unique (product_id, customer_id)
);

create index if not exists product_reviews_product_created_idx
  on public.product_reviews(product_id, created_at desc);

alter table public.product_reviews enable row level security;

drop policy if exists "Public can read product reviews" on public.product_reviews;
create policy "Public can read product reviews"
on public.product_reviews for select to anon, authenticated
using (true);

drop policy if exists "Customers create own product review" on public.product_reviews;
create policy "Customers create own product review"
on public.product_reviews for insert to authenticated
with check (customer_id = auth.uid());

drop policy if exists "Customers update own product review" on public.product_reviews;
create policy "Customers update own product review"
on public.product_reviews for update to authenticated
using (customer_id = auth.uid())
with check (customer_id = auth.uid());

drop policy if exists "Admins manage product reviews" on public.product_reviews;
create policy "Admins manage product reviews"
on public.product_reviews for all to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = auth.uid()))
with check (exists (select 1 from public.admin_users a where a.user_id = auth.uid()));
