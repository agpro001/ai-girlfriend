
-- 1. Update admin grant function to support both seed emails
CREATE OR REPLACE FUNCTION public.grant_admin_to_seed_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IN ('aditya@ai.ai', 'adityagupta1234.in@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_grant_admin ON auth.users;
CREATE TRIGGER on_auth_user_grant_admin
AFTER INSERT OR UPDATE OF email ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_to_seed_email();

-- Backfill admin for both seed emails
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
WHERE email IN ('aditya@ai.ai', 'adityagupta1234.in@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Companion overrides table — admins edit companion model data live
CREATE TABLE IF NOT EXISTS public.companion_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id TEXT NOT NULL UNIQUE,
  name TEXT,
  tagline TEXT,
  description TEXT,
  hidden_goal TEXT,
  trust_threshold INTEGER,
  neon_color TEXT,
  agreeableness DOUBLE PRECISION,
  neuroticism DOUBLE PRECISION,
  sarcasm DOUBLE PRECISION,
  ambition DOUBLE PRECISION,
  empathy DOUBLE PRECISION,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
ALTER TABLE public.companion_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view companion overrides"
  ON public.companion_overrides FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert companion overrides"
  ON public.companion_overrides FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update companion overrides"
  ON public.companion_overrides FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete companion overrides"
  ON public.companion_overrides FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_companion_overrides_updated
BEFORE UPDATE ON public.companion_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Allow admins to update/insert any user's mood (for live mood control)
CREATE POLICY "Admins update any mood"
  ON public.companion_moods FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert any mood"
  ON public.companion_moods FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. Wallpaper collections
CREATE TABLE IF NOT EXISTS public.wallpaper_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallpaper_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view collections"
  ON public.wallpaper_collections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage collections insert"
  ON public.wallpaper_collections FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage collections update"
  ON public.wallpaper_collections FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage collections delete"
  ON public.wallpaper_collections FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TABLE IF NOT EXISTS public.wallpapers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES public.wallpaper_collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'static', -- 'static' | 'live'
  -- preset values for safe live wallpapers (no untrusted code)
  preset TEXT, -- e.g. 'aurora', 'matrix', 'neon-grid', 'particles', 'petals'
  gradient TEXT, -- CSS gradient string (sanitized)
  primary_color TEXT,
  accent_color TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallpapers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can view wallpapers"
  ON public.wallpapers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert wallpapers"
  ON public.wallpapers FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update wallpapers"
  ON public.wallpapers FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete wallpapers"
  ON public.wallpapers FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Per-user wallpaper assignment (target_user_id NULL = global default)
CREATE TABLE IF NOT EXISTS public.user_wallpaper_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID UNIQUE,
  wallpaper_id UUID REFERENCES public.wallpapers(id) ON DELETE SET NULL,
  is_global BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_global_wallpaper ON public.user_wallpaper_settings ((is_global)) WHERE is_global = true;
ALTER TABLE public.user_wallpaper_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallpaper or global"
  ON public.user_wallpaper_settings FOR SELECT TO authenticated
  USING (is_global = true OR target_user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert wallpaper settings"
  ON public.user_wallpaper_settings FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update wallpaper settings"
  ON public.user_wallpaper_settings FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete wallpaper settings"
  ON public.user_wallpaper_settings FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. Realtime for new tables
ALTER TABLE public.companion_overrides REPLICA IDENTITY FULL;
ALTER TABLE public.companion_moods REPLICA IDENTITY FULL;
ALTER TABLE public.wallpapers REPLICA IDENTITY FULL;
ALTER TABLE public.user_wallpaper_settings REPLICA IDENTITY FULL;

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.companion_overrides;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.companion_moods;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.wallpapers;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.user_wallpaper_settings;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Seed wallpaper collections + presets
INSERT INTO public.wallpaper_collections (slug, name, description) VALUES
  ('cyberpunk', 'Cyberpunk', 'Neon-soaked nights and electric grids'),
  ('aurora', 'Aurora', 'Flowing northern-light gradients'),
  ('minimal', 'Minimal Dark', 'Clean dark backdrops with subtle accents'),
  ('live', 'Live', 'Animated live wallpapers')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.wallpapers (collection_id, name, kind, preset, gradient, primary_color, accent_color)
SELECT c.id, w.name, w.kind, w.preset, w.gradient, w.primary_color, w.accent_color
FROM (VALUES
  ('cyberpunk', 'Neon Pulse', 'static', NULL, 'radial-gradient(ellipse at top, hsl(280 100% 65% / 0.25), transparent 60%), linear-gradient(180deg, hsl(240 15% 5%), hsl(240 20% 3%))', '#9333ea', '#ec4899'),
  ('cyberpunk', 'Tokyo Rain', 'static', NULL, 'linear-gradient(180deg, hsl(220 30% 6%), hsl(280 30% 8%))', '#22d3ee', '#a855f7'),
  ('aurora', 'Boreal', 'static', NULL, 'linear-gradient(135deg, hsl(180 80% 40% / 0.3), hsl(280 80% 50% / 0.3), hsl(330 80% 55% / 0.3))', '#22d3ee', '#f472b6'),
  ('minimal', 'Obsidian', 'static', NULL, 'linear-gradient(180deg, hsl(240 10% 5%), hsl(240 10% 8%))', '#a78bfa', '#9ca3af'),
  ('live', 'Aurora Flow', 'live', 'aurora', NULL, '#22d3ee', '#a855f7'),
  ('live', 'Neon Grid', 'live', 'neon-grid', NULL, '#ec4899', '#22d3ee'),
  ('live', 'Particle Field', 'live', 'particles', NULL, '#a855f7', '#ec4899'),
  ('live', 'Falling Petals', 'live', 'petals', NULL, '#ec4899', '#f472b6'),
  ('live', 'Matrix Drift', 'live', 'matrix', NULL, '#22c55e', '#06b6d4')
) AS w(coll_slug, name, kind, preset, gradient, primary_color, accent_color)
JOIN public.wallpaper_collections c ON c.slug = w.coll_slug
WHERE NOT EXISTS (SELECT 1 FROM public.wallpapers wp WHERE wp.name = w.name);
