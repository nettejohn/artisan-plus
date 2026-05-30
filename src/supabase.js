import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession:    true,   // session conservée dans localStorage
    autoRefreshToken:  true,   // rafraîchissement automatique du JWT
    detectSessionInUrl: true,  // gère les magic links / OAuth callbacks
    storageKey: 'artisan-plus-auth',
  },
})
