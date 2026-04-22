import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import UserAvatar from './UserAvatar';
import { motion, AnimatePresence } from 'framer-motion';

interface Profile { user_id: string; username: string | null; avatar_url: string | null; }

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

/** Comment input with @-mention autocomplete popover. */
export default function MentionAutocomplete({ value, onChange, onSubmit, placeholder, className, autoFocus }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [query, setQuery] = useState<string | null>(null);
  const [caret, setCaret] = useState(0);

  // Detect @token at caret
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? value.length;
    setCaret(pos);
    const left = value.slice(0, pos);
    const m = left.match(/(?:^|\s)@(\w{0,30})$/);
    setQuery(m ? m[1] : null);
  }, [value]);

  // Debounced search
  useEffect(() => {
    if (query === null) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      const q = query.trim();
      let req = supabase.from('profiles').select('user_id, username, avatar_url').not('username', 'is', null).limit(6);
      if (q) req = req.ilike('username', `${q}%`);
      const { data } = await req;
      setSuggestions((data as Profile[] | null) || []);
      setActiveIdx(0);
    }, 150);
    return () => clearTimeout(t);
  }, [query]);

  const insertMention = (username: string) => {
    const left = value.slice(0, caret).replace(/@\w*$/, `@${username} `);
    const right = value.slice(caret);
    const next = left + right;
    onChange(next);
    setQuery(null);
    setSuggestions([]);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      const newPos = left.length;
      inputRef.current?.setSelectionRange(newPos, newPos);
    });
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length && query !== null) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => (i + 1) % suggestions.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => (i - 1 + suggestions.length) % suggestions.length); return; }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const s = suggestions[activeIdx];
        if (s?.username) insertMention(s.username);
        return;
      }
      if (e.key === 'Escape') { setQuery(null); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) { e.preventDefault(); onSubmit(); }
  };

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        onSelect={e => setCaret((e.target as HTMLInputElement).selectionStart ?? 0)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        maxLength={500}
        className={`w-full h-10 rounded-md bg-muted border border-border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${className || ''}`}
      />
      <AnimatePresence>
        {query !== null && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 right-0 z-50 glass rounded-lg border border-border/50 overflow-hidden shadow-2xl"
          >
            {suggestions.map((s, i) => (
              <button
                key={s.user_id}
                type="button"
                onMouseDown={e => { e.preventDefault(); s.username && insertMention(s.username); }}
                onMouseEnter={() => setActiveIdx(i)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${i === activeIdx ? 'bg-primary/15' : 'hover:bg-muted/40'}`}
              >
                <UserAvatar src={s.avatar_url} username={s.username || ''} size="xs" />
                <span className="text-xs font-display text-primary tracking-wider">@{s.username}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
