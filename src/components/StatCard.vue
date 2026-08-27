<script setup>
import { money } from '../utils/formatters'
defineProps({ label: String, value: Number, detail: String, tone: String })
</script>
<template>
  <article class="surface border-t-[3px] p-5" :class="tone === 'danger' ? 'border-t-red-500' : tone === 'warning' ? 'border-t-amber-500' : tone === 'success' ? 'border-t-[#287f71]' : 'border-t-[#5e6b7e]'">
    <p class="text-[.72rem] font-bold uppercase tracking-[.06em] text-[#7d8796]">{{ label }}</p>
    <p class="mt-3 text-2xl font-semibold tracking-tight text-[#1d2939] tabular-nums xl:text-[1.65rem]">{{ money(value) }}</p>
    <p class="mt-2 text-xs" :class="tone === 'danger' ? 'text-red-700' : tone === 'warning' ? 'text-amber-700' : tone === 'success' ? 'text-[#287f71]' : 'text-[#667085]'">{{ detail }}</p>
  </article>
</template>
