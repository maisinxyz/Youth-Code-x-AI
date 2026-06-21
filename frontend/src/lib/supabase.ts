import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://slfopkertwmqsejkrvok.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_RlHrZfuJJ7m3O86SzChSww_1HD1kJcQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
