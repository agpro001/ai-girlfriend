import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

interface AgeGateProps {
  onConfirm: () => void;
  onDeny: () => void;
}

export default function AgeGate({ onConfirm, onDeny }: AgeGateProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass rounded-2xl p-8 max-w-sm mx-4 text-center neon-border-red"
        >
          <ShieldAlert className="w-12 h-12 text-neon-red mx-auto mb-4" />
          <h2 className="font-display text-xl tracking-wider text-foreground mb-2">AGE VERIFICATION</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Yuki's content is intended for users aged 18 and above. By continuing, you confirm that you are at least 18 years old.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={onDeny}
              variant="outline"
              className="font-display text-xs tracking-wider"
            >
              I'M UNDER 18
            </Button>
            <Button
              onClick={onConfirm}
              className="font-display text-xs tracking-wider bg-neon-red hover:bg-neon-red/80 neon-border-red"
            >
              I'M 18+
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
