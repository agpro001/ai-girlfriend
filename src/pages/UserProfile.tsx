import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, ShieldAlert, ShieldOff, Calendar, Heart, MessageSquare, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBlocks } from '@/hooks/useBlocks';
import { useCommunity, type CommunityPost } from '@/hooks/useCommunity';
import UserAvatar from '@/components/UserAvatar';
import CommunityCard from '@/components/CommunityCard';
import CountryFlag3D from '@/components/CountryFlag3D';
import BottomNav from '@/components/BottomNav';
import FallingPetals from '@/components/FallingPetals';
import { format } from 'date-fns';
import { getCountry } from '@/lib/countries';

interface Profile {
  user_id: string; username: string | null; bio: string | null; avatar_url: string | null;
  created_at: string; country: string | null; banned: boolean;
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { blockedIds, block, unblock } = useBlocks(user?.id);
  const c = useCommunity(user?.id);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, likes: 0, comments: 0 });

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    (async () => {
      const { data: prof } = await supabase
        .from('profiles')
        .select('user_id, username, bio, avatar_url, created_at, country, banned')
        .eq('username', username)
        .maybeSingle();
      if (!prof) { setLoading(false); return; }
      setProfile(prof as any);
      const [{ count: postCount }, { data: posts }, { count: commentCount }] = await Promise.all([
        supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('user_id', prof.user_id),
        supabase.from('community_posts').select('id').eq('user_id', prof.user_id),
        supabase.from('community_comments').select('id', { count: 'exact', head: true }).eq('user_id', prof.user_id),
      ]);
      const postIds = posts?.map(p => p.id) || [];
      const { count: likeCount } = postIds.length
        ? await supabase.from('community_likes').select('id', { count: 'exact', head: true }).in('post_id', postIds)
        : { count: 0 };
      setStats({ posts: postCount || 0, likes: likeCount || 0, comments: commentCount || 0 });
      setLoading(false);
    })();
  }, [username]);

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
      <p className="text-foreground font-display tracking-wider">User not found</p>
      <Link to="/community"><Button variant="outline" size="sm">Back to Community</Button></Link>
    </div>
  );

  const isSelf = user?.id === profile.user_id;
  const isBlocked = blockedIds.has(profile.user_id);
  const userPosts = c.posts.filter(p => p.user_id === profile.user_id);
  const country = getCountry(profile.country);

  return (
    <div className="min-h-screen bg-background relative pb-24">
      <FallingPetals />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(280,100%,65%,0.06),transparent_60%)]" />

      <header className="relative z-10 flex items-center gap-3 p-4 border-b border-border/50 sticky top-0 bg-background/60 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
        <h1 className="font-display text-sm tracking-wider text-foreground flex-1">@{profile.username}</h1>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto p-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 space-y-4 neon-border"
        >
          <div className="flex items-start gap-4">
            <UserAvatar src={profile.avatar_url} username={profile.username || ''} size="lg" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-display text-xl text-foreground tracking-wider">@{profile.username}</h2>
                {profile.banned && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> BANNED
                  </span>
                )}
                {country && <CountryFlag3D code={profile.country} size="sm" />}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Calendar className="w-3 h-3" /> Joined {format(new Date(profile.created_at), 'MMM yyyy')}
              </p>
              {country && (
                <p className="text-[10px] text-muted-foreground mt-0.5">{country.name}</p>
              )}
            </div>
          </div>

          {profile.bio && <p className="text-sm text-foreground/80 whitespace-pre-wrap">{profile.bio}</p>}

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30">
            <Stat icon={FileText} label="Posts" value={stats.posts} />
            <Stat icon={Heart} label="Likes" value={stats.likes} />
            <Stat icon={MessageSquare} label="Comments" value={stats.comments} />
          </div>

          {!isSelf && user && (
            <Button
              onClick={() => isBlocked ? unblock(profile.user_id) : block(profile.user_id)}
              variant={isBlocked ? 'outline' : 'destructive'}
              size="sm"
              className="w-full font-display text-xs tracking-wider"
            >
              {isBlocked ? <><ShieldOff className="w-3.5 h-3.5 mr-2" />UNBLOCK</> : <><ShieldAlert className="w-3.5 h-3.5 mr-2" />BLOCK USER</>}
            </Button>
          )}
        </motion.div>

        <div className="space-y-3">
          <h3 className="font-display text-xs tracking-wider text-muted-foreground">POSTS ({userPosts.length})</h3>
          {userPosts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No posts yet.</p>
          ) : userPosts.map(post => (
            <CommunityCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              onLike={c.toggleLike}
              onDelete={post.user_id === user?.id ? c.deletePost : undefined}
              onTagClick={(t) => navigate(`/community?tag=${t}`)}
            />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 py-2 rounded-lg bg-muted/30">
      <Icon className="w-3.5 h-3.5 text-primary" />
      <span className="font-display text-sm text-foreground">{value}</span>
      <span className="text-[9px] text-muted-foreground tracking-wider uppercase">{label}</span>
    </div>
  );
}
