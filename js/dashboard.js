import { supabase, isConfigured, showMsg, hideMsg } from "./supabase.js";

const $ = (id) => document.getElementById(id);
const msg = $("msg");

let profile = null;
let places = [];
let members = [];

// Build a table row safely (textContent, never innerHTML, so user input can't inject code).
function row(cells) {
  const tr = document.createElement("tr");
  for (const c of cells) {
    const td = document.createElement("td");
    if (c instanceof Node) td.append(c); else td.textContent = c ?? "";
    tr.append(td);
  }
  return tr;
}

function emptyRow(tbody, cols, text) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = cols;
  td.className = "empty";
  td.textContent = text;
  tr.append(td);
  tbody.replaceChildren(tr);
}

const placeName = (id) => places.find((p) => p.id === id)?.name ?? "—";

// ---------- Start ----------

async function init() {
  if (!isConfigured) {
    showMsg(msg, "Supabase is not connected yet. Fill in js/config.js (see README).");
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return (location.href = "login.html");

  const { data, error } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
  if (error || !data) {
    showMsg(msg, "Your login has no clan role yet. Ask the root administrator to set you up.");
    return;
  }
  profile = data;

  await loadPlaces();
  $("who").textContent = profile.role === "root"
    ? `${profile.full_name} (root)`
    : `${profile.full_name} — Chief, ${placeName(profile.place_id)}`;

  if (profile.role === "root") {
    $("root-area").classList.remove("hidden");
    $("m-place-wrap").classList.remove("hidden");
    $("members-title").textContent = "All members";
    await loadChiefs();
  } else {
    $("members-title").textContent = `Members — ${placeName(profile.place_id)}`;
  }
  $("members-area").classList.remove("hidden");
  await loadMembers();
}

// ---------- Places (root) ----------

async function loadPlaces() {
  const { data, error } = await supabase.from("places").select("*").order("name");
  if (error) return showMsg(msg, error.message);
  places = data;

  for (const sel of document.querySelectorAll(".place-select")) {
    sel.replaceChildren(...places.map((p) => new Option(p.name, p.id)));
  }
}

function renderPlaces() {
  const tbody = $("places-body");
  if (!places.length) return emptyRow(tbody, 5, "No places yet.");
  const counts = {};
  for (const m of members) counts[m.place_id] = (counts[m.place_id] ?? 0) + 1;
  tbody.replaceChildren(...places.map((p) =>
    row([p.name, p.district, p.province, p.country, String(counts[p.id] ?? 0)])));
}

$("place-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMsg(msg);
  const { error } = await supabase.from("places").insert({
    name: $("place-name").value.trim(),
    district: $("place-district").value.trim() || null,
    province: $("place-province").value.trim() || null,
    country: $("place-country").value,
  });
  if (error) return showMsg(msg, error.message);
  e.target.reset();
  showMsg(msg, "Place added.", "ok");
  await loadPlaces();
  renderPlaces();
});

// ---------- Chiefs (root) ----------

async function loadChiefs() {
  const { data, error } = await supabase.from("profiles").select("*").eq("role", "chief").order("full_name");
  if (error) return showMsg(msg, error.message);

  const tbody = $("chiefs-body");
  if (!data.length) return emptyRow(tbody, 4, "No chiefs yet. Create the first one above.");

  tbody.replaceChildren(...data.map((c) => {
    const sel = document.createElement("select");
    sel.append(...places.map((p) => new Option(p.name, p.id, false, p.id === c.place_id)));
    sel.addEventListener("change", async () => {
      const { error } = await supabase.from("profiles").update({ place_id: sel.value }).eq("id", c.id);
      if (error) return showMsg(msg, error.message);
      showMsg(msg, `${c.full_name} moved to ${placeName(sel.value)}.`, "ok");
      loadChiefs();
    });
    return row([c.full_name, c.phone, placeName(c.place_id), sel]);
  }));
}

$("chief-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMsg(msg);
  const btn = e.target.querySelector("button");
  btn.disabled = true;
  const { data, error } = await supabase.functions.invoke("create-chief", {
    body: {
      full_name: $("chief-name").value.trim(),
      email: $("chief-email").value.trim(),
      phone: $("chief-phone").value.trim(),
      place_id: $("chief-place").value,
      password: $("chief-pw").value,
    },
  });
  btn.disabled = false;

  if (error) {
    // The function returns { error } JSON; surface that message if we can.
    let text = error.message;
    try { text = (await error.context.json()).error ?? text; } catch { /* keep default */ }
    return showMsg(msg, text);
  }
  if (data?.error) return showMsg(msg, data.error);

  e.target.reset();
  showMsg(msg, "Chief created. Share the email and temporary password with them in person.", "ok");
  loadChiefs();
});

// ---------- Members (chief + root) ----------

async function loadMembers() {
  const { data, error } = await supabase.from("members").select("*").order("created_at", { ascending: false });
  if (error) return showMsg(msg, error.message);
  members = data;
  renderMembers();
  if (profile.role === "root") renderPlaces();
}

function filteredMembers() {
  const q = $("search").value.trim().toLowerCase();
  if (!q) return members;
  return members.filter((m) =>
    m.full_name.toLowerCase().includes(q) || (m.village ?? "").toLowerCase().includes(q));
}

function renderMembers() {
  const list = filteredMembers();
  $("member-count").textContent = `${members.length} member${members.length === 1 ? "" : "s"}`;
  const tbody = $("members-body");
  if (!list.length) return emptyRow(tbody, 9, members.length ? "No matches." : "No members registered yet.");

  tbody.replaceChildren(...list.map((m) => {
    const edit = document.createElement("button");
    edit.className = "btn btn-ghost btn-small";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => startEdit(m));
    return row([
      m.full_name, m.gender, m.village, m.phone, m.citizenship, m.membership_type,
      placeName(m.place_id), new Date(m.created_at).toLocaleDateString(), edit,
    ]);
  }));
}

$("search").addEventListener("input", renderMembers);

function startEdit(m) {
  $("member-id").value = m.id;
  $("m-name").value = m.full_name;
  $("m-gender").value = m.gender ?? "";
  $("m-dob").value = m.date_of_birth ?? "";
  $("m-village").value = m.village ?? "";
  $("m-phone").value = m.phone ?? "";
  $("m-citizenship").value = m.citizenship ?? "Papua New Guinea";
  $("m-type").value = m.membership_type;
  $("m-place").value = m.place_id;
  $("m-notes").value = m.notes ?? "";
  $("member-form-title").textContent = `Edit member — ${m.full_name}`;
  $("member-submit").textContent = "Save changes";
  $("member-cancel").classList.remove("hidden");
  $("member-form").scrollIntoView({ behavior: "smooth" });
}

function resetMemberForm() {
  $("member-form").reset();
  $("member-id").value = "";
  $("member-form-title").textContent = "Register a member";
  $("member-submit").textContent = "Register member";
  $("member-cancel").classList.add("hidden");
}

$("member-cancel").addEventListener("click", resetMemberForm);

$("member-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMsg(msg);
  const record = {
    full_name: $("m-name").value.trim(),
    gender: $("m-gender").value || null,
    date_of_birth: $("m-dob").value || null,
    village: $("m-village").value.trim() || null,
    phone: $("m-phone").value.trim() || null,
    citizenship: $("m-citizenship").value,
    membership_type: $("m-type").value,
    notes: $("m-notes").value.trim() || null,
    // Chiefs can only use their own place; the database enforces this too.
    place_id: profile.role === "root" ? $("m-place").value : profile.place_id,
  };

  const id = $("member-id").value;
  const { error } = id
    ? await supabase.from("members").update(record).eq("id", id)
    : await supabase.from("members").insert(record);
  if (error) return showMsg(msg, error.message);

  showMsg(msg, id ? "Member updated." : `${record.full_name} registered.`, "ok");
  resetMemberForm();
  loadMembers();
});

$("export-csv").addEventListener("click", () => {
  const cols = ["full_name", "gender", "date_of_birth", "village", "phone", "citizenship", "membership_type", "place", "notes", "created_at"];
  const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const lines = [cols.join(",")].concat(filteredMembers().map((m) =>
    cols.map((c) => esc(c === "place" ? placeName(m.place_id) : m[c])).join(",")));
  const blob = new Blob([lines.join("\r\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `kialikmin-members-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
});

// ---------- Account ----------

$("change-pw-link").addEventListener("click", (e) => {
  e.preventDefault();
  $("pw-panel").classList.toggle("hidden");
});

$("pw-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const { error } = await supabase.auth.updateUser({ password: $("new-pw").value });
  if (error) return showMsg(msg, error.message);
  e.target.reset();
  $("pw-panel").classList.add("hidden");
  showMsg(msg, "Password updated.", "ok");
});

$("logout").addEventListener("click", async (e) => {
  e.preventDefault();
  if (supabase) await supabase.auth.signOut();
  location.href = "login.html";
});

init();
