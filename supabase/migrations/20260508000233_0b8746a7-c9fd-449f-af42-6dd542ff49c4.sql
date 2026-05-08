
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS budget_strategy text NOT NULL DEFAULT 'abo';
ALTER TABLE public.ad_sets ALTER COLUMN budget DROP NOT NULL;

ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS tutorial_completed boolean NOT NULL DEFAULT false;
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS history_tracking_enabled boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.ai_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'medium',
  due_date date,
  done boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'ai',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_tasks_all_own ON public.ai_tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER ai_tasks_updated_at BEFORE UPDATE ON public.ai_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.follower_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  client_id uuid NOT NULL,
  date date NOT NULL,
  instagram integer,
  facebook integer,
  tiktok integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, client_id, date)
);
ALTER TABLE public.follower_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY follower_snapshots_all_own ON public.follower_snapshots FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER follower_snapshots_updated_at BEFORE UPDATE ON public.follower_snapshots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
