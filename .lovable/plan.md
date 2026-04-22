# AI Girlfriend: Profiles, Moderation, Mentions & Rebrand

## Overview

Four major additions: (1) public user profile pages, (2) report/block system with admin moderation, (3) @mention autocomplete with notifications, (4) full rebrand from "Aura-Link" to "AI Girlfriend".

---

## 1. Public User Profile Pages — `/u/:username`

New page showing any user's public profile:

- Avatar, username, bio, join date
- Stats: total posts, total likes received, total comments
- Grid of all their community posts (using `CommunityCard`)
- "Block User" button (if logged in and not viewing self)
- Clickable usernames/avatars across community → navigate to `/u/:username`
- `User can add country they belong add all countries with their flags 3d animation.`

## 2. Report & Block System

### Reporting

- "Report" option in post/comment dropdown menus
- Modal with reason categories: spam, harassment, NSFW (in community), hate speech, other
- Optional details textarea
- Creates a `reports` row
- User can write Nsfw spam harrasment and any other things but if other ai models having the expression or emotions to get it. Or in community user can write this but need to be 18+ from profile settings.
- User can flirt.

### Blocking

- "Block user" button on profile pages and post menus
- Blocked users' posts and comments are hidden from feed and detail views
- Blocked users cannot comment on your posts (enforced via RLS + client filter)

### Admin Moderation Queue — `/admin/moderation`

- Protected by `has_role(auth.uid(), 'admin')` check
- Lists all open reports with content preview, reporter, reason, timestamp
- Actions: dismiss report, delete content, ban user (sets `banned` flag on profile)
- Banned users cannot post, comment, or like

## 3. @Mention Autocomplete in Comments

- Typing `@` in comment input opens a popover with username suggestions (debounced search of `profiles`)
- Arrow keys + enter to select, click to insert
- On comment submit, parse `@username` tokens, look up user_ids, create a `mention` notification for each
- Mentions render as clickable `text-primary` links to `/u/:username` in the comment body
- Notification bell shows mention notifications with "X mentioned you in a comment"

## 4. Rebrand: Aura-Link → AI Girlfriend

Replace all instances across:

- `index.html` (title, description, og:title, og:description, twitter meta)
- `src/pages/Index.tsx` — hero "AURA-LINK" → "AI Girlfriend

&nbsp;

&nbsp;

Think longer if needed add other working things. Make everything working properly and real. With smooth realistic animation.