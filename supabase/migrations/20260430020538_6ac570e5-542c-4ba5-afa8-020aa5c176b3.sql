
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS budget_type text NOT NULL DEFAULT 'daily';
ALTER TABLE public.ad_sets ADD COLUMN IF NOT EXISTS budget_type text NOT NULL DEFAULT 'daily';
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS results integer NOT NULL DEFAULT 0;
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS result_label text NOT NULL DEFAULT 'conversas';
ALTER TABLE public.creatives ADD COLUMN IF NOT EXISTS cost_per_result numeric NOT NULL DEFAULT 0;
