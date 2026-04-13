# Aura-Link: AI Girlfriend Companion App

## Overview

A relationship simulator web app with 3 AI girlfriend models, each with unique personalities, persistent memory, time-awareness, AI image generation, and voice messages. Built with React + Lovable Cloud (Supabase) + Lovable AI + ElevenLabs.

## 3 Girlfriend Models

1. **Sakura** — Anime-style, warm & playful "tsundere" personality (high sarcasm, hidden vulnerability)
2. **Luna** — Realistic style, intellectual & mysterious (high ambition, moderate empathy, hidden goal: become a writer)
3. **Aria** — Anime-realistic hybrid, fitness-focused & energetic (high agreeableness, motivational, "tough love" mode)

---

## Phase 1: Foundation & Auth

- **Landing page** with Aura-Link branding (dark cyberpunk/neon aesthetic)
- **Signup/Login** with email & password via Lovable Cloud auth
- **User profiles table** storing preferences, last seen timestamp
- **Dashboard** showing the 3 companion cards with preview images, personality traits, and "Start Chat" buttons

## Phase 2: Neural Personality System

- **Character DNA display**: Multi-variable temperament sliders (Agreeableness, Neuroticism, Sarcasm, Ambition, Empathy) — viewable per model, influences AI behavior
- **Personality matrix** encoded in system prompts sent to Lovable AI (Gemini)
- **Trust Score** system: tracks interaction count, sentiment, and time spent — stored in DB per user-companion pair
- **Hidden Goals**: Each companion has a secret ambition revealed only at high trust levels

## Phase 3: AI Chat with Memory

- **Streaming chat** via Lovable AI edge function with per-companion system prompts
- **Chronos-Memory (Time Awareness)**: Inject current time + last_seen timestamp into prompts; AI reacts to absences, late-night chats, etc.
- **Episodic Memory**: Store "anchor points" (high-sentiment messages about family, goals, trauma) in a memories table; retrieve and inject relevant memories into context via keyword matching
- **Mood system**: Track companion mood state based on interactions, time gaps; mood affects response tone
- **Conflict system**: AI can disagree based on personality core values (e.g., Aria refuses lazy behavior)

## Phase 4: Image Generation

- **Mood-based companion visuals**: Generate context-aware images using Nano Banana 2 (gemini-3.1-flash-image-preview)
- **"Gift" system**: Companions can generate personalized images as gifts (e.g., "us in a neon cafe")
- **Visual mood indicators**: Companion avatar/background changes based on current mood state

## Phase 5: Voice Messages

- **ElevenLabs TTS** integration via edge function
- Each companion gets a unique voice (different ElevenLabs voice IDs)
- **Mood-based voice inflection**: Adjust voice settings (stability, style) based on companion mood
- Play button on each AI message to hear it spoken

## Phase 6: Engagement Features

- **Proactive pings**: Companions can "initiate" — shown as notification-style messages on dashboard
- **Subconscious journal**: Every few interactions, AI generates a hidden journal entry (stored in DB, influences future conversations but user can't see it directly — unlockable at high trust)
- **Relationship stats page**: Trust level, total messages, time together, mood history chart

## Database Schema

- `profiles` — user data, preferences
- `companions` — the 3 models with personality configs
- `conversations` — chat sessions per user-companion
- `messages` — chat history with role, content, timestamp, mood
- `memories` — anchor points (keyword, summary, weight, companion_id, user_id)
- `trust_scores` — per user-companion trust metrics
- `journal_entries` — companion's hidden journal
- `companion_moods` — current mood state per user-companion

## Edge Functions

- `chat` — Streaming AI chat with personality injection, memory retrieval, time awareness
- `generate-image` — Context-aware image generation via Nano Banana 2
- `elevenlabs-tts` — Voice message generation with mood-based settings
- `companion-journal` — Generate periodic journal entries

## UI Pages

1. **Landing** — Hero with neon aesthetic, features overview, CTA
2. **Auth** — Login/Signup
3. **Dashboard** — 3 companion cards with mood indicators, trust level, last message preview
4. **Chat** — Full chat interface with streaming, voice playback, image display, mood indicator
5. **Companion Profile** — Personality DNA sliders (read-only), relationship stats, trust progress
6. **Gallery** — Collection of generated images/gifts
7. All girlfriend model has different emotions. 
8. Real working model.