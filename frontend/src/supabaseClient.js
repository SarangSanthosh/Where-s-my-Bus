import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ebjlrvevjnhxptsqnvbi.supabase.co";  // replace with your URL
const SUPABASE_ANON_KEY = "ebjlrvevjnhxptsqnvbi";                   // replace with your anon key

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
