-- Secure order tracking details, including every item in multi-product orders.
-- The existing track_order RPC is intentionally left unchanged.
create or replace function public.track_order_details(
  p_order_id uuid,
  p_phone text
)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select to_jsonb(o) || jsonb_build_object(
    'order_items',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'product_id', oi.product_id,
          'product_name', oi.product_name,
          'size', oi.size,
          'quantity', oi.quantity,
          'unit_price', oi.unit_price,
          'line_total', oi.line_total
        ) order by oi.created_at, oi.id
      )
      from public.order_items oi
      where oi.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  where o.id = p_order_id
    and regexp_replace(coalesce(o.phone, ''), '\\D', '', 'g')
        = regexp_replace(coalesce(p_phone, ''), '\\D', '', 'g')
  limit 1;
$$;

revoke all on function public.track_order_details(uuid, text) from public;
grant execute on function public.track_order_details(uuid, text) to anon, authenticated;
