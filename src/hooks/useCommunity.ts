import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  username?: string;
  like_count: number;
  comment_count: number;
  user_liked: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
}

export function useCommunity(userId: string | undefined) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: rawPosts } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!rawPosts) { setLoading(false); return; }

      const userIds = [...new Set(rawPosts.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.username]) || []);

      const postIds = rawPosts.map(p => p.id);
      const { data: likes } = await supabase
        .from('community_likes')
        .select('post_id, user_id')
        .in('post_id', postIds);

      const { data: comments } = await supabase
        .from('community_comments')
        .select('post_id')
        .in('post_id', postIds);

      const likeCountMap = new Map<string, number>();
      const userLikedMap = new Map<string, boolean>();
      likes?.forEach(l => {
        likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) || 0) + 1);
        if (l.user_id === userId) userLikedMap.set(l.post_id, true);
      });

      const commentCountMap = new Map<string, number>();
      comments?.forEach(c => {
        commentCountMap.set(c.post_id, (commentCountMap.get(c.post_id) || 0) + 1);
      });

      setPosts(rawPosts.map(p => ({
        ...p,
        username: profileMap.get(p.user_id) || 'Anonymous',
        like_count: likeCountMap.get(p.id) || 0,
        comment_count: commentCountMap.get(p.id) || 0,
        user_liked: userLikedMap.get(p.id) || false,
      })));
    } catch (e) {
      console.error('fetchPosts error:', e);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('community-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_comments' }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const createPost = async (title: string, content: string, imageUrl?: string) => {
    if (!userId) return;
    const { error } = await supabase.from('community_posts').insert({
      user_id: userId, title, content, image_url: imageUrl || null,
    });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
  };

  const toggleLike = async (postId: string, liked: boolean) => {
    if (!userId) return;
    if (liked) {
      await supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', userId);
    } else {
      await supabase.from('community_likes').insert({ post_id: postId, user_id: userId });
    }
    fetchPosts();
  };

  const addComment = async (postId: string, content: string) => {
    if (!userId) return;
    const { error } = await supabase.from('community_comments').insert({
      post_id: postId, user_id: userId, content,
    });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
  };

  const deletePost = async (postId: string) => {
    await supabase.from('community_posts').delete().eq('id', postId);
    fetchPosts();
  };

  return { posts, loading, createPost, toggleLike, addComment, deletePost, refreshPosts: fetchPosts };
}

export function usePostDetail(postId: string, userId: string | undefined) {
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPost = useCallback(async () => {
    if (!userId || !postId) return;
    const { data } = await supabase.from('community_posts').select('*').eq('id', postId).single();
    if (!data) { setLoading(false); return; }

    const { data: profile } = await supabase.from('profiles').select('username').eq('user_id', data.user_id).single();
    const { data: likes } = await supabase.from('community_likes').select('user_id').eq('post_id', postId);
    const { data: rawComments } = await supabase.from('community_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true });

    const commentUserIds = [...new Set(rawComments?.map(c => c.user_id) || [])];
    const { data: commentProfiles } = await supabase.from('profiles').select('user_id, username').in('user_id', commentUserIds);
    const profileMap = new Map(commentProfiles?.map(p => [p.user_id, p.username]) || []);

    setPost({
      ...data,
      username: profile?.username || 'Anonymous',
      like_count: likes?.length || 0,
      comment_count: rawComments?.length || 0,
      user_liked: likes?.some(l => l.user_id === userId) || false,
    });

    setComments(rawComments?.map(c => ({ ...c, username: profileMap.get(c.user_id) || 'Anonymous' })) || []);
    setLoading(false);
  }, [postId, userId]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  useEffect(() => {
    const channel = supabase
      .channel(`post-${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_comments', filter: `post_id=eq.${postId}` }, () => fetchPost())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, fetchPost]);

  return { post, comments, loading, refreshPost: fetchPost };
}
