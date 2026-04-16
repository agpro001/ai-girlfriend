import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCommunity } from '@/hooks/useCommunity';
import CommunityCard from '@/components/CommunityCard';
import CreatePostModal from '@/components/CreatePostModal';
import BottomNav from '@/components/BottomNav';
import FallingPetals from '@/components/FallingPetals';

export default function Community() {
  const { user } = useAuth();
  const { posts, loading, createPost, toggleLike } = useCommunity(user?.id);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="min-h-screen bg-background relative pb-16">
      <FallingPetals />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(280,100%,65%,0.05),transparent_60%)]" />

      <header className="relative z-10 flex items-center justify-between p-4 border-b border-border/50">
        <h1 className="font-display text-lg tracking-wider text-foreground">
          <span className="text-neon-purple neon-glow-purple">COMMUNITY</span>
        </h1>
        <Button size="sm" onClick={() => setShowCreate(true)} className="font-display text-xs tracking-wider">
          <Plus className="w-4 h-4 mr-1" /> POST
        </Button>
      </header>

      <div className="relative z-10 p-4 max-w-2xl mx-auto space-y-4">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <p className="text-muted-foreground text-sm">No posts yet. Be the first to share!</p>
          </motion.div>
        ) : (
          posts.map((post, i) => (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <CommunityCard post={post} onLike={toggleLike} />
            </motion.div>
          ))
        )}
      </div>

      <CreatePostModal open={showCreate} onOpenChange={setShowCreate} onSubmit={createPost} />
      <BottomNav />
    </div>
  );
}
