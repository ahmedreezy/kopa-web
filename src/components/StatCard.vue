<script setup>
import { money } from '../data/demo'
defineProps({ label: String, value: Number, detail: String, tone: String })
</script>
<template>
  <article class="surface p-5 sm:p-6" :class="tone === 'danger' ? 'border-rose-200' : ''">
    <p class="text-sm font-medium text-stone-500">{{ label }}</p>
    <p class="mt-3 text-2xl font-bold tracking-tight text-stone-950 xl:text-[1.75rem]">{{ money(value) }}</p>
    <p class="mt-2 text-sm" :class="tone === 'danger' ? 'text-rose-700' : tone === 'success' ? 'text-emerald-700' : 'text-stone-500'">{{ detail }}</p>
  </article>
</template>
