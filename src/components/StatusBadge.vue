<script setup>
defineProps({ status: { type: String, required: true } })
const styles = {
  'On Track': 'bg-[#eaf4f2] text-[#1f675c] ring-[#287f71]/20',
  'Due Today': 'bg-amber-50 text-amber-800 ring-amber-700/15',
  Overdue: 'bg-red-50 text-red-800 ring-red-700/15',
  Completed: 'bg-slate-100 text-slate-700 ring-slate-500/15',
  Active: 'bg-[#eaf4f2] text-[#1f675c] ring-[#287f71]/20',
}
</script>
<template><span class="inline-flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-[.7rem] font-semibold ring-1 ring-inset" :class="styles[status] || styles.Completed"><span aria-hidden="true">{{ status === 'Overdue' ? '!' : status === 'Completed' ? '✓' : '•' }}</span>{{ status }}</span></template>
