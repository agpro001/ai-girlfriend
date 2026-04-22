import { motion } from 'framer-motion';
import { getCountry } from '@/lib/countries';

interface Props {
  code?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
}

const SIZES = { sm: 'text-2xl', md: 'text-4xl', lg: 'text-6xl' };

/** 3D-style animated country flag using CSS perspective + emoji. */
export default function CountryFlag3D({ code, size = 'md', showName }: Props) {
  const country = getCountry(code);
  if (!country) return null;

  return (
    <div className="inline-flex items-center gap-2">
      <motion.span
        className={`${SIZES[size]} inline-block`}
        style={{ transformStyle: 'preserve-3d', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))' }}
        initial={{ rotateY: -180, opacity: 0 }}
        animate={{
          rotateY: [0, 15, -15, 0],
          rotateX: [0, -8, 8, 0],
          opacity: 1,
        }}
        transition={{
          rotateY: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          rotateX: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          opacity: { duration: 0.4 },
        }}
        whileHover={{ scale: 1.2, rotateZ: 8 }}
      >
        {country.flag}
      </motion.span>
      {showName && (
        <span className="text-xs font-display tracking-wider text-foreground">{country.name}</span>
      )}
    </div>
  );
}
