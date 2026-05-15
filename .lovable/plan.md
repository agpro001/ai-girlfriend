## Goal

Make the admin sections open reliably for the admin account, prevent login loss on refresh, and handle the Gemini API key securely without exposing it in the frontend.

## Findings

- The hosted backend is healthy.
- The account `adityagupta1234.in@gmail.com` is already marked as admin in the backend.
- The admin redirect loop is coming from client-side auth/role timing and navigation, not from missing admin data.
- Admin bottom-nav links are visible, but clicking admin links currently lands back on `/dashboard`.
- The app already uses backend AI functions with Lovable AI; the raw Gemini key should not be hardcoded into React code.

## Implementation plan

1. **Stabilize auth session state**
  - Refactor `useAuth` to share one auth state across the app instead of every component creating its own independent auth listener.
  - Restore the saved session once on app load and keep `loading` true until restoration finishes.
  - Ensure refresh keeps the user logged in until explicit logout.
2. **Stabilize admin role checks**
  - Refactor `useUserRole` so it waits for a real user id before checking admin status.
  - Add an error-safe state so failed/early role checks do not instantly mark the admin as non-admin.
  - Prevent stale role results from redirecting routes while a newer check is still in progress.
3. **Create one reusable admin route guard**
  - Add an `AdminRoute` guard that combines auth loading and role loading.
  - While either is loading, show the existing loading UI.
  - Only redirect after auth and role checks are both complete.
  - Use this guard for all admin routes: Walls, Models, Users, User Detail, Stats, Conversation, and Moderation.
4. **Fix admin navigation behavior**
  - Keep admin bottom nav links as real route links, but ensure route guards no longer bounce them back during role-check races.
  - Align moderation’s non-admin fallback with the rest of admin routes.
5. **Verify admin features and refresh behavior**
  - Log in as the provided admin account.
  - Open `/admin/wallpapers`, `/admin/models`, `/admin/users`, `/admin/stats`, and `/admin/moderation`.
  - Refresh on an admin route and confirm the session remains and the page does not redirect to dashboard.
  - Check browser console/network for errors during these flows.
6. **Gemini API key handling**
  - Do not place the provided Gemini key in frontend code.
  - Since the app already uses secure backend AI functions, keep AI calls backend-side.
  - If a custom Gemini key must be used instead of the existing Lovable AI setup, store it as a backend secret first, then update only backend function code to read it securely.

&nbsp;

All features must work really properly and correctly. No more errors. First chk then analyze and Fix everything.