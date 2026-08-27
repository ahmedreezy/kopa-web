<script setup>
defineProps({ status: { type: String, required: true } })
const styles = {
  'On Track': 'bg-emerald-50 text-emerald-800 ring-emerald-700/15',
  'Due Today': 'bg-amber-50 text-amber-800 ring-amber-700/15',
  Overdue: 'bg-rose-50 text-rose-800 ring-rose-700/15',
  Completed: 'bg-stone-100 text-stone-700 ring-stone-500/15',
  Active: 'bg-emerald-50 text-emerald-800 ring-emerald-700/15',
}
</script>
<template>
  <span class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset" :class="styles[status] || styles.Completed">
    <span aria-hidden="true">{{ status === 'Overdue' ? '!' : status === 'Completed' ? '✓' : '•' }}</span>{{ status }}
  </span>
</template>
