import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'

export type CustomerRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  address_text: string | null
  updated_at: string
}

type CustomersState = {
  items: CustomerRow[]
  loading: boolean
  error: string | null
}

export const useCustomersStore = defineStore('customers', {
  state: (): CustomersState => ({
    items: [],
    loading: false,
    error: null,
  }),
  getters: {
    byId: (s) => (id: string) => s.items.find((c) => c.id === id) ?? null,
  },
  actions: {
    async loadAll() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) {
        this.error = error.message
        this.items = []
        this.loading = false
        return
      }
      this.items = (data as CustomerRow[]) ?? []
      this.loading = false
    },
    async upsert(customer: Partial<CustomerRow> & { name: string }) {
      this.loading = true
      this.error = null
      const payload = {
        id: customer.id,
        name: customer.name,
        email: customer.email ?? null,
        phone: customer.phone ?? null,
        address_text: customer.address_text ?? null,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('customers').upsert(payload)
      if (error) {
        this.error = error.message
        this.loading = false
        return false
      }
      await this.loadAll()
      this.loading = false
      return true
    },
  },
})

