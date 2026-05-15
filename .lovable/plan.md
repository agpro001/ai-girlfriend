## Goals

1. Session must persist across browser refresh — no forced re-login until the user clicks Logout.
2. All admin features fully functional with no errors.

## Root causes found

**A. Refresh logout bug (`src/hooks/useAuth.tsx`)**
The hook calls `setLoading(false)` from BOTH `onAuthStateChange` and `getSession()`. Supabase fires an `INITIAL_SESSION` event very early — sometimes with `session = null` for a tick before storage is rehydrated. `loading` flips to `false` while `user` is still `null`, so `ProtectedRoute` immediately redirects to `/auth`. Then `getSession()` resolves with the real user, but the redirect already happened.

**B. Admin Wallpapers thumbnails broken (`src/components/LiveWallpaper.tsx` + `src/pages/AdminWallpapers.tsx`)**
`LiveWallpaper` always renders with `fixed inset-0 -z-10`, meaning when used as a grid-cell preview it escapes its container and all 9 wallpapers stack on the page background. Previews appear empty.

**C. No active wallpaper exists yet**
`user_wallpaper_settings` is empty in the DB, so new users see no background. Need a sensible default global wallpaper seeded so the system feels alive out of the box.

**D. Admin nav lacks Moderation visibility verification**
Routes are wired correctly; no fix needed beyond confirming.

## Plan

### 1. Fix auth persistence

Rewrite `useAuth` so:

- `onAuthStateChange` is set up first, but only updates `user` (it does NOT toggle `loading`).
- `getSession()` is the single source that sets `loading = false` once storage rehydration completes.
- Result: `ProtectedRoute` waits for the real session before deciding.

### 2. Make `LiveWallpaper` container-aware

Add a `contained?: boolean` prop. When true, swap `fixed inset-0 -z-10` → `absolute inset-0`. Update `AdminWallpapers` previews to pass `contained`.

### 3. Seed a default global wallpaper

Insert one row into `user_wallpaper_settings` with `is_global = true` pointing at "Aurora Flow" so all users get a live background immediately. Admins can change it from the Walls page.

### 4. Verify and validate

- Run the db linter and typecheck output from the dev build.
- Manually re-check admin pages render: Users, User Detail (mood control), Conversation read-only, Stats, Models save+broadcast, Walls thumbnails + set-as-global, Moderation queue.
- Confirm normal users see no admin nav items and no admin labels anywhere on shared pages.

## Technical notes

- `useAuth` change is the standard "set listener first, then `getSession`, only toggle `loading` after `getSession` resolves" pattern.
- `LiveWallpaper` switch is purely a className branch — no API change to `AppWallpaper`.
- Default global wallpaper insert is one SQL row; idempotent guard via `WHERE NOT EXISTS`.
- No new tables, no new RLS policies, no schema changes.

All features must working properly and really no simulation all real features working correctly.Smoothly.