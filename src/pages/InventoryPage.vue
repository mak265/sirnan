<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useProductsStore, type ProductRow } from '@/stores/products'
import { useRolesStore } from '@/stores/roles'

const products = useProductsStore()
const roles = useRolesStore()

const search = ref('')
const availabilityFilter = ref<'all' | 'available' | 'preorder'>('all')
const activeOnly = ref(true)
const editorOpen = ref(false)
const editing = ref<Partial<ProductRow> | null>(null)

onMounted(async () => {
  await roles.loadMyRole()
  await products.loadAll()
})

const canEdit = computed(() => roles.role === 'admin')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return products.items
    .filter((p) => (activeOnly.value ? p.active : true))
    .filter((p) => (availabilityFilter.value === 'all' ? true : p.availability === availabilityFilter.value))
    .filter((p) => (!q ? true : `${p.sku} ${p.name} ${p.brand ?? ''}`.toLowerCase().includes(q)))
})

const columns: any[] = [
  { name: 'sku', label: 'SKU', field: 'sku', align: 'left', sortable: true },
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'availability', label: 'Availability', field: 'availability', align: 'left', sortable: true },
  { name: 'unit_price_php', label: 'Unit Price', field: 'unit_price_php', align: 'right', sortable: true },
  { name: 'unit_cost_php', label: 'Unit Cost', field: 'unit_cost_php', align: 'right', sortable: true },
  { name: 'stock_on_hand', label: 'Stock', field: 'stock_on_hand', align: 'right', sortable: true },
  { name: 'active', label: 'Active', field: 'active', align: 'left', sortable: true },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

function openNew() {
  editing.value = { sku: '', name: '', availability: 'available', unit_price_php: 0, unit_cost_php: 0, stock_on_hand: 0, active: true }
  editorOpen.value = true
}

function openEdit(p: ProductRow) {
  editing.value = { ...p }
  editorOpen.value = true
}

async function save() {
  if (!editing.value) return
  await products.upsert({
    id: editing.value.id,
    sku: String(editing.value.sku || '').trim(),
    name: String(editing.value.name || '').trim(),
    brand: (editing.value.brand as string | undefined) ?? null,
    image_url: (editing.value.image_url as string | undefined) ?? null,
    warranty_notes: (editing.value.warranty_notes as string | undefined) ?? null,
    availability: ((editing.value.availability as any) ?? 'available') === 'preorder' ? 'preorder' : 'available',
    unit_price_php: Number(editing.value.unit_price_php || 0),
    unit_cost_php: Number(editing.value.unit_cost_php || 0),
    stock_on_hand: Number(editing.value.stock_on_hand || 0),
    active: Boolean(editing.value.active),
  } as any)
  if (!products.error) editorOpen.value = false
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h6">Inventory</div>
        <div class="text-caption text-grey-5">Products are the only source of quote items</div>
      </div>
      <q-space />
      <q-btn v-if="canEdit" color="primary" icon="add" label="New Product" @click="openNew" />
    </div>

    <q-banner v-if="roles.role !== 'admin'" class="bg-grey-2 text-grey-8 q-mb-md" rounded>
      Read-only access. To manage inventory, your user must be assigned the <b>admin</b> role in `public.user_roles`.
    </q-banner>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <q-input v-model="search" dense outlined label="Search" placeholder="SKU / name / brand" />
      </div>
      <div class="col-12 col-md-4">
        <q-select
          v-model="availabilityFilter"
          dense
          outlined
          emit-value
          map-options
          label="Availability"
          :options="[
            { label: 'All', value: 'all' },
            { label: 'Available', value: 'available' },
            { label: 'Pre-order', value: 'preorder' },
          ]"
        />
      </div>
      <div class="col-12 col-md-4 row justify-end items-center q-gutter-sm">
        <q-toggle v-model="activeOnly" label="Active only" />
        <q-btn flat icon="refresh" label="Refresh" @click="products.loadAll" />
      </div>
    </div>

    <q-banner v-if="products.error" class="bg-negative text-white q-mb-md" rounded>
      {{ products.error }}
    </q-banner>

    <q-table
      :rows="filtered"
      :columns="columns"
      row-key="id"
      flat
      dense
      :loading="products.loading"
      :pagination="{ rowsPerPage: 10 }"
    >
      <template #body-cell-unit_price_php="slotProps">
        <q-td :props="slotProps" class="text-right">
          {{ new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(slotProps.row.unit_price_php) }}
        </q-td>
      </template>
      <template #body-cell-unit_cost_php="slotProps">
        <q-td :props="slotProps" class="text-right">
          {{ new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(slotProps.row.unit_cost_php) }}
        </q-td>
      </template>
      <template #body-cell-availability="slotProps">
        <q-td :props="slotProps">
          <q-badge v-if="slotProps.row.availability === 'preorder'" color="warning" text-color="black" label="Pre-order" />
          <q-badge v-else color="positive" label="Available" />
        </q-td>
      </template>
      <template #body-cell-actions="slotProps">
        <q-td :props="slotProps" class="text-right">
          <q-btn v-if="canEdit" dense flat icon="edit" label="Edit" no-caps @click="openEdit(slotProps.row)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="editorOpen">
      <q-card style="width: 540px; max-width: 92vw">
        <q-card-section class="row items-center">
          <div class="text-h6">Product</div>
          <q-space />
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="q-pt-none q-gutter-md">
          <q-input v-model="editing!.sku" dense outlined label="SKU" />
          <q-input v-model="editing!.name" dense outlined label="Name" />
          <q-input v-model="editing!.brand" dense outlined label="Brand (optional)" />
          <q-input v-model="editing!.image_url" dense outlined label="Image URL (optional)" />
          <q-input v-model="editing!.warranty_notes" dense outlined label="Warranty / Notes" type="textarea" autogrow />
          <q-select
            v-model="editing!.availability"
            dense
            outlined
            label="Availability"
            :options="[
              { label: 'Available', value: 'available' },
              { label: 'Pre-order', value: 'preorder' },
            ]"
            emit-value
            map-options
          />
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-input v-model.number="editing!.unit_price_php" dense outlined label="Unit Price (PHP)" type="number" />
            </div>
            <div class="col-6">
              <q-input v-model.number="editing!.unit_cost_php" dense outlined label="Unit Cost (PHP)" type="number" />
            </div>
          </div>
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <q-input v-model.number="editing!.stock_on_hand" dense outlined label="Stock on hand" type="number" />
            </div>
          </div>
          <q-toggle v-model="editing!.active" label="Active" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save" :loading="products.loading" @click="save" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
