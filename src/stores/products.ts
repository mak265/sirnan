import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'

export type ProductRow = {
  id: string
  sku: string
  name: string
  brand: string | null
  image_url: string | null
  unit_price_php: number
  unit_cost_php: number
  availability: 'available' | 'preorder'
  warranty_notes: string | null
  stock_on_hand: number
  active: boolean
  updated_at: string
}

type ProductsState = {
  items: ProductRow[]
  loading: boolean
  error: string | null
}

export const useProductsStore = defineStore('products', {
  state: (): ProductsState => ({
    items: [],
    loading: false,
    error: null,
  }),
  getters: {
    byId: (s) => (id: string) => s.items.find((p) => p.id === id) ?? null,
  },
  actions: {
    async loadAll() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) {
        this.error = error.message
        this.items = []
        this.loading = false
        return
      }
      this.items = (data as ProductRow[]) ?? []
      this.loading = false
    },
    async upsert(
      product: Partial<ProductRow> & {
        sku: string
        name: string
        unit_price_php: number
        unit_cost_php: number
        availability: 'available' | 'preorder'
      },
    ) {
      this.loading = true
      this.error = null
      const payload = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        brand: product.brand ?? null,
        image_url: product.image_url ?? null,
        unit_price_php: product.unit_price_php,
        unit_cost_php: product.unit_cost_php,
        availability: product.availability,
        warranty_notes: product.warranty_notes ?? null,
        stock_on_hand: product.stock_on_hand ?? 0,
        active: product.active ?? true,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('products').upsert(payload)
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
