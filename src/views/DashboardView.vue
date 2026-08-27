<script setup>
import { onMounted, ref } from 'vue'
import { PhArrowRight, PhPhone, PhPlus, PhWallet } from '@phosphor-icons/vue'
import StatCard from '../components/StatCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { money } from '../utils/formatters'
import api from '../services/api'

const metrics = ref([])
const attention = ref([])
const loading = ref(true)
const error = ref('')
async function load() {
  loading.value = true; error.value = ''
  try {
    const { data } = await api.get('/dashboard')
    metrics.value = [
      { label: 'Outstanding', value: data.metrics.outstanding, detail: `${data.metrics.active_loans} active loans` },
      { label: 'Due today', value: data.metrics.due_today, detail: `${data.metrics.due_today_count} installments`, tone: 'warning' },
      { label: 'Overdue', value: data.metrics.overdue, detail: `${data.metrics.overdue_count} installments`, tone: 'danger' },
      { label: 'Collected today', value: data.metrics.collected_today, detail: 'Posted repayments', tone: 'success' },
    ]
    attention.value = data.attention.map((item) => ({ id: item.id, loanId: item.loan_id, borrowerId: item.loan.borrower.id, name: item.loan.borrower.full_name, phone: item.loan.borrower.phone_number, loan: item.loan.loan_number, amount: item.amount_due - item.amount_paid, status: new Date(`${item.due_date}T23:59:59`) < new Date() ? 'Overdue' : 'Due Today' }))
  } catch (e) { error.value = e.response?.data?.message || 'Dashboard data could not be loaded.' }
  finally { loading.value = false }
}
onMounted(load)
</script>
<template>
  <div class="space-y-5">
    <p v-if="error" class="border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">{{ error }} <button class="ml-2 font-semibold underline" @click="load">Retry</button></p>
    <section v-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div v-for="n in 4" :key="n" class="surface h-32 animate-pulse bg-slate-50" /></section>
    <section v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard v-for="metric in metrics" :key="metric.label" v-bind="metric" /></section>
    <section class="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_300px]">
      <div class="surface overflow-hidden">
        <header class="flex items-center justify-between border-b border-[#e8ecef] px-5 py-4"><div><h2 class="font-semibold text-[#1d2939]">Collection queue</h2><p class="mt-1 text-xs text-[#7d8796]">Due and overdue installments</p></div><RouterLink to="/collections" class="flex items-center gap-1 text-xs font-semibold text-[#287f71]">Open queue<PhArrowRight :size="15" /></RouterLink></header>
        <div v-if="!loading && !attention.length" class="p-8 text-center text-sm text-[#667085]">No installments require attention today.</div>
        <div v-else class="overflow-x-auto"><table class="w-full min-w-[680px] text-left text-sm"><thead class="bg-[#f8fafb] text-[.68rem] font-bold uppercase tracking-[.06em] text-[#7d8796]"><tr><th class="px-5 py-3">Borrower</th><th class="px-4 py-3">Loan</th><th class="px-4 py-3">Amount due</th><th class="px-4 py-3">Status</th><th class="px-5 py-3 text-right">Action</th></tr></thead><tbody class="divide-y divide-[#edf0f2]"><tr v-for="person in attention.slice(0, 6)" :key="person.id" class="hover:bg-[#fafcfc]"><td class="px-5 py-3.5"><RouterLink :to="`/borrowers/${person.borrowerId}`" class="font-semibold text-[#1d2939] hover:text-[#287f71]">{{ person.name }}</RouterLink><p class="mt-1 text-xs text-[#7d8796]">{{ person.phone }}</p></td><td class="px-4 py-3.5"><RouterLink :to="`/loans/${person.loanId}`" class="font-medium text-[#287f71]">{{ person.loan }}</RouterLink></td><td class="px-4 py-3.5 font-semibold tabular-nums">{{ money(person.amount) }}</td><td class="px-4 py-3.5"><StatusBadge :status="person.status" /></td><td class="px-5 py-3.5"><div class="flex justify-end gap-2"><a :href="`tel:${person.phone}`" class="btn-secondary !min-h-8 !px-2.5 !text-xs"><PhPhone :size="15"/>Call</a><RouterLink :to="{ path: '/collections', query: { loan: person.loanId } }" class="btn-primary !min-h-8 !px-2.5 !text-xs"><PhWallet :size="15"/>Collect</RouterLink></div></td></tr></tbody></table></div>
      </div>
      <aside class="surface h-fit overflow-hidden"><header class="border-b border-[#e8ecef] px-5 py-4"><h2 class="font-semibold text-[#1d2939]">New record</h2></header><nav class="divide-y divide-[#edf0f2]"><RouterLink to="/borrowers?add=1" class="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[#475467] hover:bg-[#f7faf9] hover:text-[#287f71]"><PhPlus :size="18"/>Borrower</RouterLink><RouterLink to="/loans/new" class="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[#475467] hover:bg-[#f7faf9] hover:text-[#287f71]"><PhPlus :size="18"/>Loan</RouterLink><RouterLink to="/collections" class="flex items-center gap-3 px-5 py-4 text-sm font-medium text-[#475467] hover:bg-[#f7faf9] hover:text-[#287f71]"><PhWallet :size="18"/>Repayment</RouterLink></nav></aside>
    </section>
  </div>
</template>
