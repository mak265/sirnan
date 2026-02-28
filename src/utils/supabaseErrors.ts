export function humanizeSupabaseError(message: string): string {
  const m = String(message || '')
  if (m.toLowerCase().includes('stack depth limit exceeded')) {
    return (
      'Database policy error (stack depth limit exceeded). ' +
      'Apply migration supabase/migrations/0004_fix_is_admin_stack_depth.sql in Supabase SQL Editor.'
    )
  }
  return m
}

