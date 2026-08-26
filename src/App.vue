<script setup>
import { onMounted, ref } from 'vue'

const apiStatus = ref('Checking API connection…')

onMounted(async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/health`)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    apiStatus.value = data.message
  } catch {
    apiStatus.value = 'API is offline. Start Laravel with php artisan serve.'
  }
})
</script>

<template>
  <main class="grid min-h-screen place-items-center px-6 py-16">
    <section class="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
      <p class="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Kopa</p>
      <h1 class="mt-4 text-4xl font-bold tracking-tight text-slate-950">Loan management system</h1>
      <p class="mt-4 text-lg leading-8 text-slate-600">Vue 3, Vite, and Tailwind CSS are ready for development.</p>
      <div class="mt-8 rounded-2xl bg-slate-950 px-5 py-4 text-sm text-slate-100">
        <span class="mr-2 inline-block size-2 rounded-full bg-emerald-400"></span>
        {{ apiStatus }}
      </div>
    </section>
  </main>
</template>
