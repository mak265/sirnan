<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRolesStore } from '@/stores/roles'

const drawerOpen = ref(true)
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const roles = useRolesStore()

const emailLabel = computed(() => auth.user?.email ?? '')

onMounted(async () => {
  await auth.init()
  if (auth.user) await roles.loadMyRole()
})

async function signOut() {
  await auth.signOut()
  await router.push('/login')
}

function isActive(path: string): boolean {
  return route.path === path
}
</script>

<template>
  <q-layout view="hHh LpR fFf" class="bg-grey-1 text-dark">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn flat round dense icon="menu" @click="drawerOpen = !drawerOpen" />
        <q-toolbar-title>
          <div class="text-subtitle1">Quotation Management</div>
        </q-toolbar-title>
        <q-btn flat dense icon="account_circle" :label="emailLabel" no-caps />
        <q-btn flat dense icon="logout" label="Sign out" no-caps @click="signOut" />
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerOpen" show-if-above bordered class="bg-white text-dark">
      <q-list padding>
        <q-item clickable :active="isActive('/dashboard')" active-class="bg-grey-3" @click="router.push('/dashboard')">
          <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
          <q-item-section>Dashboard</q-item-section>
        </q-item>
        <q-item clickable :active="isActive('/quotes')" active-class="bg-grey-3" @click="router.push('/quotes')">
          <q-item-section avatar><q-icon name="description" /></q-item-section>
          <q-item-section>Quotes</q-item-section>
        </q-item>
        <q-item clickable :active="isActive('/inventory')" active-class="bg-grey-3" @click="router.push('/inventory')">
          <q-item-section avatar><q-icon name="inventory_2" /></q-item-section>
          <q-item-section>Inventory</q-item-section>
        </q-item>
        <q-item clickable :active="isActive('/customers')" active-class="bg-grey-3" @click="router.push('/customers')">
          <q-item-section avatar><q-icon name="groups" /></q-item-section>
          <q-item-section>Customers</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
