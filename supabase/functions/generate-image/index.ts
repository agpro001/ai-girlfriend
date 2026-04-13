import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, companionId, mood } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const companionStyles: Record<string, string> = {
      sakura: "anime style, pink hair girl, cherry blossom aesthetic, neon cyberpunk lighting",
      luna: "photorealistic, dark haired mysterious woman, blue moonlight, cinematic",
      aria: "digital art, athletic redhead woman, golden warm lighting, dynamic energy",
    };

    const moodStyles: Record<string, string> = {
      happy: "bright, cheerful, vibrant colors, smiling",
      sad: "dim lighting, rainy, melancholic, subdued colors",
      romantic: "warm soft lighting, roses, intimate atmosphere, pink tones",
      angry: "dramatic lighting, intense expression, red tones",
      playful: "colorful, fun, dynamic poses, sparkles",
      neutral: "natural lighting, calm atmosphere",
      worried: "overcast, concerned expression, muted tones",
      excited: "bright neon, dynamic, celebratory, confetti",
    };

    const style = companionStyles[companionId] || companionStyles.sakura;
    const moodStyle = moodStyles[mood] || moodStyles.neutral;

    const imagePrompt = `Create a beautiful illustration: ${prompt}. Style: ${style}. Mood: ${moodStyle}. High quality, detailed, artistic.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: imagePrompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Image gen error:", response.status, t);
      return new Response(JSON.stringify({ error: "Image generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
