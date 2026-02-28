import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'
import { calcGrandTotalPhp, calcLineTotalPhp } from '@/utils/quoteMath'
import { humanizeSupabaseError } from '@/utils/supabaseErrors'

export type QuoteStatus = 'Draft' | 'Sent' | 'Approved' | 'Expired'

export type QuoteRow = {
  id: string
  quotation_no: string
  company_name: string
  system_name: string | null
  quotation_date: string
  valid_until: string
  status: QuoteStatus
  customer_type: string
  customer_name: string
  customer_id: string | null
  currency: string
  vat_inclusive: boolean
  terms_template: string
  grand_total_php: number
  pdf_object_path: string | null
  created_by_user_id: string
  updated_at: string
}

export type QuoteItemRow = {
  id: string
  quote_id: string
  product_id: string
  sku_snapshot: string
  name_snapshot: string
  brand_snapshot: string | null
  image_url_snapshot: string | null
  warranty_notes_snapshot: string | null
  unit_price_php_snapshot: number
  unit_cost_php_snapshot: number
  availability_snapshot: 'available' | 'preorder'
  qty: number
  line_total_php: number
  updated_at: string
}

type QuotesState = {
  list: QuoteRow[]
  listLoading: boolean
  listError: string | null

  current: QuoteRow | null
  items: QuoteItemRow[]
  currentLoading: boolean
  currentError: string | null

  autosavePending: boolean
  autosaveError: string | null
}

const DEFAULT_TERMS =
  '• Quoted prices are in Philippine Peso, VAT Inclusive.\n' +
  '• Payment Terms: Thirty (30) days upon delivery of goods.\n' +
  '• Order Basis and Delivery Leadtime is 2 to 3 months upon receipt of your irrevocable purchase order.\n' +
  '• Free delivery to customer.\n' +
  '• A cancellation fee of twenty percent (20%) of purchase order value shall be imposed for cancellation made two (2) weeks after receipt of purchase order.\n' +
  '• Price valid until {VALID_UNTIL}.'

function addDaysISO(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export const useQuotesStore = defineStore('quotes', {
  state: (): QuotesState => ({
    list: [],
    listLoading: false,
    listError: null,
    current: null,
    items: [],
    currentLoading: false,
    currentError: null,
    autosavePending: false,
    autosaveError: null,
  }),
  getters: {
    grandTotalPhp: (s) => calcGrandTotalPhp(s.items.map((it) => ({ qty: it.qty, unitPricePhp: it.unit_price_php_snapshot }))),
  },
  actions: {
    async loadList() {
      this.listLoading = true
      this.listError = null
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('updated_at', { ascending: false })
      if (error) {
        this.listError = error.message
        this.list = []
        this.listLoading = false
        return
      }
      this.list = (data as QuoteRow[]) ?? []
      this.listLoading = false
    },
    async createDraft() {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw new Error(userError.message)
      const userId = userData.user?.id
      if (!userId) throw new Error('Not authenticated')

      const quotationDate = todayISO()
      const validUntil = addDaysISO(28)
      const terms = DEFAULT_TERMS.replace('{VALID_UNTIL}', validUntil)
      const payload = {
        company_name: 'Symbol Science Quotation Management',
        system_name: null,
        quotation_date: quotationDate,
        valid_until: validUntil,
        status: 'Draft' as QuoteStatus,
        customer_type: 'Walk-in',
        customer_name: 'Walk-in Customer',
        customer_id: null,
        currency: 'PHP',
        vat_inclusive: true,
        terms_template: terms,
        grand_total_php: 0,
        created_by_user_id: userId,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await supabase.from('quotes').insert(payload).select('*').single()
      if (error) throw new Error(error.message)
      return data as QuoteRow
    },
    async loadQuote(id: string) {
      this.currentLoading = true
      this.currentError = null
      const { data: quote, error: quoteError } = await supabase.from('quotes').select('*').eq('id', id).single()
      if (quoteError) {
        this.currentError = quoteError.message
        this.current = null
        this.items = []
        this.currentLoading = false
        return
      }
      const { data: items, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', id)
        .order('updated_at', { ascending: false })
      if (itemsError) {
        this.currentError = itemsError.message
        this.current = quote as QuoteRow
        this.items = []
        this.currentLoading = false
        return
      }
      this.current = quote as QuoteRow
      this.items = (items as QuoteItemRow[]) ?? []
      this.currentLoading = false
    },
    async updateQuote(patch: Partial<QuoteRow>) {
      if (!this.current) return
      const payload = { ...patch, updated_at: new Date().toISOString() }
      const { data, error } = await supabase.from('quotes').update(payload).eq('id', this.current.id).select('*').single()
      if (error) throw new Error(error.message)
      this.current = data as QuoteRow
    },
    async deleteQuote(id: string) {
      const { error } = await supabase.from('quotes').delete().eq('id', id)
      if (error) throw new Error(humanizeSupabaseError(error.message))
      this.list = this.list.filter((q) => q.id !== id)
      if (this.current?.id === id) {
        this.current = null
        this.items = []
      }
    },
    async addItemFromProduct(product: {
      id: string
      sku: string
      name: string
      brand: string | null
      image_url: string | null
      unit_price_php: number
      unit_cost_php: number
      availability: 'available' | 'preorder'
      warranty_notes: string | null
    }) {
      if (!this.current) return
      const qty = 1
      const unitPrice = product.unit_price_php
      const lineTotal = calcLineTotalPhp(qty, unitPrice)
      const payload = {
        quote_id: this.current.id,
        product_id: product.id,
        sku_snapshot: product.sku,
        name_snapshot: product.name,
        brand_snapshot: product.brand,
        image_url_snapshot: product.image_url,
        warranty_notes_snapshot: product.warranty_notes,
        unit_price_php_snapshot: unitPrice,
        unit_cost_php_snapshot: product.unit_cost_php,
        availability_snapshot: product.availability,
        qty,
        line_total_php: lineTotal,
        updated_at: new Date().toISOString(),
      }
      const { data, error } = await supabase.from('quote_items').insert(payload).select('*').single()
      if (error) throw new Error(error.message)
      this.items = [data as QuoteItemRow, ...this.items]
      await this.recomputeAndPersistTotal()
    },
    async removeItem(itemId: string) {
      if (!this.current) return
      const { error } = await supabase.from('quote_items').delete().eq('id', itemId)
      if (error) throw new Error(error.message)
      this.items = this.items.filter((it) => it.id !== itemId)
      await this.recomputeAndPersistTotal()
    },
    async setItemQty(itemId: string, qty: number) {
      const item = this.items.find((it) => it.id === itemId)
      if (!item) return
      const nextQty = Math.max(1, Math.floor(qty || 1))
      item.qty = nextQty
      item.line_total_php = calcLineTotalPhp(item.qty, item.unit_price_php_snapshot)
      item.updated_at = new Date().toISOString()
      this.scheduleAutosave()
    },
    scheduleAutosave() {
      if (this.autosavePending) return
      this.autosavePending = true
      this.autosaveError = null
      setTimeout(async () => {
        try {
          await this.flushAutosave()
        } catch (e) {
          this.autosaveError = e instanceof Error ? e.message : 'Autosave failed'
        } finally {
          this.autosavePending = false
        }
      }, 500)
    },
    async flushAutosave() {
      if (!this.current) return
      const updates = this.items.map((it) => ({
        id: it.id,
        qty: it.qty,
        line_total_php: it.line_total_php,
        updated_at: it.updated_at,
      }))
      const { error } = await supabase.from('quote_items').upsert(updates)
      if (error) throw new Error(error.message)
      await this.recomputeAndPersistTotal()
    },
    async recomputeAndPersistTotal() {
      if (!this.current) return
      const total = calcGrandTotalPhp(this.items.map((it) => ({ qty: it.qty, unitPricePhp: it.unit_price_php_snapshot })))
      await this.updateQuote({ grand_total_php: total })
    },
  },
})
