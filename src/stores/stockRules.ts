import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'

export type StockRuleMode = 'warn_only' | 'block_on_send'

type StockRulesState = {
  mode: StockRuleMode
  loading: boolean
  error: string | null
}

export const useStockRulesStore = defineStore('stockRules', {
  state: (): StockRulesState => ({
    mode: 'block_on_send',
    loading: false,
    error: null,
  }),
  actions: {
    async load() {
      this.loading = true
      this.error = null
      const { data, error } = await supabase.from('stock_rules').select('mode').limit(1).maybeSingle()
      if (error) {
        this.error = error.message
        this.loading = false
        return
      }
      this.mode = (data?.mode as StockRuleMode | null) ?? 'block_on_send'
      this.loading = false
    },
  },
})

