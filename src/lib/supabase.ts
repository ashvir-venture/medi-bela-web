import type { SupabaseClient } from '@supabase/supabase-js'

// Only the publishable (anon) key ever reaches the browser. The service_role key is
// never used in this project: every protected action goes through RPCs that check
// auth.uid() inside the database.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigured = Boolean(url && key)

let clientPromise: Promise<SupabaseClient | null> | null = null

/**
 * Lazily loads supabase-js (keeps it out of the landing page's first bundle) and
 * returns one shared client. Returns null when env vars are missing so the UI can
 * show a friendly "not set up yet" state instead of crashing.
 */
export function getSupabase(): Promise<SupabaseClient | null> {
  if (!supabaseConfigured) return Promise.resolve(null)
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url!, key!, {
      auth: {
        flowType: 'pkce', // code exchange on /[lang]/auth/callback
        persistSession: true, // session lives in localStorage
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }),
  )
  return clientPromise
}
