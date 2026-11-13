ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS has_short_sleeve boolean NOT NULL DEFAULT true;
