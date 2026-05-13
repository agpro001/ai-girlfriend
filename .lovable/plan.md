## Backend health

Lovable Cloud is up and responding normally. No edge function errors in `chat` or `generate-image` logs. Nothing to fix.

## Admin system

### 1. Auto-grant admin role to `aditya@ai.ai`

- Database trigger on `auth.users` (insert + update of email): if `email = 'aditya@ai.ai'`, insert `('admin')` into `user_roles` (idempotent).
- Backfill: if the user already exists, insert the row now.
- No UI flag, no special signup path — same `/auth` page for everyone, no "admin" wording anywhere visible to non-admins.

### 2. Open up data access for admins (RLS additions)

Add admin-read policies to tables that currently only allow self-access:

- `messages` — admins SELECT all
- `conversations` — admins SELECT all
- `profiles` — already viewable to all authenticated; leave as is
- `trust_scores` — admins SELECT all
- `companion_moods` — admins SELECT all
- `journal_entries` — admins SELECT all (including invisible ones)
- `memories` — admins SELECT all
- `community_posts` / `community_comments` — already viewable; no change

All gated by `has_role(auth.uid(), 'admin')`. Normal users see zero change.

### 3. New admin-only pages (all under `ProtectedRoute` + `isAdmin` check, redirect to `/dashboard` if not admin)

- `/admin/users` — list every user with username, avatar, country, last_seen, message count, banned flag. Search by username/email-ish. **Realtime** subscription on `profiles` (last_seen / banned changes) so the list updates live; also subscribes to `messages` inserts to surface "active now" indicators.
- `/admin/users/:userId` — that user's profile summary + list of their conversations grouped by companion (Sakura / Luna / Aria), with message counts and last activity.
- `/admin/conversations/:conversationId` — full read-only chat transcript (user + assistant bubbles, mood, image_url), with companion name and owner header.
- `/admin/stats` — global counters: total users, active in last 24h, total messages, messages per companion, posts/comments/reports counts. Live-updating via realtime channels on `messages` and `profiles`.
- Existing `/admin/moderation` stays as is.

### 4. Navigation

- `BottomNav`: when `isAdmin`, replace the single "Mod" item with admin entries: **Users**, **Stats**, **Mod**. Labels stay neutral — no "Admin" word shown. Normal users see the unchanged Home / Community / Gallery nav.
- Routes registered in `App.tsx`.

### 5. Realtime

- Enable realtime publication for `messages`, `conversations`, `profiles` so admin pages can subscribe to live changes.

### 6. Security guarantees

- Every admin route double-checks `has_role` server-side via RLS — even if a non-admin guesses a URL, queries return empty.
- No client-side strings reveal the existence of admin features to non-admins (no "Admin" labels in shared components, conditional rendering only).
- Roles stay in the dedicated `user_roles` table (already correct pattern).

### Technical notes

- Migration adds: trigger function `grant_admin_to_seed_email()`, trigger on `auth.users`, backfill insert, and the new admin-read RLS policies.
- New files: `src/pages/AdminUsers.tsx`, `src/pages/AdminUserDetail.tsx`, `src/pages/AdminConversation.tsx`, `src/pages/AdminStats.tsx`, `src/hooks/useAdminData.ts`.
- Edited: `src/App.tsx` (routes), `src/components/BottomNav.tsx` (admin nav items).
- Password is set by the user themselves at signup with that email — we cannot pre-set passwords from a migration. After approval, sign up once with `aditya@ai.ai` / `aditya@ai.ai` on the normal `/auth` page; the trigger grants admin automatically.

Admin can login from that same page from where normal user login admin will insert admin email and password in required place. No text display there like something admin login or something else. Normal user and admin login page same but after login both have different pages. Normal user as the haved.