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
  tags: string[];
  view_count: number;
  username?: string;
  avatar_url?: string | null;
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
  avatar_url?: string | null;
  like_count: number;
  user_liked: boolean;
}

export type SortMode = 'new' | 'top' | 'hot';

/** Extract @username tokens from content */
const parseMentions = (text: string): string[] => {
  const set = new Set<string>();
  const re = /@(\w{2,30})/g;
  let m;
  while ((m = re.exec(text)) !== null) set.add(m[1]);
  return [...set];
};

const sendMentionNotifications = async (
  text: string,
  actorId: string,
  postId: string,
  commentId?: string,
  excludeUserIds: string[] = [],
) => {
  const usernames = parseMentions(text);
  if (!usernames.length) return;
  const { data: profs } = await supabase
    .from('profiles')
    .select('user_id, username')
    .in('username', usernames);
  if (!profs?.length) return;
  const targets = profs
    .map(p => p.user_id)
    .filter(uid => uid !== actorId && !excludeUserIds.includes(uid));
  if (!targets.length) return;
  await supabase.from('community_notifications' as any).insert(
    targets.map(uid => ({
      user_id: uid, actor_id: actorId, type: 'mention', post_id: postId, comment_id: commentId || null,
    })),
  );
};

export function useCommunity(userId: string | undefined) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('new');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const { toast } = useToast();

  // Load blocks
  useEffect(() => {
    if (!userId) return;
    supabase.from('community_blocks' as any).select('blocked_id').eq('blocker_id', userId).then(({ data }) => {
      setBlockedIds(new Set((data as any[] | null)?.map(b => b.blocked_id) || []));
    });
  }, [userId]);

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
        .select('user_id, username, avatar_url, banned')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const postIds = rawPosts.map(p => p.id);
      const [{ data: likes }, { data: comments }] = await Promise.all([
        supabase.from('community_likes').select('post_id, user_id').in('post_id', postIds),
        supabase.from('community_comments').select('post_id').in('post_id', postIds),
      ]);

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

      setPosts(rawPosts
        .filter(p => !(profileMap.get(p.user_id) as any)?.banned)
        .map(p => ({
          ...p,
          tags: (p as any).tags || [],
          view_count: (p as any).view_count || 0,
          username: profileMap.get(p.user_id)?.username || 'Anonymous',
          avatar_url: (profileMap.get(p.user_id) as any)?.avatar_url || null,
          like_count: likeCountMap.get(p.id) || 0,
          comment_count: commentCountMap.get(p.id) || 0,
          user_liked: userLikedMap.get(p.id) || false,
        }))
      );
    } catch (e) {
      console.error('fetchPosts error:', e);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    const channel = supabase
      .channel('community-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_comments' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_likes' }, () => fetchPosts())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  const createPost = async (title: string, content: string, imageUrl?: string, tags: string[] = []) => {
    if (!userId) return;
    const { data, error } = await supabase.from('community_posts').insert({
      user_id: userId, title, content, image_url: imageUrl || null, tags,
    } as any).select('id').single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Posted!', description: 'Your post is live.' });
    if (data?.id) await sendMentionNotifications(`${title} ${content}`, userId, data.id);
  };

  const toggleLike = async (postId: string, liked: boolean, postOwnerId?: string) => {
    if (!userId) return;
    if (liked) {
      await supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', userId);
    } else {
      await supabase.from('community_likes').insert({ post_id: postId, user_id: userId });
      if (postOwnerId && postOwnerId !== userId) {
        await supabase.from('community_notifications').insert({
          user_id: postOwnerId, actor_id: userId, type: 'like', post_id: postId,
        } as any);
      }
    }
    fetchPosts();
  };

  const addComment = async (postId: string, content: string, postOwnerId?: string) => {
    if (!userId) return;
    const { data, error } = await supabase.from('community_comments').insert({
      post_id: postId, user_id: userId, content,
    }).select('id').single();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    if (postOwnerId && postOwnerId !== userId) {
      await supabase.from('community_notifications').insert({
        user_id: postOwnerId, actor_id: userId, type: 'comment', post_id: postId, comment_id: data?.id,
      } as any);
    }
    if (data?.id) await sendMentionNotifications(content, userId, postId, data.id, postOwnerId ? [postOwnerId] : []);
  };

  const deletePost = async (postId: string) => {
    await supabase.from('community_posts').delete().eq('id', postId);
    fetchPosts();
  };

  const updatePost = async (postId: string, title: string, content: string) => {
    const { error } = await supabase.from('community_posts').update({ title, content, updated_at: new Date().toISOString() }).eq('id', postId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else fetchPosts();
  };

  // Derived: filter blocked + sort + search
  const visiblePosts = (() => {
    let list = posts.filter(p => !blockedIds.has(p.user_id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q) || p.username?.toLowerCase().includes(q));
    }
    if (tagFilter) list = list.filter(p => p.tags?.includes(tagFilter));
    if (sort === 'top') list.sort((a, b) => b.like_count - a.like_count);
    else if (sort === 'hot') list.sort((a, b) => (b.like_count + b.comment_count * 2) - (a.like_count + a.comment_count * 2));
    return list;
  })();

  const allTags = [...new Set(posts.flatMap(p => p.tags || []))].slice(0, 20);

  return {
    posts: visiblePosts, allTags, loading,
    search, setSearch, sort, setSort, tagFilter, setTagFilter,
    createPost, toggleLike, addComment, deletePost, updatePost, refreshPosts: fetchPosts,
  };
}

export function usePostDetail(postId: string, userId: string | undefined) {
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    supabase.from('community_blocks' as any).select('blocked_id').eq('blocker_id', userId).then(({ data }) => {
      setBlockedIds(new Set((data as any[] | null)?.map(b => b.blocked_id) || []));
    });
  }, [userId]);

  const fetchPost = useCallback(async () => {
    if (!userId || !postId) return;
    const { data } = await supabase.from('community_posts').select('*').eq('id', postId).single();
    if (!data) { setLoading(false); return; }

    const [{ data: profile }, { data: likes }, { data: rawComments }] = await Promise.all([
      supabase.from('profiles').select('username, avatar_url').eq('user_id', data.user_id).single(),
      supabase.from('community_likes').select('user_id').eq('post_id', postId),
      supabase.from('community_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true }),
    ]);

    const commentUserIds = [...new Set(rawComments?.map(c => c.user_id) || [])];
    const commentIds = rawComments?.map(c => c.id) || [];
    const [{ data: commentProfiles }, { data: commentLikes }] = await Promise.all([
      supabase.from('profiles').select('user_id, username, avatar_url, banned').in('user_id', commentUserIds),
      commentIds.length
        ? supabase.from('community_comment_likes').select('comment_id, user_id').in('comment_id', commentIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const profileMap = new Map(commentProfiles?.map(p => [p.user_id, p]) || []);

    const commentLikeCount = new Map<string, number>();
    const commentUserLiked = new Map<string, boolean>();
    commentLikes?.forEach((l: any) => {
      commentLikeCount.set(l.comment_id, (commentLikeCount.get(l.comment_id) || 0) + 1);
      if (l.user_id === userId) commentUserLiked.set(l.comment_id, true);
    });

    setPost({
      ...data,
      tags: (data as any).tags || [],
      view_count: (data as any).view_count || 0,
      username: profile?.username || 'Anonymous',
      avatar_url: (profile as any)?.avatar_url || null,
      like_count: likes?.length || 0,
      comment_count: rawComments?.length || 0,
      user_liked: likes?.some(l => l.user_id === userId) || false,
    });

    setComments((rawComments || [])
      .filter(c => !blockedIds.has(c.user_id) && !(profileMap.get(c.user_id) as any)?.banned)
      .map(c => ({
        ...c,
        username: profileMap.get(c.user_id)?.username || 'Anonymous',
        avatar_url: (profileMap.get(c.user_id) as any)?.avatar_url || null,
        like_count: commentLikeCount.get(c.id) || 0,
        user_liked: commentUserLiked.get(c.id) || false,
      })));
    setLoading(false);
  }, [postId, userId, blockedIds]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  useEffect(() => {
    const channel = supabase
      .channel(`post-${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_comments', filter: `post_id=eq.${postId}` }, () => fetchPost())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_comment_likes' }, () => fetchPost())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_likes', filter: `post_id=eq.${postId}` }, () => fetchPost())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, fetchPost]);

  const toggleCommentLike = async (commentId: string, liked: boolean) => {
    if (!userId) return;
    if (liked) {
      await supabase.from('community_comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId);
    } else {
      await supabase.from('community_comment_likes').insert({ comment_id: commentId, user_id: userId } as any);
    }
    fetchPost();
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from('community_comments').delete().eq('id', commentId);
    fetchPost();
  };

  return { post, comments, loading, refreshPost: fetchPost, toggleCommentLike, deleteComment };
}

export function useNotifications(userId: string | undefined) {
  const [items, setItems] = useState<any[]>([]);

  const fetch = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('community_notifications' as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (!data) return;
    const actorIds = [...new Set(data.map((n: any) => n.actor_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, username, avatar_url').in('user_id', actorIds);
    const map = new Map(profiles?.map(p => [p.user_id, p]) || []);
    setItems(data.map((n: any) => ({ ...n, actor: map.get(n.actor_id) })));
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notif-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_notifications', filter: `user_id=eq.${userId}` }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId, fetch]);

  const markAllRead = async () => {
    if (!userId) return;
    await supabase.from('community_notifications' as any).update({ read: true }).eq('user_id', userId).eq('read', false);
    fetch();
  };

  const unreadCount = items.filter(n => !n.read).length;
  return { items, unreadCount, markAllRead, refresh: fetch };
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;
    supabase.from('profiles').select('*').eq('user_id', userId).single().then(({ data }) => {
      setProfile(data);
      setLoading(false);
    });
  }, [userId]);

  const update = async (patch: { username?: string; bio?: string; avatar_url?: string }) => {
    if (!userId) return;
    const { error } = await supabase.from('profiles').update(patch).eq('user_id', userId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Profile updated' });
      setProfile((p: any) => ({ ...p, ...patch }));
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!userId) return null;
    const path = `${userId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) { toast({ title: 'Upload failed', description: error.message, variant: 'destructive' }); return null; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    await update({ avatar_url: data.publicUrl });
    return data.publicUrl;
  };

  return { profile, loading, update, uploadAvatar };
}
