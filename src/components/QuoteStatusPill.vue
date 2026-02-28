<script setup lang="ts">
import type { QuoteStatus } from '@/stores/quotes'

const props = defineProps<{ status: QuoteStatus }>()

function colorForStatus(status: QuoteStatus): string {
  if (status === 'Draft') return 'grey-6'
  if (status === 'Sent') return 'info'
  if (status === 'Approved') return 'positive'
  return 'negative'
}
</script>

<template>
  <q-badge :color="colorForStatus(props.status)" class="q-px-sm" rounded>
    {{ props.status }}
  </q-badge>
</template>

