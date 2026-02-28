<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCustomersStore, type CustomerRow } from '@/stores/customers'
import { useRolesStore } from '@/stores/roles'

const customers = useCustomersStore()
const roles = useRolesStore()

const search = ref('')
const editorOpen = ref(false)
const editing = ref<Partial<CustomerRow> | null>(null)

onMounted(async () => {
  await roles.loadMyRole()
  await customers.loadAll()
})

const canEdit = computed(() => roles.role === 'admin')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return customers.items
  return customers.items.filter((c) => `${c.name} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase().includes(q))
})

const columns: any[] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'phone', label: 'Phone', field: 'phone', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
]

function openNew() {
  editing.value = { name: '', email: '', phone: '', address_text: '' }
  editorOpen.value = true
}

function openEdit(c: CustomerRow) {
  editing.value = { ...c }
  editorOpen.value = true
}

async function save() {
  if (!editing.value) return
  await customers.upsert({
    id: editing.value.id,
    name: String(editing.value.name || '').trim(),
    email: (editing.value.email as string | undefined) ?? null,
    phone: (editing.value.phone as string | undefined) ?? null,
    address_text: (editing.value.address_text as string | undefined) ?? null,
  } as any)
  if (!customers.error) editorOpen.value = false
}
</script>

<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h6">Customers</div>
        <div class="text-caption text-grey-5">Select registered customers for quotes</div>
      </div>
      <q-space />
      <q-btn v-if="canEdit" color="primary" icon="add" label="New Customer" @click="openNew" />
    </div>

    <q-banner v-if="roles.role !== 'admin'" class="bg-grey-2 text-grey-8 q-mb-md" rounded>
      Read-only access. To manage customers, your user must be assigned the <b>admin</b> role in `public.user_roles`.
    </q-banner>

    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-input v-model="search" dense outlined label="Search" placeholder="Name / email / phone" />
      </div>
      <div class="col-12 col-md-6 row justify-end items-center">
        <q-btn flat icon="refresh" label="Refresh" @click="customers.loadAll" />
      </div>
    </div>

    <q-banner v-if="customers.error" class="bg-negative text-white q-mb-md" rounded>
      {{ customers.error }}
    </q-banner>

    <q-table
      :rows="filtered"
      :columns="columns"
      row-key="id"
      flat
      dense
      :loading="customers.loading"
      :pagination="{ rowsPerPage: 10 }"
    >
      <template #body-cell-actions="slotProps">
        <q-td :props="slotProps" class="text-right">
          <q-btn v-if="canEdit" dense flat icon="edit" label="Edit" no-caps @click="openEdit(slotProps.row)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="editorOpen">
      <q-card style="width: 540px; max-width: 92vw">
        <q-card-section class="row items-center">
          <div class="text-h6">Customer</div>
          <q-space />
          <q-btn flat round icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="q-pt-none q-gutter-md">
          <q-input v-model="editing!.name" dense outlined label="Name" />
          <q-input v-model="editing!.email" dense outlined label="Email" />
          <q-input v-model="editing!.phone" dense outlined label="Phone" />
          <q-input v-model="editing!.address_text" dense outlined label="Address" type="textarea" autogrow />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save" :loading="customers.loading" @click="save" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>
