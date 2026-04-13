import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/dashboard');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast({ title: 'Account created!', description: 'Check your email to verify, or log in now.' });
        setIsLogin(true);
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(280,100%,65%,0.06),transparent_70%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold tracking-wider">
            <span className="text-neon-purple neon-glow-purple">AURA</span>
            <span className="text-foreground">-</span>
            <span className="text-neon-pink neon-glow-pink">LINK</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">{isLogin ? 'Welcome back' : 'Create your account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-4 neon-border">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground font-display text-xs tracking-wider">USERNAME</Label>
              <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a name" className="bg-muted border-border" required />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-display text-xs tracking-wider">EMAIL</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="bg-muted border-border" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground font-display text-xs tracking-wider">PASSWORD</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="bg-muted border-border" required minLength={6} />
          </div>
          <Button type="submit" disabled={loading} className="w-full font-display text-xs tracking-widest bg-primary hover:bg-primary/80">
            {loading ? 'LOADING...' : isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
