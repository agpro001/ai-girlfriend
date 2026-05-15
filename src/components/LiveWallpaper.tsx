import { motion } from 'framer-motion';

export type WallpaperData = {
  kind: 'static' | 'live';
  preset?: string | null;
  gradient?: string | null;
  primary_color?: string | null;
  accent_color?: string | null;
  image_url?: string | null;
};

export default function LiveWallpaper({ wp, contained = false }: { wp: WallpaperData | null; contained?: boolean }) {
  if (!wp) return null;
  const pos = contained ? 'absolute inset-0' : 'fixed inset-0 -z-10';
  if (wp.kind === 'static') {
    return (
      <div
        className={`${pos} pointer-events-none`}
        style={{
          background: wp.image_url ? `url(${wp.image_url}) center/cover` : (wp.gradient || undefined),
        }}
      />
    );
  }
  const p = wp.primary_color || '#9333ea';
  const a = wp.accent_color || '#ec4899';
  switch (wp.preset) {
    case 'aurora':
      return (
        <div className={`${pos} pointer-events-none overflow-hidden`}>
          <motion.div
            className="absolute -inset-1/2 blur-3xl opacity-50"
            style={{ background: `radial-gradient(circle at 30% 30%, ${p}, transparent 50%), radial-gradient(circle at 70% 60%, ${a}, transparent 55%)` }}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
          />
        </div>
      );
    case 'neon-grid':
      return (
        <div
          className={`${pos} pointer-events-none`}
          style={{
            backgroundColor: '#05050a',
            backgroundImage: `linear-gradient(${p}33 1px, transparent 1px), linear-gradient(90deg, ${a}33 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            animation: 'gridShift 12s linear infinite',
          }}
        >
          <style>{`@keyframes gridShift { from{background-position:0 0,0 0} to{background-position:40px 40px,40px 40px} }`}</style>
        </div>
      );
    case 'particles':
      return (
        <div className={`${pos} pointer-events-none overflow-hidden`}>
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{ backgroundColor: i % 2 ? p : a, left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }}
              animate={{ y: [0, -40, 0], opacity: [0.2, 0.9, 0.2] }}
              transition={{ duration: 4 + (i % 5), repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      );
    case 'matrix':
      return (
        <div className={`${pos} pointer-events-none overflow-hidden`} style={{ background: '#000' }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute font-mono text-xs"
              style={{ left: `${(i * 5) % 100}%`, color: p, textShadow: `0 0 6px ${a}` }}
              initial={{ y: -100 }}
              animate={{ y: '110vh' }}
              transition={{ duration: 6 + (i % 6), repeat: Infinity, delay: i * 0.3, ease: 'linear' }}
            >
              {Array.from({ length: 12 }).map((_, j) => (
                <div key={j}>{String.fromCharCode(0x30a0 + ((i * j) % 96))}</div>
              ))}
            </motion.div>
          ))}
        </div>
      );
    case 'petals':
      return (
        <div className={`${pos} pointer-events-none overflow-hidden`}>
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: i % 2 ? p : a, left: `${(i * 11) % 100}%`, opacity: 0.6 }}
              initial={{ y: -20, rotate: 0 }}
              animate={{ y: '105vh', rotate: 360, x: [0, 20, -20, 0] }}
              transition={{ duration: 10 + (i % 6), repeat: Infinity, delay: i * 0.5, ease: 'linear' }}
            />
          ))}
        </div>
      );
    default:
      return null;
  }
}
