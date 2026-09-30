import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://iyvxwgsrwhosdomxrfko.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_jAzAn_RfNDb9eug_V_PZLg_Q7rfJaRr";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
