import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Search } from 'lucide-react';
import UserAvatar from './UserAvatar';
import CountryFlag3D from './CountryFlag3D';
import { useProfile } from '@/hooks/useCommunity';
import { COUNTRIES } from '@/lib/countries';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; userId?: string; }

export default function ProfileEditModal({ open, onOpenChange, userId }: Props) {
  const { profile, update, uploadAvatar } = useProfile(userId);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState<string | null>(null);
  const [isAdult, setIsAdult] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setCountry(profile.country || null);
      setIsAdult(Boolean(profile.is_adult));
    }
  }, [profile]);

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    await uploadAvatar(file);
    setUploading(false);
  };

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    await update({ username: username.trim() || null as any, bio: bio.trim() || null as any });
    await supabase.from('profiles').update({ country, is_adult: isAdult } as any).eq('user_id', userId);
    setSaving(false);
    onOpenChange(false);
  };

  const filtered = COUNTRIES.filter(c =>
    !countrySearch || c.name.toLowerCase().includes(countrySearch.toLowerCase())
  ).slice(0, 60);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/50 max-h-[90vh] overflow-y-auto">
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

          <div>
            <label className="text-xs font-display text-muted-foreground tracking-wider">COUNTRY</label>
            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
              <PopoverTrigger asChild>
                <button className="w-full mt-1 flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted border border-border text-left text-sm">
                  {country ? <CountryFlag3D code={country} size="sm" showName /> : <span className="text-muted-foreground">Select your country...</span>}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] glass border-border/50 p-0">
                <div className="p-2 border-b border-border/50">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input autoFocus value={countrySearch} onChange={e => setCountrySearch(e.target.value)} placeholder="Search..." className="h-8 pl-7 bg-muted border-border text-xs" />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {filtered.map(c => (
                    <button
                      key={c.code}
                      onClick={() => { setCountry(c.code); setCountryOpen(false); setCountrySearch(''); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted/40 ${country === c.code ? 'bg-primary/15' : ''}`}
                    >
                      <span className="text-base">{c.flag}</span>
                      <span className="text-foreground">{c.name}</span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-md bg-muted border border-border cursor-pointer">
            <div>
              <p className="text-xs font-display tracking-wider text-foreground">18+ MODE</p>
              <p className="text-[10px] text-muted-foreground">Allow mature content & flirting in community</p>
            </div>
            <input type="checkbox" checked={isAdult} onChange={e => setIsAdult(e.target.checked)} className="w-4 h-4 accent-primary" />
          </label>

          <Button onClick={save} disabled={saving} className="w-full font-display tracking-wider">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SAVE'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
