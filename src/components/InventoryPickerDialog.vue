<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { ProductRow } from '@/stores/products'

const props = defineProps<{
  modelValue: boolean
  products: ProductRow[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'select', product: ProductRow): void
}>()

const search = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.products.filter((p) => p.active)
  return props.products
    .filter((p) => p.active)
    .filter((p) => `${p.sku} ${p.name} ${p.brand ?? ''}`.toLowerCase().includes(q))
})

watch(
  () => props.modelValue,
  (v) => {
    if (v) search.value = ''
  },
)

const columns: any[] = [
  { name: 'sku', label: 'SKU', field: 'sku', align: 'left', sortable: true },
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'availability', label: 'Availability', field: 'availability', align: 'left', sortable: true },
  { name: 'price', label: 'Unit Price', field: 'unit_price_php', align: 'right', sortable: true },
  { name: 'stock', label: 'Stock', field: 'stock_on_hand', align: 'right', sortable: true },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

function close() {
  emit('update:modelValue', false)
}

function selectRow(p: ProductRow) {
  emit('select', p)
  close()
}
</script>

<template>
  <q-dialog :model-value="props.modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="width: 920px; max-width: 92vw">
      <q-card-section class="row items-center q-pb-sm">
        <div class="text-h6">Add from Inventory</div>
        <q-space />
        <q-btn flat round icon="close" @click="close" />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input v-model="search" dense outlined placeholder="Search SKU / name / brand" />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-table
          :rows="filtered"
          :columns="columns"
          row-key="id"
          flat
          dense
          :pagination="{ rowsPerPage: 8 }"
        >
          <template #body-cell-availability="slotProps">
            <q-td :props="slotProps">
              <q-badge v-if="slotProps.row.availability === 'preorder'" color="warning" text-color="black" label="Pre-order" />
              <q-badge v-else color="positive" label="Available" />
            </q-td>
          </template>
          <template #body-cell-price="slotProps">
            <q-td :props="slotProps" class="text-right">
              {{ new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(slotProps.row.unit_price_php) }}
            </q-td>
          </template>
          <template #body-cell-actions="slotProps">
            <q-td :props="slotProps" class="text-right">
              <q-btn color="primary" dense label="Select" @click="selectRow(slotProps.row)" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>
