
CREATE TABLE public.monthly_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL,
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  total_budget numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_id, year, month)
);

ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_budgets_all_own" ON public.monthly_budgets
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER monthly_budgets_set_updated_at
  BEFORE UPDATE ON public.monthly_budgets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.daily_spends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  monthly_budget_id uuid NOT NULL REFERENCES public.monthly_budgets(id) ON DELETE CASCADE,
  day int NOT NULL CHECK (day BETWEEN 1 AND 31),
  spent_so_far numeric NOT NULL DEFAULT 0,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (monthly_budget_id, day)
);

ALTER TABLE public.daily_spends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_spends_all_own" ON public.daily_spends
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER daily_spends_set_updated_at
  BEFORE UPDATE ON public.daily_spends
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_monthly_budgets_client ON public.monthly_budgets(client_id);
CREATE INDEX idx_daily_spends_budget ON public.daily_spends(monthly_budget_id);
