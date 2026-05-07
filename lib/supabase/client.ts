'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Browser-side Supabase client for Client Components.
// Uses the public anon key — safe to expose to the browser.
// RLS enforced server-side: each query is scoped to auth.uid().
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
