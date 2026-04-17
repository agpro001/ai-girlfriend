import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ImagePlus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { CommunityPost } from '@/hooks/useCommunity';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (title: string, content: string, imageUrl?: string, tags?: string[]) => Promise<void>;
  editPost?: CommunityPost | null;
  onUpdate?: (postId: string, title: string, content: string) => Promise<void>;
}

export default function CreatePostModal({ open, onOpenChange, onSubmit, editPost, onUpdate }: Props) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editPost) { setTitle(editPost.title); setContent(editPost.content); setTags(editPost.tags || []); setImageUrl(editPost.image_url || undefined); }
    else if (open) { setTitle(''); setContent(''); setTags([]); setImageUrl(undefined); setTagInput(''); }
  }, [editPost, open]);

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

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (t && !tags.includes(t) && tags.length < 5) setTags([...tags, t]);
    setTagInput('');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    if (editPost && onUpdate) await onUpdate(editPost.id, title.trim(), content.trim());
    else await onSubmit(title.trim(), content.trim(), imageUrl, tags);
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/50 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-foreground">{editPost ? 'Edit Post' : 'Create Post'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" maxLength={120} className="bg-muted border-border" />
          <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What's on your mind?" maxLength={2000} className="bg-muted border-border min-h-[140px]" />
          <p className="text-[10px] text-muted-foreground text-right">{content.length}/2000</p>

          {!editPost && (
            <>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add a tag (max 5)" className="bg-muted border-border" />
                <Button type="button" variant="secondary" onClick={addTag} disabled={tags.length >= 5}>Add</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-1 rounded-full bg-primary/15 text-primary flex items-center gap-1">
                      #{t} <button onClick={() => setTags(tags.filter(x => x !== t))}><X className="w-2.5 h-2.5" /></button>
                    </span>
                  ))}
                </div>
              )}

              {imageUrl && (
                <div className="relative">
                  <img src={imageUrl} alt="" className="rounded-lg max-h-40 w-full object-cover" />
                  <button onClick={() => setImageUrl(undefined)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center"><X className="w-3 h-3" /></button>
                </div>
              )}
              <label className="cursor-pointer inline-flex">
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                <span className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                  {imageUrl ? 'Change Image' : 'Add Image'}
                </span>
              </label>
            </>
          )}

          <Button onClick={handleSubmit} disabled={submitting || !title.trim() || !content.trim()} className="w-full font-display tracking-wider">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (editPost ? 'UPDATE' : 'POST')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
