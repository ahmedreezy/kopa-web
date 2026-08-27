<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PhMagnifyingGlass, PhPlus, PhX } from '@phosphor-icons/vue'
import StatusBadge from '../components/StatusBadge.vue'
import { money } from '../utils/formatters'
import api from '../services/api'

const route = useRoute()
const query = ref('')
const records = ref([])
const branches = ref([])
const adding = ref(route.query.add === '1')
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const form = reactive({ branch_id: '', full_name: '', phone_number: '', district: '', occupation: '', nin: '' })
const filtered = computed(() => records.value.filter((b) => `${b.name} ${b.phone} ${b.loan}`.toLowerCase().includes(query.value.toLowerCase())))
const mapBorrower = (b) => { const loan = b.loans?.[0]; return { id: b.id, name: b.full_name, phone: b.phone_number, loanId: loan?.id, loan: loan?.loan_number || 'None', outstanding: loan?.outstanding_amount || 0, nextDue: loan?.maturity_date || '—', status: loan ? (loan.status === 'overdue' ? 'Overdue' : 'On Track') : 'Completed' } }
async function load() { loading.value = true; error.value = ''; try { const [borrowerResponse, branchResponse] = await Promise.all([api.get('/borrowers'), api.get('/branches')]); records.value = borrowerResponse.data.data.map(mapBorrower); branches.value = branchResponse.data; form.branch_id ||= branches.value[0]?.id || '' } catch (e) { error.value = e.response?.data?.message || 'Borrowers could not be loaded.' } finally { loading.value = false } }
async function save() { saving.value = true; error.value = ''; try { const { data } = await api.post('/borrowers', form); records.value.unshift(mapBorrower({ ...data, loans: [] })); adding.value = false; Object.assign(form, { branch_id: branches.value[0]?.id || '', full_name: '', phone_number: '', district: '', occupation: '', nin: '' }) } catch (e) { error.value = Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Borrower could not be saved.' } finally { saving.value = false } }
onMounted(load)
</script>
<template><section class="surface overflow-hidden">
  <header class="flex flex-col gap-3 border-b border-[#e8ecef] p-4 sm:flex-row sm:items-center sm:justify-between"><div class="relative w-full max-w-sm"><PhMagnifyingGlass :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]"/><input v-model="query" class="field pl-10" placeholder="Search borrowers" /></div><button class="btn-primary" @click="adding = !adding"><component :is="adding ? PhX : PhPlus" :size="18"/>{{ adding ? 'Close' : 'Add borrower' }}</button></header>
  <p v-if="error" class="m-4 border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">{{ error }} <button v-if="!adding" class="ml-2 font-semibold underline" @click="load">Retry</button></p>
  <form v-if="adding" class="grid gap-4 border-b border-[#e8ecef] bg-[#f8fafb] p-5 sm:grid-cols-2 lg:grid-cols-3" @submit.prevent="save"><label><span class="label">Full name</span><input v-model.trim="form.full_name" class="field" required/></label><label><span class="label">Phone number</span><input v-model.trim="form.phone_number" class="field" required/></label><label><span class="label">National ID</span><input v-model.trim="form.nin" class="field"/></label><label><span class="label">Branch</span><select v-model="form.branch_id" class="field" required><option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option></select></label><label><span class="label">District</span><input v-model.trim="form.district" class="field"/></label><label><span class="label">Occupation</span><input v-model.trim="form.occupation" class="field"/></label><div class="flex gap-2 sm:col-span-2 lg:col-span-3 lg:justify-end"><button type="button" class="btn-secondary" @click="adding = false">Cancel</button><button class="btn-primary" :disabled="saving">{{ saving ? 'Saving' : 'Save borrower' }}</button></div></form>
  <div v-if="loading" class="p-8 text-center text-sm text-[#667085]">Loading borrowers</div><div v-else-if="!filtered.length" class="p-10 text-center text-sm text-[#667085]">No borrowers found.</div>
  <div v-else class="hidden overflow-x-auto md:block"><table class="w-full text-left text-sm"><thead class="bg-[#f8fafb] text-[.68rem] font-bold uppercase tracking-[.06em] text-[#7d8796]"><tr><th class="px-5 py-3">Borrower</th><th class="px-4 py-3">Loan account</th><th class="px-4 py-3">Outstanding</th><th class="px-4 py-3">Maturity</th><th class="px-5 py-3">Status</th></tr></thead><tbody class="divide-y divide-[#edf0f2]"><tr v-for="person in filtered" :key="person.id" class="hover:bg-[#fafcfc]"><td class="px-5 py-3.5"><RouterLink :to="`/borrowers/${person.id}`" class="font-semibold text-[#1d2939] hover:text-[#287f71]">{{ person.name }}</RouterLink><p class="mt-1 text-xs text-[#7d8796]">{{ person.phone }}</p></td><td class="px-4 py-3.5"><RouterLink v-if="person.loanId" :to="`/loans/${person.loanId}`" class="font-medium text-[#287f71]">{{ person.loan }}</RouterLink><span v-else>{{ person.loan }}</span></td><td class="px-4 py-3.5 font-semibold tabular-nums">{{ money(person.outstanding) }}</td><td class="px-4 py-3.5">{{ person.nextDue }}</td><td class="px-5 py-3.5"><StatusBadge :status="person.status" /></td></tr></tbody></table></div>
  <div class="divide-y divide-[#edf0f2] md:hidden"><RouterLink v-for="person in filtered" :key="person.id" :to="`/borrowers/${person.id}`" class="block p-4"><div class="flex justify-between gap-3"><div><p class="font-semibold text-[#1d2939]">{{ person.name }}</p><p class="mt-1 text-xs text-[#7d8796]">{{ person.phone }} · {{ person.loan }}</p></div><StatusBadge :status="person.status" /></div><div class="mt-3 flex justify-between text-sm"><span class="text-[#667085]">Outstanding</span><strong>{{ money(person.outstanding) }}</strong></div></RouterLink></div>
</section></template>
