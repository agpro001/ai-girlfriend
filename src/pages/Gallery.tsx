import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Gallery() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 p-4 border-b border-border/50">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <h1 className="font-display text-sm tracking-wider text-foreground">GALLERY</h1>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
          <h2 className="font-display text-lg tracking-wider text-foreground mb-2">No images yet</h2>
          <p className="text-muted-foreground text-sm">Chat with your companions and generate images to fill your gallery!</p>
        </motion.div>
      </div>
    </div>
  );
}
