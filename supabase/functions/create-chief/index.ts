// Supabase Edge Function: create-chief
// Lets the ROOT user create a login for a new clan chief and assign them to a place.
// Creating logins needs the secret service-role key, so this runs on Supabase's server,
// never in the browser.
//
// Deploy: Dashboard → Edge Functions → Deploy a new function → "Via Editor",
// name it exactly  create-chief , paste this file, Deploy.

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Who is calling?
    const caller = createClient(url, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await caller.auth.getUser();
    if (!user) return json({ error: "You are not signed in." }, 401);

    // Only root may create chiefs.
    const admin = createClient(url, serviceKey);
    const { data: me } = await admin.from("profiles").select("role").eq("id", user.id).single();
    if (me?.role !== "root") return json({ error: "Only the root user can create chiefs." }, 403);

    const { email, password, full_name, phone, place_id } = await req.json();
    if (!email || !password || !full_name || !place_id) {
      return json({ error: "Email, password, full name and place are required." }, 400);
    }
    if (String(password).length < 8) {
      return json({ error: "Password must be at least 8 characters." }, 400);
    }

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });
    if (error) return json({ error: error.message }, 400);

    const { error: profileError } = await admin.from("profiles").insert({
      id: created.user.id,
      full_name,
      phone: phone || null,
      role: "chief",
      place_id,
    });
    if (profileError) {
      // Don't leave a login with no profile behind.
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: profileError.message }, 400);
    }

    return json({ id: created.user.id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
