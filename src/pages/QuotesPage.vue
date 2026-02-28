<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Dialog, Notify } from 'quasar'
import { useQuotesStore } from '@/stores/quotes'
import QuoteStatusPill from '@/components/QuoteStatusPill.vue'
import { formatPhp } from '@/utils/currency'

const router = useRouter()
const quotes = useQuotesStore()

const statusFilter = ref<string | null>(null)
const search = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return quotes.list
    .filter((r) => (statusFilter.value ? r.status === statusFilter.value : true))
    .filter((r) => (!q ? true : `${r.quotation_no} ${r.customer_name}`.toLowerCase().includes(q)))
})

const columns: any[] = [
  { name: 'quotation_no', label: 'Quote #', field: 'quotation_no', align: 'left', sortable: true },
  { name: 'quotation_date', label: 'Date', field: 'quotation_date', align: 'left', sortable: true },
  { name: 'customer_name', label: 'Customer', field: 'customer_name', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'left', sortable: true },
  { name: 'grand_total_php', label: 'Total', field: 'grand_total_php', align: 'right', sortable: true },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

onMounted(async () => {
  await quotes.loadList()
})

async function createQuote() {
  const q = await quotes.createDraft()
  await quotes.loadList()
  await router.push(`/quotes/${q.id}`)
}

function openQuote(id: string) {
  router.push(`/quotes/${id}`)
}

async function confirmDelete(id: string, label: string) {
  Dialog.create({
    title: 'Delete quotation',
    message: `Delete ${label}? This cannot be undone.`,
    cancel: true,
    persistent: true,
  })
    .onOk(async () => {
      try {
        await quotes.deleteQuote(id)
        await quotes.loadList()
        Notify.create({ type: 'positive', message: 'Deleted.' })
      } catch (e) {
        Notify.create({ type: 'negative', message: e instanceof Error ? e.message : 'Delete failed' })
      }
    })
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h6">Quotes</div>
        <div class="text-caption text-grey-5">Create, edit, duplicate, export PDF</div>
      </div>
      <q-space />
      <q-btn color="primary" icon="add" label="New Quote" @click="createQuote" />
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-3">
        <q-select
          v-model="statusFilter"
          dense
          outlined
          clearable
          label="Status"
          :options="['Draft', 'Sent', 'Approved', 'Expired']"
        />
      </div>
      <div class="col-12 col-md-6">
        <q-input v-model="search" dense outlined label="Search" placeholder="Quote # or customer" />
      </div>
      <div class="col-12 col-md-3 row justify-end items-center">
        <q-btn flat icon="refresh" label="Refresh" @click="quotes.loadList" />
      </div>
    </div>

    <q-banner v-if="quotes.listError" class="bg-negative text-white q-mb-md" rounded>
      {{ quotes.listError }}
    </q-banner>

    <q-table
      :rows="filtered"
      :columns="columns"
      row-key="id"
      flat
      :loading="quotes.listLoading"
      :pagination="{ rowsPerPage: 10 }"
    >
      <template #body-cell-status="slotProps">
        <q-td :props="slotProps">
          <QuoteStatusPill :status="slotProps.row.status" />
        </q-td>
      </template>
      <template #body-cell-grand_total_php="slotProps">
        <q-td :props="slotProps" class="text-right">
          {{ formatPhp(slotProps.row.grand_total_php) }}
        </q-td>
      </template>
      <template #body-cell-actions="slotProps">
        <q-td :props="slotProps" class="text-right">
          <q-btn dense flat icon="open_in_new" label="Open" no-caps @click="openQuote(slotProps.row.id)" />
          <q-btn
            dense
            flat
            color="negative"
            icon="delete"
            label="Delete"
            no-caps
            @click="confirmDelete(slotProps.row.id, slotProps.row.quotation_no)"
          />
        </q-td>
      </template>
    </q-table>
  </q-page>
</template>
