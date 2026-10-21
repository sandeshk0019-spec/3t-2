import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://iyvxwgsrwhosdomxrfko.supabase.co";

// On server-side API routes, prefer SUPABASE_SERVICE_ROLE_KEY to bypass RLS policies
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_jAzAn_RfNDb9eug_V_PZLg_Q7rfJaRr";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
