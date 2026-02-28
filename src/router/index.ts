import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { APP_TITLE } from '@/branding'
import LoginPage from '@/pages/LoginPage.vue'
import AppShell from '@/components/AppShell.vue'
import DashboardPage from '@/pages/DashboardPage.vue'
import QuotesPage from '@/pages/QuotesPage.vue'
import QuoteEditorPage from '@/pages/QuoteEditorPage.vue'
import InventoryPage from '@/pages/InventoryPage.vue'
import CustomersPage from '@/pages/CustomersPage.vue'

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: LoginPage },
  {
    path: '/',
    component: AppShell,
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      { path: 'dashboard', name: 'dashboard', component: DashboardPage },
      { path: 'quotes', name: 'quotes', component: QuotesPage },
      { path: 'quotes/:id', name: 'quote', component: QuoteEditorPage },
      { path: 'inventory', name: 'inventory', component: InventoryPage },
      { path: 'customers', name: 'customers', component: CustomersPage },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notfound',
    component: {
      template: '<div class="q-pa-md">Not found</div>',
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.init()
  if (to.path === '/login') {
    if (auth.user) return '/quotes'
    return true
  }
  if (to.matched.some((r) => Boolean(r.meta.requiresAuth))) {
    if (!auth.user) return '/login'
  }
  return true
})

router.afterEach((to) => {
  const base = APP_TITLE
  const name = String(to.name ?? '')
  const label =
    name === 'dashboard'
      ? 'Dashboard'
      : name === 'quotes'
        ? 'Quotes'
        : name === 'quote'
          ? 'Quote'
          : name === 'inventory'
            ? 'Inventory'
            : name === 'customers'
              ? 'Customers'
              : name === 'login'
                ? 'Login'
                : ''

  document.title = label ? `${label} • ${base}` : base
})

export default router
