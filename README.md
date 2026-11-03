# Kialikmin Clan Association — Website

Public website and member registry. The **root** administrator creates **clan chiefs**, and each chief registers members for their own place.

Everything here runs on free tiers: **GitHub** stores the code, **Supabase** handles logins and the database, and **Netlify** hosts the site.

---

## Step 1 — Set up Supabase (database + logins)

1. Sign up at https://supabase.com (you can use your GitHub login) and click **New project**.
   Name it `kialikmin`, pick a strong database password (keep it safe), and choose the region closest to you (e.g. Sydney).
2. Go to **SQL Editor → New query**, paste all of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
3. **Create your root login:** go to **Authentication → Users → Add user → Create new user**. Enter your email and a strong password, and tick **Auto Confirm User**.
4. Back in the SQL Editor, run this with your own name and email filled in:
   ```sql
   insert into public.profiles (id, full_name, role)
   select id, 'Your Full Name', 'root' from auth.users where email = 'you@example.com';
   ```
5. **Deploy the create-chief function:** go to **Edge Functions → Deploy a new function → Via Editor**, name it `create-chief`, paste [`supabase/functions/create-chief/index.ts`](supabase/functions/create-chief/index.ts), and click **Deploy**.
6. **Turn off public sign-ups** so only root can create accounts: go to **Authentication → Sign In / Providers** and switch off **Allow new users to sign up**.
7. Go to **Project Settings → API** and copy the **Project URL** and the **anon / publishable key** into [`js/config.js`](js/config.js).
   ⚠️ Never copy the `service_role` / secret key into the website.

## Step 2 — Put the code on GitHub

```bash
gh auth login
gh repo create kialikmin-clan-website --public --source . --push
```

## Step 3 — Host it free on Netlify

1. Sign up at https://netlify.com with your GitHub account.
2. Click **Add new site → Import an existing project → GitHub** and pick `kialikmin-clan-website`.
3. Leave the build command empty and set the publish directory to `.`, then click **Deploy**.
4. Optional: under **Site configuration → Change site name**, rename it to e.g. `kialikmin-clan.netlify.app`.
5. In Supabase, go to **Authentication → URL Configuration** and set **Site URL** to your Netlify address.

From now on, every `git push` updates the live site automatically.

## Using the site

| Who | What they do |
|-----|--------------|
| **Root** | Log in → add places → create chiefs (name, email, temporary password, place) → view all members and download a CSV. |
| **Chief** | Log in → change password → register and edit members of **their place only**. |
| **Public** | Read about the Association, its communities, how to join, how to donate, and who to contact. |

## Replace the placeholder logo

Overwrite `assets/logo.svg` with the real clan logo. If yours is a PNG, save it as `assets/logo.png` and ask Claude: *"switch the site to use assets/logo.png"*.

## Preview locally

```bash
npx -y serve@14.2.4 -l 5173 .
```
Then open http://localhost:5173.
