<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowRight, PhBuildings, PhLockKey, PhUser } from '@phosphor-icons/vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const loading = ref(false)
const error = ref('')
const form = reactive({ tenant: 'kiboga-capital', email: 'owner@kiboga.ug', password: 'password' })

async function submit() {
  loading.value = true
  error.value = ''
  try {
    await auth.signIn(form)
    router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/')
  } catch (e) {
    error.value = e.response?.data?.message || 'The API is unavailable. Start the Laravel server and try again.'
  } finally { loading.value = false }
}
</script>

<template>
  <main class="grid min-h-[100dvh] bg-[#f4f6f7] lg:grid-cols-[minmax(360px,44%)_1fr]">
    <section class="relative hidden overflow-hidden bg-[#173f3a] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div class="absolute inset-0 opacity-[.08]" style="background-image: linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px); background-size: 32px 32px" />
      <div class="relative flex items-center gap-3"><div class="grid size-11 place-items-center rounded-[8px] bg-white font-extrabold text-[#287f71]">K</div><div><strong class="block text-lg">Kopa</strong><span class="text-xs text-white/60">Loan Management</span></div></div>
      <div class="relative max-w-sm border-l-2 border-[#62a99e] pl-6"><h1 class="text-3xl font-semibold leading-tight tracking-tight">Kiboga Capital</h1><dl class="mt-7 grid grid-cols-2 gap-6 text-sm"><div><dt class="text-white/55">Workspace</dt><dd class="mt-1 font-semibold">Head Office</dd></div><div><dt class="text-white/55">Currency</dt><dd class="mt-1 font-semibold">Uganda Shilling</dd></div></dl></div>
      <span />
    </section>
    <section class="grid place-items-center p-5 sm:p-10">
      <form class="w-full max-w-[430px] rounded-[10px] border border-[#e0e5e8] bg-white p-6 shadow-[0_12px_35px_rgba(31,42,55,.08)] sm:p-9" @submit.prevent="submit">
        <div class="mb-7 flex items-center gap-3 lg:hidden"><div class="grid size-10 place-items-center rounded-[7px] bg-[#287f71] font-extrabold text-white">K</div><strong class="text-lg text-[#1d2939]">Kopa</strong></div>
        <p class="text-xs font-bold uppercase tracking-[.08em] text-[#287f71]">Account access</p>
        <h2 class="mt-2 text-2xl font-semibold tracking-tight text-[#1d2939]">Sign in</h2>
        <p v-if="error" class="mt-5 border-l-4 border-red-500 bg-red-50 px-3 py-2.5 text-sm text-red-800" role="alert">{{ error }}</p>
        <div class="mt-6 space-y-4">
          <label><span class="label">Company code</span><div class="relative"><PhBuildings :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]"/><input v-model.trim="form.tenant" class="field pl-10" autocomplete="organization" required/></div></label>
          <label><span class="label">Email address</span><div class="relative"><PhUser :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]"/><input v-model.trim="form.email" type="email" class="field pl-10" autocomplete="username" required/></div></label>
          <label><span class="label">Password</span><div class="relative"><PhLockKey :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]"/><input v-model="form.password" type="password" class="field pl-10" autocomplete="current-password" required/></div></label>
        </div>
        <button class="btn-primary mt-6 w-full" :disabled="loading">{{ loading ? 'Signing in' : 'Sign in' }}<PhArrowRight v-if="!loading" :size="17" /></button>
        <div class="mt-6 border-t border-[#edf0f2] pt-5 text-center text-sm text-[#667085]">New company? <RouterLink to="/register" class="font-semibold text-[#287f71]">Create workspace</RouterLink></div>
      </form>
    </section>
  </main>
</template>
