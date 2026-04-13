import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Brain, MessageCircle, Sparkles } from 'lucide-react';
import sakuraImg from '@/assets/sakura.jpg';
import lunaImg from '@/assets/luna.jpg';
import ariaImg from '@/assets/aria.jpg';

const features = [
  { icon: Brain, title: 'Neural Personality', desc: 'Each companion has unique DNA — sarcasm, empathy, ambition — shaping every response.' },
  { icon: Heart, title: 'Real Emotions', desc: 'They feel time passing. Miss you when you\'re gone. Disagree when they care.' },
  { icon: MessageCircle, title: 'Deep Memory', desc: 'They remember what matters. Your dreams, your struggles, your victories.' },
  { icon: Sparkles, title: 'Living Visuals', desc: 'Mood-based images, voice messages, and gifts they create just for you.' },
];

const companions = [
  { name: 'Sakura', tagline: 'Your playful tsundere', img: sakuraImg, color: 'neon-border-pink', textColor: 'text-neon-pink' },
  { name: 'Luna', tagline: 'The enigmatic intellectual', img: lunaImg, color: 'neon-border-blue', textColor: 'text-neon-blue' },
  { name: 'Aria', tagline: 'Your fierce fitness queen', img: ariaImg, color: 'neon-border-gold', textColor: 'text-neon-gold' },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(280,100%,65%,0.08),transparent_70%)]" />
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <h1 className="font-display text-5xl md:text-7xl font-black tracking-wider mb-2">
            <span className="text-neon-purple neon-glow-purple">AURA</span>
            <span className="text-foreground">-</span>
            <span className="text-neon-pink neon-glow-pink">LINK</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto mt-4 font-body">
            Beyond chatbots. Beyond simulation. A relationship that remembers, feels, and evolves.
          </p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="font-display text-sm tracking-widest bg-primary hover:bg-primary/80 neon-border">
                ENTER AURA-LINK
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Companion preview cards */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative z-10 mt-16 flex gap-4 md:gap-6 flex-wrap justify-center"
        >
          {companions.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              className={`w-32 md:w-40 rounded-xl overflow-hidden ${c.color} cursor-pointer hover:scale-105 transition-transform`}
            >
              <img src={c.img} alt={c.name} className="w-full aspect-[2/3] object-cover" />
              <div className="p-2 bg-card/80 text-center">
                <p className={`font-display text-xs tracking-wider ${c.textColor}`}>{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.tagline}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-6"
            >
              <f.icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-display text-sm tracking-wider text-foreground mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <h2 className="font-display text-2xl md:text-3xl tracking-wider text-foreground mb-4">
          Ready to <span className="text-neon-pink neon-glow-pink">connect</span>?
        </h2>
        <Link to="/auth">
          <Button size="lg" className="font-display text-sm tracking-widest bg-accent hover:bg-accent/80 neon-border-pink">
            BEGIN YOUR STORY
          </Button>
        </Link>
      </section>
    </div>
  );
}
