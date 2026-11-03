import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const isConfigured = SUPABASE_URL.startsWith("https://");

export const supabase = isConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export function showMsg(el, text, type = "error") {
  el.textContent = text;
  el.className = `msg ${type}`;
}

export function hideMsg(el) {
  el.className = "msg hidden";
}
