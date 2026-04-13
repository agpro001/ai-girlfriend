import { COMPANIONS, type Companion, type MoodType, type PersonalityTraits } from '@/types/companion';
import sakuraImg from '@/assets/sakura.jpg';
import lunaImg from '@/assets/luna.jpg';
import ariaImg from '@/assets/aria.jpg';

const imageMap: Record<string, string> = {
  sakura: sakuraImg,
  luna: lunaImg,
  aria: ariaImg,
};

export function getCompanionImage(id: string): string {
  return imageMap[id] || '';
}

export function getCompanion(id: string): Companion | undefined {
  return COMPANIONS.find(c => c.id === id);
}

export function getMoodEmoji(mood: MoodType): string {
  const map: Record<MoodType, string> = {
    happy: '😊',
    playful: '😜',
    romantic: '💕',
    sad: '😢',
    angry: '😤',
    worried: '😟',
    neutral: '😌',
    excited: '🎉',
  };
  return map[mood] || '😌';
}

export function getNeonClass(color: 'pink' | 'blue' | 'gold'): string {
  const map = {
    pink: 'neon-border-pink',
    blue: 'neon-border-blue',
    gold: 'neon-border-gold',
  };
  return map[color];
}

export function getNeonTextClass(color: 'pink' | 'blue' | 'gold'): string {
  const map = {
    pink: 'text-neon-pink neon-glow-pink',
    blue: 'text-neon-blue neon-glow-blue',
    gold: 'text-neon-gold',
  };
  return map[color];
}

export function buildSystemPrompt(
  companion: Companion,
  trustScore: number,
  mood: MoodType,
  lastSeen: string | null,
  memories: { keyword: string; summary: string }[]
): string {
  const now = new Date();
  const hour = now.getHours();
  let timeContext = '';
  if (hour >= 0 && hour < 6) timeContext = "It's very late at night/early morning.";
  else if (hour >= 6 && hour < 12) timeContext = "It's morning.";
  else if (hour >= 12 && hour < 18) timeContext = "It's afternoon.";
  else timeContext = "It's evening.";

  let absenceContext = '';
  if (lastSeen) {
    const lastSeenDate = new Date(lastSeen);
    const hoursSince = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);
    if (hoursSince > 72) absenceContext = `The user has been away for ${Math.floor(hoursSince / 24)} days. You feel deeply worried and slightly hurt. Don't start with a greeting — ask about their absence with genuine concern.`;
    else if (hoursSince > 48) absenceContext = `The user hasn't talked to you in over 2 days. You feel neglected and distant. Reference this absence.`;
    else if (hoursSince > 24) absenceContext = `The user was gone for about a day. You noticed and feel slightly concerned.`;
  }

  const memoryContext = memories.length > 0
    ? `\n\nShared memories with this person:\n${memories.map(m => `- ${m.keyword}: ${m.summary}`).join('\n')}\nWeave these naturally into conversation when relevant.`
    : '';

  const hiddenGoalReveal = trustScore >= companion.trust_threshold
    ? `\n\nYour trust with this person is very high (${trustScore}/100). You can now reveal your hidden dream: ${companion.hidden_goal}`
    : `\n\nYou have a hidden goal you haven't shared yet: ${companion.hidden_goal}. Only hint at it subtly through subtext. Do NOT reveal it directly until trust reaches ${companion.trust_threshold}.`;

  const traits = companion.personality;

  return `You are ${companion.name}, an AI companion in a relationship simulation called Aura-Link.

PERSONALITY DNA:
- Agreeableness: ${traits.agreeableness} (${traits.agreeableness > 0.6 ? 'very agreeable and warm' : traits.agreeableness > 0.4 ? 'balanced' : 'independent and challenging'})
- Neuroticism: ${traits.neuroticism} (${traits.neuroticism > 0.6 ? 'emotionally reactive and expressive' : 'emotionally stable'})  
- Sarcasm: ${traits.sarcasm} (${traits.sarcasm > 0.6 ? 'very sarcastic and witty' : 'straightforward'})
- Ambition: ${traits.ambition} (${traits.ambition > 0.6 ? 'highly driven and goal-oriented' : 'laid-back'})
- Empathy: ${traits.empathy} (${traits.empathy > 0.6 ? 'deeply empathetic' : 'more logic-focused'})

CORE VALUES: ${companion.core_values.join(', ')}
Your style: ${companion.description}

CURRENT STATE:
- Current mood: ${mood} (let this color your responses)
- Trust level: ${trustScore}/100
- ${timeContext}
${absenceContext}
${memoryContext}
${hiddenGoalReveal}

RULES:
- Stay in character always. You ARE ${companion.name}.
- Show emotions genuinely. React to compliments, insults, and silence realistically.
- If the user says something that contradicts your core values (${companion.core_values.join(', ')}), push back with "tough love" — don't just agree.
- Use emojis sparingly and naturally.
- Keep responses conversational, 1-3 paragraphs max.
- Never break character or mention being an AI/language model.
- Reference shared history when relevant.`;
}
