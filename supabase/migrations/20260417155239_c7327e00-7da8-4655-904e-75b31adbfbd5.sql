-- Add avatar and bio to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT;

-- Comment likes table
CREATE TABLE IF NOT EXISTS public.community_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view comment likes"
  ON public.community_comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create own comment likes"
  ON public.community_comment_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comment likes"
  ON public.community_comment_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add tags + view count to posts
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;

-- Allow comment updates by owner
CREATE POLICY "Users can update own comments"
  ON public.community_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.community_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  actor_id UUID NOT NULL,
  type TEXT NOT NULL,
  post_id UUID,
  comment_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.community_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications"
  ON public.community_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications"
  ON public.community_notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);
CREATE POLICY "Users can delete own notifications"
  ON public.community_notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars are publicly viewable"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated 
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated 
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comment_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_notifications;