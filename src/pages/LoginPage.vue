<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { LOGO_URL } from '@/branding'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')

const resetOpen = ref(false)
const resetEmail = ref('')

const canSubmit = computed(() => email.value.trim().length > 0 && password.value.trim().length > 0)

async function signIn() {
  const ok = await auth.signIn(email.value.trim(), password.value)
  if (ok) await router.push('/quotes')
}

async function requestReset() {
  await auth.requestPasswordReset(resetEmail.value.trim())
  if (!auth.error) resetOpen.value = false
}
</script>

<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-1 text-dark">
    <q-page-container>
      <q-page class="row items-center justify-center" style="min-height: 100vh">
        <q-card style="width: 420px; max-width: 92vw">
          <q-card-section>
            <div class="row justify-center q-mb-md">
              <img :src="LOGO_URL" alt="Symbol Sciences" style="max-width: 320px; width: 100%; height: auto" />
            </div>
            <div class="text-h6">Sign in</div>
            <div class="text-caption text-grey-7">Quotation Management</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-banner v-if="auth.error" class="bg-negative text-white q-mb-md" rounded>
              {{ auth.error }}
            </q-banner>
            <q-input v-model="email" outlined dense label="Email" type="email" autocomplete="email" class="q-mb-sm" />
            <q-input
              v-model="password"
              outlined
              dense
              label="Password"
              type="password"
              autocomplete="current-password"
              class="q-mb-md"
            />
            <q-btn
              color="primary"
              class="full-width"
              label="Sign in"
              :disable="!canSubmit || auth.loading"
              :loading="auth.loading"
              @click="signIn"
            />
            <div class="row justify-end q-mt-sm">
              <q-btn flat dense label="Forgot password" no-caps @click="(resetOpen = true), (resetEmail = email)" />
            </div>
          </q-card-section>
        </q-card>

        <q-dialog v-model="resetOpen">
          <q-card style="width: 460px; max-width: 92vw">
            <q-card-section class="row items-center">
              <div class="text-h6">Reset password</div>
              <q-space />
              <q-btn flat round icon="close" v-close-popup />
            </q-card-section>
            <q-card-section class="q-pt-none">
              <q-input v-model="resetEmail" outlined dense label="Email" type="email" autocomplete="email" />
            </q-card-section>
            <q-card-actions align="right">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn color="primary" label="Send reset link" :loading="auth.loading" @click="requestReset" />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </q-page>
    </q-page-container>
  </q-layout>
</template>
