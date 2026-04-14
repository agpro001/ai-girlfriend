import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ImageIcon, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import FallingPetals from '@/components/FallingPetals';

interface GalleryImage {
  id: string;
  image_url: string;
  content: string;
  created_at: string;
}

export default function Gallery() {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, image_url, content, created_at')
        .eq('user_id', user.id)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false });
      if (data) setImages(data.filter(d => d.image_url) as GalleryImage[]);
      setLoading(false);
    };
    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-background relative">
      <FallingPetals />
      <header className="relative z-10 flex items-center gap-3 p-4 border-b border-border/50">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h1 className="font-display text-sm tracking-wider text-foreground">GALLERY</h1>
      </header>

      <div className="relative z-10 p-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : images.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="font-display text-lg tracking-wider text-foreground mb-2">No images yet</h2>
            <p className="text-muted-foreground text-sm">Chat with your girlfriends and generate images to fill your gallery!</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl overflow-hidden neon-border-pink"
              >
                <img src={img.image_url} alt={img.content} className="w-full aspect-square object-cover" loading="lazy" />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
