<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InventoryPickerDialog from '@/components/InventoryPickerDialog.vue'
import QuoteStatusPill from '@/components/QuoteStatusPill.vue'
import { useQuotesStore, type QuoteStatus } from '@/stores/quotes'
import { useProductsStore } from '@/stores/products'
import { useCustomersStore } from '@/stores/customers'
import { useStockRulesStore } from '@/stores/stockRules'
import { formatPhp } from '@/utils/currency'
import { buildQuotePdfBlob, tryFetchImageDataUrl } from '@/utils/pdf/quotePdf'
import { imageUrlToPngDataUrl } from '@/utils/image'
import { useAuthStore } from '@/stores/auth'
import type { QTableProps } from 'quasar'
import { DEFAULT_COMPANY_NAME, LOGO_URL } from '@/branding'

const route = useRoute()
const router = useRouter()

const quotes = useQuotesStore()
const products = useProductsStore()
const customers = useCustomersStore()
const stockRules = useStockRulesStore()
const auth = useAuthStore()

const pickerOpen = ref(false)

const quoteId = computed(() => String(route.params.id))

onMounted(async () => {
  await auth.init()
  await Promise.all([quotes.loadQuote(quoteId.value), products.loadAll(), customers.loadAll(), stockRules.load()])
})

watch(
  () => quoteId.value,
  async () => {
    await quotes.loadQuote(quoteId.value)
  },
)

const customerOptions = computed(() => {
  const base = customers.items.map((c) => ({ label: c.name, value: c.id }))
  return [{ label: 'Walk-in Customer', value: 'walkin' }, ...base]
})

const selectedCustomer = computed({
  get() {
    const q = quotes.current
    if (!q) return null
    if (!q.customer_id) return 'walkin'
    return q.customer_id
  },
  async set(v: string | null) {
    if (!quotes.current) return
    if (!v || v === 'walkin') {
      await quotes.updateQuote({ customer_id: null, customer_type: 'Walk-in', customer_name: 'Walk-in Customer' })
      return
    }
    const c = customers.byId(v)
    await quotes.updateQuote({ customer_id: v, customer_type: 'Registered', customer_name: c?.name ?? 'Customer' })
  },
})

const violations = computed(() => {
  return quotes.items
    .map((it) => {
      const p = products.byId(it.product_id)
      const available = p?.stock_on_hand ?? 0
      const ok = it.qty <= available
      return { item: it, available, ok }
    })
    .filter((v) => !v.ok)
})

const hasStockViolation = computed(() => violations.value.length > 0)

function canMarkSent(): boolean {
  if (stockRules.mode !== 'block_on_send') return true
  return !hasStockViolation.value
}

const statusOptions: QuoteStatus[] = ['Draft', 'Sent', 'Approved', 'Expired']

async function setStatus(next: QuoteStatus) {
  if (!quotes.current) return
  if (next === 'Sent' && !canMarkSent()) return
  await quotes.updateQuote({ status: next })
}

async function exportPdf(finalMode: boolean) {
  if (!quotes.current) return
  if (finalMode && !canMarkSent()) return

  const imgCache = new Map<string, string | null>()
  const items = []
  for (const it of quotes.items) {
    let imageDataUrl: string | null = null
    if (it.image_url_snapshot) {
      if (imgCache.has(it.image_url_snapshot)) {
        imageDataUrl = imgCache.get(it.image_url_snapshot) ?? null
      } else {
        imageDataUrl = await tryFetchImageDataUrl(it.image_url_snapshot)
        imgCache.set(it.image_url_snapshot, imageDataUrl)
      }
    }
    items.push({
      sku: it.sku_snapshot,
      name: it.name_snapshot,
      notes:
        [
          it.warranty_notes_snapshot,
          it.availability_snapshot === 'preorder' ? 'Availability: Pre-order' : null,
        ]
          .filter(Boolean)
          .join('\n') || null,
      imageDataUrl,
      qty: it.qty,
      unitPricePhp: it.unit_price_php_snapshot,
      lineTotalPhp: it.line_total_php,
    })
  }

  const createdAtLabel = new Date().toLocaleString('en-PH', { dateStyle: 'short', timeStyle: 'short' })
  const quotationDateLabel = quotes.current.quotation_date || '-'
  const validUntilLabel = quotes.current.valid_until || '-'

  const blob = await buildQuotePdfBlob({
    quotationNo: quotes.current.quotation_no,
    companyName: quotes.current.company_name || DEFAULT_COMPANY_NAME,
    logoDataUrl: await imageUrlToPngDataUrl(LOGO_URL),
    createdAtLabel,
    quotationDateLabel,
    validUntilLabel,
    statusLabel: quotes.current.status,
    customerName: quotes.current.customer_name,
    items,
    grandTotalPhp: quotes.current.grand_total_php,
    terms: quotes.current.terms_template,
    signedByLabel: (auth.user?.email ?? 'admin').split('@')[0],
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Quotation-${quotes.current.quotation_no}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

async function addProduct(p: any) {
  await quotes.addItemFromProduct(p)
}

function backToList() {
  router.push('/quotes')
}

const tableColumns = [
  { name: 'desc', label: 'PART NUMBER / DESCRIPTION', field: 'sku_snapshot', align: 'left' as const },
  { name: 'img', label: 'PRODUCT IMAGE', field: 'image_url_snapshot', align: 'center' as const },
  { name: 'qty', label: 'QTY', field: 'qty', align: 'center' as const },
  { name: 'unit', label: 'UNIT PRICE', field: 'unit_price_php_snapshot', align: 'right' as const },
  { name: 'total', label: 'TOTAL', field: 'line_total_php', align: 'right' as const },
  { name: 'actions', label: '', field: 'id', align: 'right' as const },
] satisfies NonNullable<QTableProps['columns']>
</script>

<template>
  <q-page class="q-pa-md">
    <q-banner v-if="quotes.currentError" class="bg-negative text-white q-mb-md" rounded>
      {{ quotes.currentError }}
    </q-banner>

    <div v-if="quotes.current" class="q-gutter-y-md">
      <div class="row items-center">
        <div>
          <div class="text-h6">Quotation - {{ quotes.current.quotation_no }}</div>
          <div class="row items-center q-gutter-x-sm">
            <QuoteStatusPill :status="quotes.current.status" />
            <div class="text-caption text-grey-5">Auto-saved draft changes</div>
          </div>
        </div>
        <q-space />
        <q-btn flat icon="arrow_back" label="Back" no-caps @click="backToList" />
      </div>

      <div class="row q-col-gutter-md">
        <div class="col-12 col-lg-8">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-subtitle1">Quote Details</div>
            </q-card-section>

            <q-separator />

            <q-card-section class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-input
                  outlined
                  dense
                  label="Quotation Date"
                  type="date"
                  :model-value="quotes.current.quotation_date"
                  @update:model-value="quotes.updateQuote({ quotation_date: String($event) })"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  outlined
                  dense
                  label="Valid Until"
                  type="date"
                  :model-value="quotes.current.valid_until"
                  @update:model-value="quotes.updateQuote({ valid_until: String($event) })"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-select
                  outlined
                  dense
                  label="Status"
                  :model-value="quotes.current.status"
                  :options="statusOptions"
                  @update:model-value="setStatus($event as any)"
                />
                <div v-if="quotes.current.status !== 'Sent' && !canMarkSent()" class="text-caption text-warning q-mt-xs">
                  Requested quantity exceeds available stock. Resolve before marking as Sent.
                </div>
              </div>

              <div class="col-12 col-md-6">
                <q-select
                  outlined
                  dense
                  label="Customer"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  :options="customerOptions"
                  :model-value="selectedCustomer"
                  @update:model-value="selectedCustomer = $event"
                />
              </div>
              <div class="col-12 col-md-6">
                <q-input
                  outlined
                  dense
                  label="Customer Name"
                  :model-value="quotes.current.customer_name"
                  @update:model-value="quotes.updateQuote({ customer_name: String($event) })"
                />
              </div>
            </q-card-section>
          </q-card>

          <q-card flat bordered>
            <q-card-section class="row items-center">
              <div class="text-subtitle1">Line Items</div>
              <q-space />
              <q-btn color="primary" icon="add" label="Add from Inventory" @click="pickerOpen = true" />
            </q-card-section>
            <q-separator />
            <q-card-section class="q-pt-none">
              <q-table
                :rows="quotes.items"
                :columns="tableColumns"
                row-key="id"
                flat
                dense
                class="bg-white"
                :pagination="{ rowsPerPage: 8 }"
              >
                <template #body-cell-desc="slotProps">
                  <q-td :props="slotProps">
                    <div class="text-weight-bold">{{ slotProps.row.sku_snapshot }}</div>
                    <div>{{ slotProps.row.name_snapshot }}</div>
                    <div v-if="slotProps.row.availability_snapshot === 'preorder'" class="q-mt-xs">
                      <q-badge color="warning" text-color="black" label="Pre-order" />
                    </div>
                    <div v-if="slotProps.row.warranty_notes_snapshot" class="text-caption text-grey-7 q-mt-xs">
                      {{ slotProps.row.warranty_notes_snapshot }}
                    </div>
                    <div v-if="products.byId(slotProps.row.product_id) && slotProps.row.qty > (products.byId(slotProps.row.product_id)?.stock_on_hand ?? 0)" class="text-caption text-warning q-mt-xs">
                      Stock warning: available {{ products.byId(slotProps.row.product_id)?.stock_on_hand ?? 0 }}
                    </div>
                  </q-td>
                </template>
                <template #body-cell-img="slotProps">
                  <q-td :props="slotProps" class="text-center">
                    <q-img
                      v-if="slotProps.row.image_url_snapshot"
                      :src="slotProps.row.image_url_snapshot"
                      style="width: 54px; height: 70px"
                      fit="contain"
                      spinner-color="primary"
                    />
                  </q-td>
                </template>
                <template #body-cell-qty="slotProps">
                  <q-td :props="slotProps" class="text-center">
                    <q-input
                      dense
                      outlined
                      type="number"
                      style="width: 80px"
                      :model-value="slotProps.row.qty"
                      @update:model-value="quotes.setItemQty(slotProps.row.id, Number($event))"
                      :min="1"
                    />
                  </q-td>
                </template>
                <template #body-cell-unit="slotProps">
                  <q-td :props="slotProps" class="text-right">
                    {{ formatPhp(slotProps.row.unit_price_php_snapshot) }}
                  </q-td>
                </template>
                <template #body-cell-total="slotProps">
                  <q-td :props="slotProps" class="text-right">
                    {{ formatPhp(slotProps.row.line_total_php) }}
                  </q-td>
                </template>
                <template #body-cell-actions="slotProps">
                  <q-td :props="slotProps" class="text-right">
                    <q-btn dense flat icon="delete" color="negative" @click="quotes.removeItem(slotProps.row.id)" />
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>

          <q-card flat bordered>
            <q-card-section>
              <div class="text-subtitle1">Terms & Conditions</div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <q-input
                outlined
                type="textarea"
                autogrow
                :model-value="quotes.current.terms_template"
                @update:model-value="quotes.updateQuote({ terms_template: String($event) })"
              />
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-lg-4">
          <q-card flat bordered>
            <q-card-section>
              <div class="text-subtitle1">Summary</div>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <div class="row items-center">
                <div class="text-caption text-grey-7">Grand Total (PHP, VAT Inclusive)</div>
                <q-space />
                <div class="text-h6">{{ formatPhp(quotes.current.grand_total_php) }}</div>
              </div>
              <q-banner v-if="hasStockViolation" class="bg-warning text-black q-mt-md" rounded>
                <div class="text-weight-bold">Stock warning</div>
                <div class="text-caption">Some items exceed available stock.</div>
                <div class="q-mt-sm">
                  <div v-for="v in violations" :key="v.item.id" class="text-caption">
                    {{ v.item.sku_snapshot }}: requested {{ v.item.qty }}, available {{ v.available }}
                  </div>
                </div>
              </q-banner>
            </q-card-section>
            <q-separator />
            <q-card-actions align="right">
              <q-btn flat label="Download PDF" icon="picture_as_pdf" no-caps @click="exportPdf(false)" />
              <q-btn
                color="primary"
                label="Final PDF Export"
                icon="task_alt"
                no-caps
                :disable="!canMarkSent()"
                @click="exportPdf(true)"
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>

      <InventoryPickerDialog
        v-model="pickerOpen"
        :products="products.items"
        @select="addProduct"
      />
    </div>

    <div v-else class="text-grey-5">Loading…</div>
  </q-page>
</template>
