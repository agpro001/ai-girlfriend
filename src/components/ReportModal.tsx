import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  targetType: 'post' | 'comment';
  targetId: string;
}

const REASONS = [
  { id: 'spam', label: 'Spam or scam' },
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'nsfw', label: 'Inappropriate / NSFW content' },
  { id: 'hate', label: 'Hate speech' },
  { id: 'underage', label: 'Underage user / content' },
  { id: 'other', label: 'Other' },
];

export default function ReportModal({ open, onOpenChange, targetType, targetId }: Props) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!user || !reason) return;
    setSubmitting(true);
    const { error } = await supabase.from('community_reports' as any).insert({
      reporter_id: user.id, target_type: targetType, target_id: targetId, reason, details: details.trim() || null,
    });
    setSubmitting(false);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Report submitted', description: 'Our moderators will review it shortly.' });
      setReason(''); setDetails(''); onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-border/50">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-foreground flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-neon-red" /> Report {targetType}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            {REASONS.map(r => (
              <button
                key={r.id}
                onClick={() => setReason(r.id)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${reason === r.id ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            placeholder="Optional: add more context..."
            maxLength={500}
            className="bg-muted border-border min-h-[80px] text-xs"
          />
          <Button onClick={submit} disabled={!reason || submitting} className="w-full font-display tracking-wider">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'SUBMIT REPORT'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
