import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Camera } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { useProfile } from '@/hooks/useCommunity';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; userId?: string; }

export default function ProfileEditModal({ open, onOpenChange, userId }: Props) {
  const { profile, update, uploadAvatar } = useProfile(userId);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) { setUsername(profile.username || ''); setBio(profile.bio || ''); }
  }, [profile]);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await uploadAvatar(file);
    setUploading(false);
  };

  const save = async () => {
    setSaving(true);
    await update({ username: username.trim() || null as any, bio: bio.trim() || null as any });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/50">
        <DialogHeader><DialogTitle className="font-display tracking-wider">Edit Profile</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <UserAvatar src={profile?.avatar_url} username={username} size="lg" />
            <label className="cursor-pointer flex items-center gap-1 text-xs text-primary hover:text-primary/80">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              {uploading ? 'Uploading...' : 'Change Avatar'}
            </label>
          </div>
          <div>
            <label className="text-xs font-display text-muted-foreground tracking-wider">USERNAME</label>
            <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="username" maxLength={30} className="bg-muted border-border mt-1" />
          </div>
          <div>
            <label className="text-xs font-display text-muted-foreground tracking-wider">BIO</label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell others about yourself..." maxLength={200} className="bg-muted border-border mt-1" />
            <p className="text-[10px] text-muted-foreground text-right mt-1">{bio.length}/200</p>
          </div>
          <Button onClick={save} disabled={saving} className="w-full font-display tracking-wider">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
