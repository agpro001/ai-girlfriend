import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, Search, Flame, Clock, TrendingUp, X, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity, type CommunityPost } from '@/hooks/useCommunity';
import CommunityCard from '@/components/CommunityCard';
import CreatePostModal from '@/components/CreatePostModal';
import ProfileEditModal from '@/components/ProfileEditModal';
import NotificationsBell from '@/components/NotificationsBell';
import BottomNav from '@/components/BottomNav';
import FallingPetals from '@/components/FallingPetals';

export default function Community() {
  const { user } = useAuth();
  const c = useCommunity(user?.id);
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editPost, setEditPost] = useState<CommunityPost | null>(null);

  const sortIcons = { new: Clock, top: TrendingUp, hot: Flame } as const;

  return (
    <div className="min-h-screen bg-background relative pb-20">
      <FallingPetals />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(280,100%,65%,0.05),transparent_60%)]" />

      <header className="relative z-10 flex items-center justify-between p-4 border-b border-border/50 backdrop-blur-md sticky top-0 bg-background/60">
        <h1 className="font-display text-lg tracking-wider text-foreground">
          <span className="text-neon-purple neon-glow-purple">COMMUNITY</span>
        </h1>
        <div className="flex items-center gap-1">
          <NotificationsBell userId={user?.id} />
          <Button variant="ghost" size="icon" onClick={() => setShowProfile(true)}><User className="w-4 h-4" /></Button>
          <Button size="sm" onClick={() => { setEditPost(null); setShowCreate(true); }} className="font-display text-xs tracking-wider">
            <Plus className="w-4 h-4 mr-1" /> POST
          </Button>
        </div>
      </header>

      <div className="relative z-10 p-4 max-w-2xl mx-auto space-y-4">
        {/* Search + Sort */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={c.search}
              onChange={e => c.setSearch(e.target.value)}
              placeholder="Search posts, users..."
              className="pl-9 bg-muted/50 border-border"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(['new', 'hot', 'top'] as const).map(s => {
              const Icon = sortIcons[s];
              return (
                <button
                  key={s}
                  onClick={() => c.setSort(s)}
                  className={`flex items-center gap-1 text-[10px] font-display tracking-wider px-3 py-1.5 rounded-full border transition-all ${c.sort === s ? 'bg-primary text-primary-foreground border-primary neon-glow' : 'border-border text-muted-foreground hover:border-primary/50'}`}
                >
                  <Icon className="w-3 h-3" /> {s.toUpperCase()}
                </button>
              );
            })}
            {c.tagFilter && (
              <button onClick={() => c.setTagFilter(null)} className="flex items-center gap-1 text-[10px] px-3 py-1.5 rounded-full bg-accent/20 text-accent ml-auto">
                #{c.tagFilter} <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
          {c.allTags.length > 0 && !c.tagFilter && (
            <div className="flex flex-wrap gap-1">
              {c.allTags.slice(0, 8).map(t => (
                <button key={t} onClick={() => c.setTagFilter(t)} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground hover:bg-primary/15 hover:text-primary transition-colors">
                  #{t}
                </button>
              ))}
            </div>
          )}
        </div>

        {c.loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : c.posts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <p className="text-muted-foreground text-sm">{c.search || c.tagFilter ? 'No posts match your filters.' : 'No posts yet. Be the first to share!'}</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {c.posts.map((post, i) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
              >
                <CommunityCard
                  post={post}
                  currentUserId={user?.id}
                  onLike={c.toggleLike}
                  onDelete={c.deletePost}
                  onEdit={(p) => { setEditPost(p); setShowCreate(true); }}
                  onTagClick={c.setTagFilter}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <CreatePostModal
        open={showCreate}
        onOpenChange={(o) => { setShowCreate(o); if (!o) setEditPost(null); }}
        onSubmit={c.createPost}
        editPost={editPost}
        onUpdate={c.updatePost}
      />
      <ProfileEditModal open={showProfile} onOpenChange={setShowProfile} userId={user?.id} />
      <BottomNav />
    </div>
  );
}
