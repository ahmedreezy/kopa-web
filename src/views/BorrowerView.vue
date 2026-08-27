<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PhArrowLeft, PhBank, PhPhone, PhPlus } from '@phosphor-icons/vue'
import StatusBadge from '../components/StatusBadge.vue'
import { date, money } from '../utils/formatters'
import api from '../services/api'

const route = useRoute()
const borrower = ref(null)
const loading = ref(true)
const error = ref('')
const initials = computed(() => borrower.value?.full_name?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase())
async function load() { loading.value = true; error.value = ''; try { borrower.value = (await api.get(`/borrowers/${route.params.id}`)).data } catch (e) { error.value = e.response?.status === 404 ? 'Borrower not found.' : 'Borrower details could not be loaded.' } finally { loading.value = false } }
onMounted(load)
</script>
<template>
  <div class="space-y-5"><RouterLink to="/borrowers" class="inline-flex items-center gap-2 text-sm font-semibold text-[#667085]"><PhArrowLeft :size="17"/>Borrowers</RouterLink>
    <div v-if="loading" class="surface p-8 text-center text-sm text-[#667085]">Loading borrower account</div>
    <p v-else-if="error" class="border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">{{ error }} <button class="ml-2 font-semibold underline" @click="load">Retry</button></p>
    <template v-else>
      <section class="surface overflow-hidden"><header class="flex flex-col gap-5 border-b border-[#e8ecef] p-5 sm:flex-row sm:items-center sm:justify-between"><div class="flex items-center gap-3"><div class="grid size-12 place-items-center rounded-[8px] bg-[#dcece9] font-bold text-[#1f675c]">{{ initials }}</div><div><h2 class="text-lg font-semibold text-[#1d2939]">{{ borrower.full_name }}</h2><p class="mt-1 text-sm text-[#667085]">{{ borrower.phone_number }}</p></div></div><div class="flex gap-2"><a :href="`tel:${borrower.phone_number}`" class="btn-secondary"><PhPhone :size="17"/>Call</a><RouterLink :to="{ path: '/loans/new', query: { borrower: borrower.id } }" class="btn-primary"><PhPlus :size="17"/>New loan</RouterLink></div></header>
        <dl class="grid gap-px bg-[#e8ecef] sm:grid-cols-2 lg:grid-cols-4"><div v-for="row in [['National ID', borrower.nin || 'Not recorded'],['District', borrower.district || 'Not recorded'],['Occupation', borrower.occupation || 'Not recorded'],['Address', borrower.address || 'Not recorded']]" :key="row[0]" class="bg-white px-5 py-4"><dt class="text-[.7rem] font-bold uppercase tracking-wide text-[#8a94a3]">{{ row[0] }}</dt><dd class="mt-1.5 text-sm font-medium text-[#344054]">{{ row[1] }}</dd></div></dl>
      </section>
      <section class="surface overflow-hidden"><header class="flex items-center justify-between border-b border-[#e8ecef] px-5 py-4"><div><h2 class="font-semibold text-[#1d2939]">Loan accounts</h2><p class="mt-1 text-xs text-[#7d8796]">{{ borrower.loans.length }} record{{ borrower.loans.length === 1 ? '' : 's' }}</p></div><PhBank :size="20" class="text-[#287f71]"/></header>
        <div v-if="!borrower.loans.length" class="p-9 text-center text-sm text-[#667085]">This borrower has no loans.</div>
        <div v-else class="overflow-x-auto"><table class="w-full min-w-[700px] text-left text-sm"><thead class="bg-[#f8fafb] text-[.68rem] font-bold uppercase tracking-[.06em] text-[#7d8796]"><tr><th class="px-5 py-3">Loan</th><th class="px-4 py-3">Principal</th><th class="px-4 py-3">Total payable</th><th class="px-4 py-3">Outstanding</th><th class="px-4 py-3">Maturity</th><th class="px-5 py-3">Status</th></tr></thead><tbody class="divide-y divide-[#edf0f2]"><tr v-for="loan in borrower.loans" :key="loan.id" class="hover:bg-[#fafcfc]"><td class="px-5 py-3.5"><RouterLink :to="`/loans/${loan.id}`" class="font-semibold text-[#287f71]">{{ loan.loan_number }}</RouterLink></td><td class="px-4 py-3.5 tabular-nums">{{ money(loan.principal_amount) }}</td><td class="px-4 py-3.5 tabular-nums">{{ money(loan.total_payable) }}</td><td class="px-4 py-3.5 font-semibold tabular-nums">{{ money(loan.outstanding_amount) }}</td><td class="px-4 py-3.5">{{ date(loan.maturity_date) }}</td><td class="px-5 py-3.5"><StatusBadge :status="loan.status === 'completed' ? 'Completed' : 'Active'"/></td></tr></tbody></table></div>
      </section>
    </template>
  </div>
</template>
