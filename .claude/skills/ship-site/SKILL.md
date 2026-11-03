---
name: ship-site
description: Check and publish changes to the Kialikmin Clan website. Use when the user says "ship it", "publish", "deploy", "push my changes" or "make it live".
---

# Ship the Kialikmin website

Netlify redeploys automatically whenever `main` is pushed to GitHub, so "shipping" means: check, commit, push.

1. Run `git status` and `git diff`, and summarise the changes in plain language for the user.
2. Safety checks. Stop and tell the user if any of these fail:
   - `js/config.js` contains no `service_role` or secret key.
   - Nothing from the court summary has been added to the public pages.
   - Any new database table in `supabase/schema.sql` has RLS enabled and has policies.
   - User data is rendered with `textContent`, not `innerHTML`.
3. Preview the site locally with the `site` launch config and check the changed pages.
4. Commit with a short, clear message describing what changed and why.
5. `git push`. Then tell the user the live site will update on Netlify in about a minute.
6. If `supabase/schema.sql` or the Edge Function changed, remind the user to re-run or redeploy it in the Supabase dashboard. Pushing to GitHub does NOT update Supabase.
