CREATE TABLE public.planned_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID NOT NULL,
  name TEXT NOT NULL,
  objective TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  budget_type TEXT NOT NULL DEFAULT 'daily',
  daily_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.planned_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planned_campaigns_all_own"
  ON public.planned_campaigns
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_updated_at_planned_campaigns
  BEFORE UPDATE ON public.planned_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_planned_campaigns_client ON public.planned_campaigns(client_id);
CREATE INDEX idx_planned_campaigns_user ON public.planned_campaigns(user_id);