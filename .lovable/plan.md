## Findings

- The hosted backend is healthy.
- `aditya@ai.ai` exists and already has the admin role, but its email is not verified, so password login can show as invalid.
- `adityagupta1234.in@gmail.com` exists, is verified, and has logged in before, but does not currently have the admin role.
- The admin auto-grant trigger is missing in the live database even though the function exists, so future admin assignment is not reliable until fixed.

## Plan

1. **Fix the admin account setup**
   - Grant admin access to `adityagupta1234.in@gmail.com`.
   - Update the auto-admin grant function to support `adityagupta1234.in@gmail.com` going forward.
   - Recreate the missing auth trigger so the role is applied reliably on signup/email updates.
   - Keep roles only in `user_roles`, not profiles or client storage.

2. **Harden the hidden admin routing**
   - Keep normal users on the same login page and normal app pages.
   - Ensure guessed admin URLs redirect normal users and still rely on backend role checks.
   - Add the new admin pages only to the admin nav after a verified admin role is loaded.

3. **Add editable companion/model controls**
   - Create a backend table for companion overrides with fields like name, tagline, description, personality values, hidden goal, trust threshold, neon color, enabled status, and updated timestamp.
   - Admins can edit these values; normal users can only read the active values needed to render the app.
   - Merge these overrides into the existing `COMPANIONS` data so dashboard, chat, profile, stats, and prompts use updated model names/details.
   - Enable realtime updates so companion edits appear live without refresh.

4. **Add real-time mood control for all users**
   - Add admin policies allowing admins to update any user's companion mood.
   - Add controls on user detail/conversation admin pages to set mood and intensity per companion/user.
   - Normal users still only see their own moods.
   - Use realtime subscriptions so the user dashboard/chat reflects admin mood changes live.

5. **Add wallpaper and live wallpaper collections**
   - Create `wallpaper_collections`, `wallpapers`, and `user_wallpaper_settings` tables.
   - Include seeded cyberpunk/neon static wallpapers and live wallpaper presets using safe CSS/animation configs, not untrusted code.
   - Admins can create, edit, activate, and assign wallpapers globally or per user.
   - Normal users can read only active wallpaper data needed by the app.

6. **Build admin management screens**
   - Add a neutral admin-only “Models” page to edit companion settings.
   - Add a neutral admin-only “Walls” page to manage wallpaper collections and live presets.
   - Extend user detail with mood/wallpaper controls for that selected user.
   - Keep labels neutral in admin nav, without exposing admin wording to normal users.

7. **Apply wallpapers in the app**
   - Add a shared wallpaper provider/hook that loads the active global or user-specific wallpaper.
   - Apply it consistently to dashboard/chat/community/gallery/admin layouts without breaking the current dark neon style.
   - Support realtime changes for global and per-user wallpaper updates.

8. **Validate**
   - Check admin role queries for both emails.
   - Run database linter after migrations.
   - Check TypeScript/test output through the normal harness.
   - Verify no ElevenLabs voice references remain active and no recent edge errors are present.

## Technical notes

- Passwords cannot be set or changed directly from a database migration. Since `adityagupta1234.in@gmail.com` already exists and is verified, the fix is to grant that existing account admin access. If its password is not currently `Abcd1234`, use the app’s normal password reset flow or sign in with the existing password.
- The new admin features require database migrations first, then frontend changes after the generated database types update.