import { createClient } from '@supabase/supabase-js'

function mustGetEnv(name: string): string {
  const value = import.meta.env[name]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing env var: ${name}`)
  }
  return value
}

export const supabase = createClient(
  mustGetEnv('VITE_SUPABASE_URL'),
  mustGetEnv('VITE_SUPABASE_ANON_KEY'),
)

