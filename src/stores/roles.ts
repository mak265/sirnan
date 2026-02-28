import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'
import { humanizeSupabaseError } from '@/utils/supabaseErrors'

type Role = 'admin' | 'sales'

type RolesState = {
  role: Role | null
  loading: boolean
  error: string | null
}

export const useRolesStore = defineStore('roles', {
  state: (): RolesState => ({
    role: null,
    loading: false,
    error: null,
  }),
  actions: {
    async loadMyRole() {
      this.loading = true
      this.error = null
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        this.error = userError.message
        this.role = 'sales'
        this.loading = false
        return
      }
      const userId = userData.user?.id
      if (!userId) {
        this.role = 'sales'
        this.loading = false
        return
      }
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()
      if (error) {
        this.error = humanizeSupabaseError(error.message)
        this.role = 'sales'
        this.loading = false
        return
      }
      this.role = (data?.role as Role | null) ?? 'sales'
      this.loading = false
    },
  },
})
