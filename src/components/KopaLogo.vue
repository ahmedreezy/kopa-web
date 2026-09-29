<script setup>
defineProps({
  size: { type: Number, default: 40 },
  inverse: { type: Boolean, default: false },
  labelled: { type: Boolean, default: false },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    :role="labelled ? 'img' : undefined"
    :aria-label="labelled ? 'Kopa' : undefined"
    :aria-hidden="labelled ? undefined : true"
    class="block shrink-0"
  >
    <rect x="2" y="2" width="60" height="60" rx="15" :fill="inverse ? '#F8FBFA' : '#287F71'" :stroke="inverse ? '#D8E5E2' : '#287F71'" stroke-width="2"/>
    <path d="M20 16V48" :stroke="inverse ? '#287F71' : '#F8FBFA'" stroke-width="7" stroke-linecap="round"/>
    <path d="M22 33L43 16" :stroke="inverse ? '#287F71' : '#F8FBFA'" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M31 27L45 48" stroke="#D6A84B" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</template>
