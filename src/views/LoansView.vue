<script setup>
import { computed, onMounted, ref } from 'vue'
import { PhMagnifyingGlass, PhPlus } from '@phosphor-icons/vue'
import StatusBadge from '../components/StatusBadge.vue'
import { date, money } from '../utils/formatters'
import api from '../services/api'

const loans = ref([])
const query = ref('')
const status = ref('')
const loading = ref(true)
const error = ref('')
const filtered = computed(() => loans.value.filter((loan) => `${loan.loan_number} ${loan.borrower?.full_name} ${loan.borrower?.phone_number}`.toLowerCase().includes(query.value.toLowerCase())))
async function load() { loading.value = true; error.value = ''; try { const { data } = await api.get('/loans', { params: status.value ? { status: status.value } : {} }); loans.value = data.data } catch (e) { error.value = e.response?.data?.message || 'Loans could not be loaded.' } finally { loading.value = false } }
onMounted(load)
</script>
<template><section class="surface overflow-hidden">
  <header class="flex flex-col gap-3 border-b border-[#e8ecef] p-4 lg:flex-row lg:items-center lg:justify-between"><div class="flex flex-1 flex-col gap-2 sm:flex-row"><div class="relative w-full max-w-sm"><PhMagnifyingGlass :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#98a2b3]"/><input v-model="query" class="field pl-10" placeholder="Search loan or borrower"/></div><select v-model="status" class="field sm:!w-40" @change="load"><option value="">All statuses</option><option value="active">Active</option><option value="completed">Completed</option></select></div><RouterLink to="/loans/new" class="btn-primary"><PhPlus :size="17"/>New loan</RouterLink></header>
  <p v-if="error" class="m-4 border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">{{ error }} <button class="ml-2 font-semibold underline" @click="load">Retry</button></p>
  <div v-if="loading" class="p-8 text-center text-sm text-[#667085]">Loading loans</div><div v-else-if="!filtered.length" class="p-10 text-center text-sm text-[#667085]">No loan records found.</div>
  <div v-else class="overflow-x-auto"><table class="w-full min-w-[800px] text-left text-sm"><thead class="bg-[#f8fafb] text-[.68rem] font-bold uppercase tracking-[.06em] text-[#7d8796]"><tr><th class="px-5 py-3">Loan account</th><th class="px-4 py-3">Borrower</th><th class="px-4 py-3">Principal</th><th class="px-4 py-3">Outstanding</th><th class="px-4 py-3">Maturity</th><th class="px-5 py-3">Status</th></tr></thead><tbody class="divide-y divide-[#edf0f2]"><tr v-for="loan in filtered" :key="loan.id" class="hover:bg-[#fafcfc]"><td class="px-5 py-3.5"><RouterLink :to="`/loans/${loan.id}`" class="font-semibold text-[#287f71]">{{ loan.loan_number }}</RouterLink></td><td class="px-4 py-3.5"><RouterLink :to="`/borrowers/${loan.borrower_id}`" class="font-medium text-[#1d2939]">{{ loan.borrower?.full_name }}</RouterLink><p class="mt-1 text-xs text-[#7d8796]">{{ loan.borrower?.phone_number }}</p></td><td class="px-4 py-3.5 tabular-nums">{{ money(loan.principal_amount) }}</td><td class="px-4 py-3.5 font-semibold tabular-nums">{{ money(loan.outstanding_amount) }}</td><td class="px-4 py-3.5">{{ date(loan.maturity_date) }}</td><td class="px-5 py-3.5"><StatusBadge :status="loan.status === 'completed' ? 'Completed' : 'Active'"/></td></tr></tbody></table></div>
</section></template>
