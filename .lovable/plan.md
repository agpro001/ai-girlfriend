# Aura-Link Advanced Upgrade Plan

## What's Changing

### 1. Chat Persistence (Save & Restore Messages)

Currently messages are only in memory — they vanish on logout. We'll load previous messages from the database when entering a chat, and save every sent/received message to the `messages` table in real-time.

### 2. New 18+ Companion: "Yuki"

A fourth girlfriend model with no content restrictions. She has a unique "uncensored" personality prompt, her own neon color (red), and can generate adult-themed images. An age verification gate will appear before accessing her chat/profile. In which user has to select are u 18+ or not

### 3. Rename "Companion" to "Girlfriend" Throughout

All UI text — dashboard headings, profile labels, landing page — will say "Girlfriend" instead of "Companion."

### 4. Emotion System with Visual Indicators

Each girlfriend gets a dynamic emotion state that changes based on conversation. Emotions (happy, sad, angry, romantic, jealous, playful, worried, excited) are displayed as animated emoji + colored aura on the chat header and dashboard cards. The chat edge function will also return a detected mood per response.

### 5. Live Falling Pink Petals Background Animation

A canvas-based or CSS particle animation of pink dry leaves/petals gently falling across the background of all pages. Subtle, soothing, and performant.

### 6. Additional Improvements

- **Gallery**: Actually loads saved images from the `messages` table (where `image_url` is not null)
- **Companion Profile**: Loads real trust score, message count, and time together from the database
- **Dashboard**: Shows last message preview and current mood per girlfriend
- **Chat**: Typing indicator, scroll-to-bottom button, message timestamps
  7.password can be anything harder easier strong or lose
  8. In main page in ver downward it written made by Aditya. And contact instagram@agpro001 

---

## Technical Details

### Database Changes

- No new tables needed — existing schema covers everything
- Add `Yuki` as a 4th companion in the `COMPANIONS` array in `src/types/companion.ts`

### Files to Create


| File                               | Purpose                                 |
| ---------------------------------- | --------------------------------------- |
| `src/components/FallingPetals.tsx` | Canvas/CSS particle animation component |
| `src/components/AgeGate.tsx`       | 18+ verification modal for Yuki         |
| `src/assets/yuki.jpg`              | Generated portrait for Yuki             |


### Files to Modify


| File       | Changes |
| ---------- | ------- |
| `src/types | &nbsp;  |
