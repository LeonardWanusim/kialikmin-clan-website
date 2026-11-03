# Kialikmin Clan Association website

Public website + member registry for the Kialikmin Clan Association Incorporated (Min peoples of
Telefomin, North Fly, Tunap Anstein LLG and Ngalummin / West Papua).

## Stack
- Plain HTML/CSS/JavaScript (ES modules). **No build step, no npm dependencies.** Keep it that way so the owner, who is learning, can read every file.
- Supabase (free tier) for login, database and one Edge Function. Client loaded from jsDelivr, pinned to `@supabase/supabase-js@2.45.4`.
- Hosted on Netlify, auto-deployed from the GitHub `main` branch.

## Roles
- **root**: manages places, creates chiefs (via the `create-chief` Edge Function), and can see and edit all members.
- **chief**: assigned to one place. Can register, view and edit members of that place only.
- Access rules live in `supabase/schema.sql` as Row Level Security policies. Any new table MUST get RLS policies. Never rely only on hiding things in the browser.

## Files
- `index.html`: public homepage. Content comes ONLY from the public notice (Feb 2026). Do not publish anything from the court summary.
- `login.html`, `dashboard.html`, `js/dashboard.js`: the members app.
- `js/config.js`: Supabase URL + anon key (public by design). Never put the service_role key in the frontend or in git.
- `supabase/schema.sql`: tables, policies and seed places. Re-runnable.
- `supabase/functions/create-chief/index.ts`: Edge Function (Deno).
- `assets/logo.svg`: PLACEHOLDER emblem until the real clan logo is supplied.

## Conventions
- Render user data with `textContent` / DOM nodes, never `innerHTML`.
- Colours: navy `#1f3864`, gold `#b8860b` (from the clan's documents). CSS variables live in `css/style.css`.
- Preview locally with the `site` config in `.claude/launch.json` (http://localhost:5173).
