ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS has_long_sleeve boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_custom_name boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_custom_number boolean NOT NULL DEFAULT false;
