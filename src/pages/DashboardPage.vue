<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { formatPhp } from '@/utils/currency'

type QuoteStatus = 'Draft' | 'Sent' | 'Approved' | 'Expired'

type QuoteLite = {
  id: string
  status: QuoteStatus
  grand_total_php: number
  quotation_date: string
}

type QuoteItemLite = {
  quote_id: string
  qty: number
  unit_price_php_snapshot: number
  unit_cost_php_snapshot: number
}

const loading = ref(false)
const error = ref<string | null>(null)

const quotes = ref<QuoteLite[]>([])
const items = ref<QuoteItemLite[]>([])

const statusFilter = ref<QuoteStatus[]>([])
const dateFrom = ref<string>('')
const dateTo = ref<string>('')

const filteredQuotes = computed(() => {
  const statuses = statusFilter.value
  const from = dateFrom.value || null
  const to = dateTo.value || null

  return quotes.value.filter((q) => {
    if (statuses.length && !statuses.includes(q.status)) return false
    if (from && q.quotation_date < from) return false
    if (to && q.quotation_date > to) return false
    return true
  })
})

const filteredQuoteIds = computed(() => {
  const s = new Set<string>()
  for (const q of filteredQuotes.value) s.add(q.id)
  return s
})

const quoteById = computed(() => {
  const m = new Map<string, QuoteLite>()
  for (const q of quotes.value) m.set(q.id, q)
  return m
})

const totals = computed(() => {
  const qList = filteredQuotes.value
  const totalQuotations = qList.length
  const draftQuotations = qList.filter((q) => q.status === 'Draft').length
  const approvedQuotations = qList.filter((q) => q.status === 'Approved').length
  const sentQuotations = qList.filter((q) => q.status === 'Sent').length
  const expiredQuotations = qList.filter((q) => q.status === 'Expired').length
  const totalValue = qList.reduce((sum, q) => sum + Number(q.grand_total_php || 0), 0)

  let profitAll = 0
  let profitApproved = 0
  for (const it of items.value) {
    if (!filteredQuoteIds.value.has(it.quote_id)) continue
    const q = quoteById.value.get(it.quote_id)
    if (!q) continue
    const unitProfit = Number(it.unit_price_php_snapshot || 0) - Number(it.unit_cost_php_snapshot || 0)
    const lineProfit = unitProfit * Number(it.qty || 0)
    profitAll += lineProfit
    if (q.status === 'Approved') profitApproved += lineProfit
  }

  return {
    totalQuotations,
    draftQuotations,
    sentQuotations,
    approvedQuotations,
    expiredQuotations,
    totalValue,
    profitAll,
    profitApproved,
  }
})

const statusRows = computed(() => {
  const rows = [
    { status: 'Draft', count: totals.value.draftQuotations },
    { status: 'Sent', count: totals.value.sentQuotations },
    { status: 'Approved', count: totals.value.approvedQuotations },
    { status: 'Expired', count: totals.value.expiredQuotations },
  ]
  return rows
})

async function refresh() {
  loading.value = true
  error.value = null
  try {
    const { data: qData, error: qErr } = await supabase
      .from('quotes')
      .select('id,status,grand_total_php,quotation_date')
      .order('updated_at', { ascending: false })
    if (qErr) throw new Error(qErr.message)
    quotes.value = (qData as QuoteLite[]) ?? []

    const { data: iData, error: iErr } = await supabase
      .from('quote_items')
      .select('quote_id,qty,unit_price_php_snapshot,unit_cost_php_snapshot')
    if (iErr) throw new Error(iErr.message)
    items.value = (iData as QuoteItemLite[]) ?? []
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load dashboard'
  } finally {
    loading.value = false
  }
}

onMounted(refresh)

const statusColumns: any[] = [
  { name: 'status', label: 'Status', field: 'status', align: 'left' },
  { name: 'count', label: 'Count', field: 'count', align: 'right' },
]
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h6">Dashboard</div>
        <div class="text-caption text-grey-5">Quotation analytics overview</div>
      </div>
      <q-space />
      <q-btn flat icon="refresh" label="Refresh" :loading="loading" @click="refresh" />
    </div>

    <q-banner v-if="error" class="bg-negative text-white q-mb-md" rounded>
      {{ error }}
    </q-banner>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-select
          v-model="statusFilter"
          dense
          outlined
          multiple
          clearable
          label="Status filter"
          :options="['Draft', 'Sent', 'Approved', 'Expired']"
        />
      </div>
      <div class="col-12 col-md-3">
        <q-input v-model="dateFrom" dense outlined label="From" type="date" />
      </div>
      <div class="col-12 col-md-3">
        <q-input v-model="dateTo" dense outlined label="To" type="date" />
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7">Total quotations</div>
            <div class="text-h5">{{ totals.totalQuotations }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7">Draft quotations</div>
            <div class="text-h5">{{ totals.draftQuotations }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7">Approved quotations</div>
            <div class="text-h5">{{ totals.approvedQuotations }}</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-3">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-caption text-grey-7">Total quotation value</div>
            <div class="text-h5">{{ formatPhp(totals.totalValue) }}</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mt-md">
      <div class="col-12 col-lg-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1">Status breakdown</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pt-none">
            <q-table
              :rows="statusRows"
              :columns="statusColumns"
              row-key="status"
              flat
              dense
              :loading="loading"
              :pagination="{ rowsPerPage: 10 }"
            />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-lg-6">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle1">Profit estimate</div>
            <div class="text-caption text-grey-5">Based on inventory unit cost snapshots</div>
          </q-card-section>
          <q-separator />
          <q-card-section class="q-pt-none q-gutter-sm">
            <div class="row items-center">
              <div class="text-caption text-grey-7">All quotations</div>
              <q-space />
              <div class="text-subtitle1">{{ formatPhp(totals.profitAll) }}</div>
            </div>
            <div class="row items-center">
              <div class="text-caption text-grey-7">Approved only</div>
              <q-space />
              <div class="text-subtitle1">{{ formatPhp(totals.profitApproved) }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>
