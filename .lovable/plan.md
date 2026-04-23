# Add ElevenLabs API Key & Voice Improvements

## What's Happening

You've shared an ElevenLabs API key. I'll store it securely as a backend secret (never in code) so the voice features for all your girlfriends work properly. While doing this, I'll also upgrade the voice system since right now it's quite basic.

## Security Note

I will NOT paste the key into any file. It will be saved as an encrypted backend secret called `ELEVENLABS_API_KEY` that only your edge functions can read. **You should rotate this key on elevenlabs.io since it was shared in chat** — I'll remind you after.

## Improvements I'll Add

### 1. Per-Girlfriend Unique Voices

Each girlfriend already has a `voice_id` defined, but I'll tune the voice settings per personality:

- **Sakura** (playful tsundere) — higher style, lower stability for expressive teasing
- **Luna** (intellectual) — high stability, calm and measured
- **Aria** (energetic coach) — boosted speaker clarity, upbeat pace
- **Yuki** (sensual) — lower stability, high style for breathy intimate delivery

### 2. Mood-Reactive Voice

Voice settings will dynamically shift based on current mood:

- `seductive` / `intimate` → slower speed, higher style
- `excited` / `playful` → faster speed, more variation
- `sad` / `worried` → slower, more stable
- `angry` → sharper, less stable

&nbsp;

### 4. Voice Caching

Cache generated audio per message in memory so replaying a message doesn't re-hit the API (saves your ElevenLabs credits).

### 5. Better Error Handling

- Show a clear toast if API key is invalid or quota is exhausted
- Graceful fallback so chat keeps working even if voice fails
- Loading shimmer on the voice button during generation

### 6. Stop/Replay Controls

While audio is playing, the speaker icon becomes a stop button so you can interrupt long replies.

## Technical Changes


| File                                         | Change                                                                               |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| Backend secret                               | Add `ELEVENLABS_API_KEY` (via secure prompt, not code)                               |
| `supabase/functions/elevenlabs-tts/index.ts` | Accept `mood` + `personality` params; tune `stability`, `style`, `speed` dynamically |
| `src/hooks/useChat.ts`                       | Add audio cache (Map by message id), stop control, auto-play state, pass mood to TTS |
| `src/pages/Chat.tsx`                         | Add auto-play toggle in header, stop button while playing, shimmer state             |


No database changes needed.

## After Approval

1. I'll trigger the secure secret prompt — you paste the key into the popup (not chat)
2. I'll deploy the updated edge function
3. Voice will work end-to-end with mood-aware delivery

**Reminder:** rotate the leaked key at elevenlabs.io → Profile → API Keys after we're done.