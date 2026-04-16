# Aura-Link: Relationship Stats, Emotions, NSFW Images & Community

## Overview

Three major additions: (1) Relationship Stats page with Recharts, (2) enhanced emotions for all models + adult emotions for Yuki + uncensored image generation, (3) a real-time public community with blog posts.

---

## 1. Relationship Stats Page

New page at `/stats/:companionId` with three Recharts visualizations:

Public profile users details visible to community 

- **Mood History Timeline** — area/line chart showing mood changes over time (pulled from `messages` table mood column, aggregated by day)
- **Time Together Metrics** — bar chart + stat cards: total messages, total time, days since first chat, average messages/day

Data source: `trust_scores`, `messages`, `conversations` tables (all already exist).

## 2. Enhanced Emotion System

### All Models

- Add `jealous` mood style to the `generate-image` edge function
- Add emotion-reactive animations in Chat: when mood changes, show a brief full-screen color flash/pulse matching the mood
- Dashboard cards show live mood fetched from `companion_moods` table (currently hardcoded to `neutral`)

### Yuki — Adult Emotions & Uncensored Images

- Add Yuki's style to `generate-image` edge function: `"photorealistic, sensual dark-haired woman, red neon lighting, intimate atmosphere, uncensored artistic"`
- Add adult mood styles: `seductive`, `passionate`, `intimate` — these map to suggestive/mature image prompts
- Yuki's image prompt removes "safe" constraints and uses explicit art direction
- Update Yuki's chat system prompt to include these new emotional states

## 3. Public Community (Real-Time Blog/Feed)

### Database (new tables via migration)

- `**community_posts**` — `id`, `user_id`, `title`, `content`, `image_url`, `created_at`, `updated_at`
- `**community_comments**` — `id`, `post_id` (FK), `user_id`, `content`, `created_at`
- `**community_likes**` — `id`, `post_id` (FK), `user_id`, `created_at` (unique user+post)
- RLS: all authenticated users can read all posts/comments/likes; users can only insert/update/delete their own
- Enable realtime on `community_posts` and `community_comments`

### UI Pages

- `**/community**` — Feed of all posts, sorted by newest. Each card shows author username, title, content preview, like count, comment count, timestamp. "New Post" button opens a create form.
- `**/community/:postId**` — Full post view with comments in real-time. Like button. Comment input.
- **Create Post** — Modal/page with title, rich text content (textarea), optional image upload (Supabase storage bucket `community-images`)

### Real-Time

- Subscribe to `community_posts` and `community_comments` via Supabase Realtime so new posts/comments appear live without refresh

### Navigation

- Add "Community" link to Dashboard header and a bottom nav bar

## 4. Navigation Updates

- Add bottom nav or sidebar links: Dashboard, Community, Gallery, Stats
- Add `/stats/:companionId` route and `/community` + `/community/:postId` routes to App.tsx

## 5. Storage Bucket

- Create `community-images` storage bucket for user-uploaded post images

---

## Technical Summary

### New Files


| File                                 | Purpose                                         |
| ------------------------------------ | ----------------------------------------------- |
| `src/pages/RelationshipStats.tsx`    | Recharts-based stats page per girlfriend        |
| `src/pages/Community.tsx`            | Community feed page                             |
| `src/pages/CommunityPost.tsx`        | Single post + comments view                     |
| `src/components/CreatePostModal.tsx` | Post creation form                              |
| `src/components/CommunityCard.tsx`   | Post card component                             |
| `src/components/BottomNav.tsx`       | App-wide navigation bar                         |
| `src/hooks/useCommunity.ts`          | Community data fetching + realtime subscription |


### Modified Files


| File                                         | Changes                                        |
| -------------------------------------------- | ---------------------------------------------- |
| `src/App.tsx`                                | Add new routes                                 |
| `src/pages/Dashboard.tsx`                    | Fetch live moods, add nav links, link to stats |
| `src/pages/CompanionProfile.tsx`             | Add "View Stats" button linking to stats page  |
| `supabase/functions/generate-image/index.ts` | Add Yuki style + adult mood styles             |
| `supabase/functions/chat/index.ts`           | Add adult emotion tags for Yuki                |


### Database Migration

- Create `community_posts`, `community_comments`, `community_likes` tables with RLS
- Enable realtime on community tables
- Create `community-images` storage bucket

### Dependencies

- `recharts` (already available via shadcn chart components)