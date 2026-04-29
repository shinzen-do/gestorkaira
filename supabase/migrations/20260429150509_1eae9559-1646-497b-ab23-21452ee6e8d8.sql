-- ============================================================
-- KAIRA: schema completo (multi-tenant por user_id)
-- ============================================================

-- Helper: trigger genérico de updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ---------- user_settings ----------
CREATE TABLE public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('light','dark','system')),
  language TEXT NOT NULL DEFAULT 'pt' CHECK (language IN ('pt','en','es')),
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_select_own" ON public.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "settings_insert_own" ON public.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "settings_update_own" ON public.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER user_settings_updated BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- clients ----------
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  monthly_budget NUMERIC(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_all_own" ON public.clients FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_clients_user ON public.clients(user_id);
CREATE TRIGGER clients_updated BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- campaigns ----------
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  objective TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  budget NUMERIC(12,2) DEFAULT 0,
  spend NUMERIC(12,2) DEFAULT 0,
  roas NUMERIC(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_all_own" ON public.campaigns FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_campaigns_client ON public.campaigns(client_id);
CREATE TRIGGER campaigns_updated BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- ad_sets ----------
CREATE TABLE public.ad_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  budget NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "adsets_all_own" ON public.ad_sets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_adsets_campaign ON public.ad_sets(campaign_id);
CREATE TRIGGER adsets_updated BEFORE UPDATE ON public.ad_sets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- creatives ----------
CREATE TABLE public.creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_set_id UUID NOT NULL REFERENCES public.ad_sets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'image' CHECK (format IN ('image','video','carousel')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  url TEXT,
  ctr NUMERIC(6,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.creatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creatives_all_own" ON public.creatives FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_creatives_adset ON public.creatives(ad_set_id);
CREATE TRIGGER creatives_updated BEFORE UPDATE ON public.creatives FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- audiences (globais) ----------
CREATE TABLE public.audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  gender TEXT DEFAULT 'all' CHECK (gender IN ('all','male','female')),
  age_min INTEGER DEFAULT 18,
  age_max INTEGER DEFAULT 65,
  interests TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  size_estimate INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audiences_all_own" ON public.audiences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_audiences_user ON public.audiences(user_id);
CREATE TRIGGER audiences_updated BEFORE UPDATE ON public.audiences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- audience_campaigns (relação N:N) ----------
CREATE TABLE public.audience_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audience_id UUID NOT NULL REFERENCES public.audiences(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (audience_id, campaign_id)
);
ALTER TABLE public.audience_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audcamp_all_own" ON public.audience_campaigns FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_audcamp_aud ON public.audience_campaigns(audience_id);
CREATE INDEX idx_audcamp_camp ON public.audience_campaigns(campaign_id);

-- ---------- validated_creatives (biblioteca por cliente) ----------
CREATE TABLE public.validated_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'image' CHECK (format IN ('image','video','carousel')),
  url TEXT,
  ctr NUMERIC(6,2),
  roas NUMERIC(8,2),
  tags TEXT[] DEFAULT '{}',
  validated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.validated_creatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "valcreat_all_own" ON public.validated_creatives FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_valcreat_client ON public.validated_creatives(client_id);

-- ---------- timeline_entries (histórico) ----------
CREATE TABLE public.timeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('client','campaign','adset','audience','creative')),
  target_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('creative','budget','audience','bid','status','note')),
  description TEXT NOT NULL,
  details TEXT,
  impact TEXT NOT NULL DEFAULT 'neutral' CHECK (impact IN ('positive','negative','neutral')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.timeline_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timeline_all_own" ON public.timeline_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_timeline_target ON public.timeline_entries(target_type, target_id);
CREATE INDEX idx_timeline_user_date ON public.timeline_entries(user_id, occurred_at);

-- ---------- calendar_notes ----------
CREATE TABLE public.calendar_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  done BOOLEAN NOT NULL DEFAULT false,
  link_type TEXT DEFAULT 'none' CHECK (link_type IN ('none','client','campaign','audience')),
  link_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.calendar_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calnotes_all_own" ON public.calendar_notes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_calnotes_user_date ON public.calendar_notes(user_id, date);
CREATE TRIGGER calnotes_updated BEFORE UPDATE ON public.calendar_notes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- auto-criar user_settings no signup ----------
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_settings (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();