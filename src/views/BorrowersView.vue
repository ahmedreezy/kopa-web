<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { PhMagnifyingGlass as MagnifyingGlass, PhPlus as Plus } from '@phosphor-icons/vue'
import StatusBadge from '../components/StatusBadge.vue'
import { borrowers, money } from '../data/demo'
import api from '../services/api'
const query = ref('')
const records = ref(borrowers)
const branches = ref([]); const adding = ref(false); const saving = ref(false)
const form = reactive({ branch_id: '', full_name: '', phone_number: '', district: '', occupation: '' })
const filtered = computed(() => records.value.filter((b) => `${b.name} ${b.phone} ${b.loan}`.toLowerCase().includes(query.value.toLowerCase())))
const mapBorrower = (b) => { const loan = b.loans?.[0]; return { id: b.id, name: b.full_name, phone: b.phone_number, loan: loan?.loan_number || 'No active loan', outstanding: loan?.outstanding_amount || 0, nextDue: loan?.maturity_date || 'Not scheduled', status: loan ? 'On Track' : 'Completed' } }
async function load() { try { const [{ data }, branchResponse] = await Promise.all([api.get('/borrowers'), api.get('/branches')]); records.value = data.data.map(mapBorrower); branches.value = branchResponse.data; form.branch_id ||= branches.value[0]?.id } catch { /* Keep demo data. */ } }
async function save() { saving.value = true; try { const { data } = await api.post('/borrowers', form); records.value.unshift(mapBorrower({ ...data, loans: [] })); adding.value = false; Object.assign(form, { branch_id: branches.value[0]?.id || '', full_name: '', phone_number: '', district: '', occupation: '' }) } finally { saving.value = false } }
onMounted(load)
</script>
<template>
  <section class="surface overflow-hidden">
    <div class="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div class="relative w-full max-w-sm"><MagnifyingGlass :size="19" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"/><input v-model="query" class="field pl-10" placeholder="Find a borrower" /></div><button class="btn-primary" @click="adding = !adding"><Plus :size="19" />Add borrower</button></div>
    <form v-if="adding" class="grid gap-4 border-b border-stone-200 bg-stone-50 p-5 sm:grid-cols-2" @submit.prevent="save"><label><span class="label">Full name</span><input v-model="form.full_name" class="field" required/></label><label><span class="label">Phone number</span><input v-model="form.phone_number" class="field" required/></label><label><span class="label">Branch</span><select v-model="form.branch_id" class="field" required><option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option></select></label><label><span class="label">District</span><input v-model="form.district" class="field"/></label><div class="flex gap-2 sm:col-span-2 sm:justify-end"><button type="button" class="btn-secondary" @click="adding = false">Cancel</button><button class="btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save borrower' }}</button></div></form>
    <div class="hidden overflow-x-auto md:block"><table class="w-full text-left text-sm"><thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500"><tr><th class="px-6 py-3">Borrower</th><th class="px-4 py-3">Active loan</th><th class="px-4 py-3">Outstanding</th><th class="px-4 py-3">Next due</th><th class="px-6 py-3">Status</th></tr></thead><tbody class="divide-y divide-stone-100"><tr v-for="person in filtered" :key="person.id" class="hover:bg-stone-50"><td class="px-6 py-4"><RouterLink :to="`/borrowers/${person.id}`" class="font-semibold text-stone-950">{{ person.name }}</RouterLink><p class="mt-1 text-xs text-stone-500">{{ person.phone }}</p></td><td class="px-4 py-4">{{ person.loan }}</td><td class="px-4 py-4 font-semibold">{{ money(person.outstanding) }}</td><td class="px-4 py-4">{{ person.nextDue }}</td><td class="px-6 py-4"><StatusBadge :status="person.status" /></td></tr></tbody></table></div>
    <div class="divide-y divide-stone-100 md:hidden"><RouterLink v-for="person in filtered" :key="person.id" :to="`/borrowers/${person.id}`" class="block p-4"><div class="flex items-start justify-between gap-3"><div><p class="font-semibold">{{ person.name }}</p><p class="mt-1 text-sm text-stone-500">{{ person.phone }}</p></div><StatusBadge :status="person.status" /></div><div class="mt-4 flex justify-between text-sm"><span class="text-stone-500">Outstanding</span><strong>{{ money(person.outstanding) }}</strong></div></RouterLink></div>
  </section>
</template>
