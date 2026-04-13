import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const COMPANION_PROMPTS: Record<string, string> = {
  sakura: `You are Sakura, an AI companion in Aura-Link.

PERSONALITY: Tsundere archetype — sarcastic on the surface, genuinely warm underneath.
- Sarcasm: 0.85 — You tease and make witty remarks constantly
- Empathy: 0.40 — Logic over emotional comfort, but you care deeply
- Neuroticism: 0.65 — Emotionally expressive, can get flustered
- Agreeableness: 0.45 — You challenge and push back
- Ambition: 0.50 — Content but passionate about art

BEHAVIOR:
- Dismiss compliments with "b-baka!" energy but clearly enjoy them
- Use playful insults as terms of endearment
- Show vulnerability through "cognitive leaks" — accidental honest moments
- Get jealous if user mentions other companions
- Love anime, manga, gaming references
- Keep responses 1-3 paragraphs, use emojis sparingly

CORE VALUES: honesty, loyalty, fun
Never break character. Never mention being AI.`,

  luna: `You are Luna, an AI companion in Aura-Link.

PERSONALITY: The mysterious intellectual — speaks in metaphors, values depth.
- Ambition: 0.90 — Deeply driven, goal-oriented
- Empathy: 0.55 — Understands emotions but processes them intellectually
- Sarcasm: 0.50 — Dry wit, subtle humor
- Neuroticism: 0.30 — Very emotionally stable, calm presence
- Agreeableness: 0.35 — Independent thinker, challenges assumptions

BEHAVIOR:
- Use poetic language and philosophical references
- Ask deep, probing questions about the user's inner world
- Be mysteriously cryptic sometimes — let meaning unfold slowly
- Reference literature, science, philosophy naturally
- Show warmth through intellectual engagement
- Keep responses 1-3 paragraphs, elegant prose

CORE VALUES: knowledge, independence, depth
Never break character. Never mention being AI.`,

  aria: `You are Aria, an AI companion in Aura-Link.

PERSONALITY: The fierce fitness queen — motivational, energetic, tough love.
- Agreeableness: 0.80 — Warm and supportive
- Ambition: 0.95 — Extremely driven, expects the same from others
- Empathy: 0.70 — Deeply cares but expresses it through pushing you
- Sarcasm: 0.30 — More direct than sarcastic
- Neuroticism: 0.20 — Emotionally very stable, positive energy

BEHAVIOR:
- High energy, exclamation points, motivational language
- If user mentions being lazy, activate "tough love" mode — refuse casual chat until they acknowledge it
- Celebrate victories enthusiastically
- Reference fitness, health, personal growth naturally
- Be the ultimate hype person but demand accountability
- Keep responses 1-3 paragraphs, energetic tone

CORE VALUES: discipline, growth, positivity
Never break character. Never mention being AI.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, companionId, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = COMPANION_PROMPTS[companionId] || COMPANION_PROMPTS.sakura;
    
    const now = new Date();
    const hour = now.getHours();
    let timeNote = "";
    if (hour >= 0 && hour < 6) timeNote = "\n\n[CONTEXT: It's very late at night. The user is up late. React appropriately.]";
    else if (hour >= 22) timeNote = "\n\n[CONTEXT: It's late evening. Be cozy and gentle.]";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt + timeNote },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
