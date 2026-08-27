<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhArrowLeft } from '@phosphor-icons/vue'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const error = ref('')
const form = reactive({ company_name: '', company_phone: '', name: '', email: '', phone: '', password: '', password_confirmation: '' })
async function submit() {
  error.value = ''
  if (form.password !== form.password_confirmation) { error.value = 'The passwords do not match.'; return }
  loading.value = true
  try { await auth.register(form); router.push('/') }
  catch (e) { error.value = e.response?.data?.message || Object.values(e.response?.data?.errors || {})[0]?.[0] || 'Company setup failed.' }
  finally { loading.value = false }
}
</script>
<template>
  <main class="min-h-[100dvh] bg-[#f4f6f7] p-4 sm:p-8">
    <div class="mx-auto max-w-3xl"><RouterLink to="/login" class="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#475467]"><PhArrowLeft :size="17"/>Back to sign in</RouterLink>
      <form class="rounded-[10px] border border-[#e0e5e8] bg-white shadow-[0_12px_35px_rgba(31,42,55,.06)]" @submit.prevent="submit">
        <header class="border-b border-[#e8ecef] px-6 py-5 sm:px-8"><div class="flex items-center gap-3"><div class="grid size-10 place-items-center rounded-[7px] bg-[#287f71] font-extrabold text-white">K</div><div><h1 class="text-xl font-semibold text-[#1d2939]">Create company workspace</h1><p class="mt-1 text-sm text-[#667085]">Company and owner details</p></div></div></header>
        <div class="p-6 sm:p-8"><p v-if="error" class="mb-5 border-l-4 border-red-500 bg-red-50 px-3 py-2.5 text-sm text-red-800">{{ error }}</p>
          <div class="grid gap-5 sm:grid-cols-2"><label><span class="label">Company name</span><input v-model.trim="form.company_name" class="field" required/></label><label><span class="label">Company phone</span><input v-model.trim="form.company_phone" class="field"/></label><label><span class="label">Owner name</span><input v-model.trim="form.name" class="field" required/></label><label><span class="label">Owner phone</span><input v-model.trim="form.phone" class="field"/></label><label class="sm:col-span-2"><span class="label">Email address</span><input v-model.trim="form.email" type="email" class="field" required/></label><label><span class="label">Password</span><input v-model="form.password" type="password" class="field" minlength="8" required/></label><label><span class="label">Confirm password</span><input v-model="form.password_confirmation" type="password" class="field" required/></label></div>
          <div class="mt-7 flex justify-end"><button class="btn-primary min-w-40" :disabled="loading">{{ loading ? 'Creating workspace' : 'Create workspace' }}</button></div>
        </div>
      </form>
    </div>
  </main>
</template>
