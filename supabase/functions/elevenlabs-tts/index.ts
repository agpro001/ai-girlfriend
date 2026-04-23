import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Per-personality base voice tuning
const PERSONALITY_PRESETS: Record<string, { stability: number; similarity_boost: number; style: number; speed: number }> = {
  sakura:  { stability: 0.35, similarity_boost: 0.78, style: 0.65, speed: 1.05 }, // playful tsundere
  luna:    { stability: 0.75, similarity_boost: 0.80, style: 0.30, speed: 0.95 }, // calm intellectual
  aria:    { stability: 0.55, similarity_boost: 0.85, style: 0.45, speed: 1.10 }, // energetic coach
  yuki:    { stability: 0.30, similarity_boost: 0.82, style: 0.75, speed: 0.92 }, // sensual, breathy
};

const DEFAULT_PRESET = { stability: 0.5, similarity_boost: 0.75, style: 0.4, speed: 1.0 };

// Mood adjustments applied on top of personality preset
function applyMood(base: { stability: number; similarity_boost: number; style: number; speed: number }, mood?: string) {
  const s = { ...base };
  switch (mood) {
    case "seductive":
    case "intimate":
    case "passionate":
      s.style = Math.min(1, s.style + 0.15);
      s.stability = Math.max(0, s.stability - 0.1);
      s.speed = Math.max(0.7, s.speed - 0.08);
      break;
    case "excited":
    case "playful":
    case "happy":
      s.speed = Math.min(1.2, s.speed + 0.08);
      s.stability = Math.max(0, s.stability - 0.1);
      s.style = Math.min(1, s.style + 0.1);
      break;
    case "sad":
    case "worried":
      s.speed = Math.max(0.7, s.speed - 0.1);
      s.stability = Math.min(1, s.stability + 0.15);
      s.style = Math.max(0, s.style - 0.1);
      break;
    case "angry":
      s.stability = Math.max(0, s.stability - 0.2);
      s.style = Math.min(1, s.style + 0.2);
      s.speed = Math.min(1.2, s.speed + 0.05);
      break;
    case "romantic":
      s.style = Math.min(1, s.style + 0.1);
      s.speed = Math.max(0.7, s.speed - 0.05);
      break;
    case "jealous":
      s.stability = Math.max(0, s.stability - 0.15);
      s.style = Math.min(1, s.style + 0.1);
      break;
  }
  return s;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, voiceId, personality, mood } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({ error: "ElevenLabs API key not configured." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const base = (personality && PERSONALITY_PRESETS[personality]) || DEFAULT_PRESET;
    const settings = applyMood(base, mood);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || "EXAVITQu4vr4xnSDxMaL"}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.slice(0, 1000),
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: settings.stability,
            similarity_boost: settings.similarity_boost,
            style: settings.style,
            use_speaker_boost: true,
            speed: settings.speed,
          },
        }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("ElevenLabs error:", response.status, t);
      let msg = "TTS failed";
      if (response.status === 401) msg = "Invalid ElevenLabs API key";
      else if (response.status === 429) msg = "ElevenLabs quota exceeded";
      return new Response(JSON.stringify({ error: msg }), {
        status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
    });
  } catch (e) {
    console.error("tts error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
