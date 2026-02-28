import { defineStore } from 'pinia'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

type AuthState = {
  user: User | null
  session: Session | null
  initialized: boolean
  loading: boolean
  error: string | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    session: null,
    initialized: false,
    loading: false,
    error: null,
  }),
  actions: {
    async init() {
      if (this.initialized) return
      this.loading = true
      this.error = null
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        this.error = error.message
      }
      this.session = data.session
      this.user = data.session?.user ?? null
      supabase.auth.onAuthStateChange((_event, session) => {
        this.session = session
        this.user = session?.user ?? null
      })
      this.initialized = true
      this.loading = false
    },
    async signIn(email: string, password: string) {
      this.loading = true
      this.error = null
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        this.error = error.message
        this.loading = false
        return false
      }
      this.session = data.session
      this.user = data.user
      this.loading = false
      return true
    },
    async signOut() {
      this.loading = true
      this.error = null
      const { error } = await supabase.auth.signOut()
      if (error) this.error = error.message
      this.session = null
      this.user = null
      this.loading = false
    },
    async requestPasswordReset(email: string) {
      this.loading = true
      this.error = null
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) {
        this.error = error.message
        this.loading = false
        return false
      }
      this.loading = false
      return true
    },
  },
})

