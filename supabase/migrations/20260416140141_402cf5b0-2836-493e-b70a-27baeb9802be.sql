
-- Community posts
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view posts" ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own posts" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Community comments
CREATE TABLE public.community_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view comments" ON public.community_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own comments" ON public.community_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.community_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Community likes (unique per user+post)
CREATE TABLE public.community_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view likes" ON public.community_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own likes" ON public.community_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.community_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;

-- Update profiles to be publicly readable for community display
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Anyone authenticated can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Storage bucket for community images
INSERT INTO storage.buckets (id, name, public) VALUES ('community-images', 'community-images', true);

CREATE POLICY "Anyone can view community images" ON storage.objects FOR SELECT USING (bucket_id = 'community-images');
CREATE POLICY "Authenticated users can upload community images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'community-images');

-- Timestamp trigger for community_posts
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_community_posts_updated_at
BEFORE UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
