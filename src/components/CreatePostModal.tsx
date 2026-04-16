import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ImagePlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string, content: string, imageUrl?: string) => Promise<void>;
}

export default function CreatePostModal({ open, onOpenChange, onSubmit }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('community-images').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('community-images').getPublicUrl(path);
      setImageUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    await onSubmit(title.trim(), content.trim(), imageUrl);
    setTitle('');
    setContent('');
    setImageUrl(undefined);
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/50">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-foreground">Create Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="bg-muted border-border" />
          <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What's on your mind?" className="bg-muted border-border min-h-[120px]" />
          {imageUrl && <img src={imageUrl} alt="" className="rounded-lg max-h-32 object-cover" />}
          <div className="flex items-center gap-2">
            <label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                Add Image
              </div>
            </label>
          </div>
          <Button onClick={handleSubmit} disabled={submitting || !title.trim() || !content.trim()} className="w-full font-display tracking-wider">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'POST'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
