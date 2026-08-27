<script setup>
import { onMounted, ref } from 'vue'
import { PhPhone as Phone, PhPlus as Plus, PhWallet as Wallet } from '@phosphor-icons/vue'
import StatCard from '../components/StatCard.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { borrowers, metrics, money } from '../data/demo'
import api from '../services/api'
const liveMetrics = ref(metrics)
const attention = ref(borrowers.slice(0, 4))
onMounted(async () => {
  try {
    const { data } = await api.get('/dashboard')
    liveMetrics.value = [
      { label: 'Money outstanding', value: data.metrics.outstanding, detail: `${data.metrics.active_loans} active loans`, tone: 'default' },
      { label: 'Due today', value: data.metrics.due_today, detail: `${data.metrics.due_today_count} payments`, tone: 'warning' },
      { label: 'Overdue', value: data.metrics.overdue, detail: `${data.metrics.overdue_count} payments`, tone: 'danger' },
      { label: 'Collected today', value: data.metrics.collected_today, detail: 'Confirmed payments', tone: 'success' },
    ]
    attention.value = data.attention.map((item) => ({ id: item.loan.borrower.id, name: item.loan.borrower.full_name, phone: item.loan.borrower.phone_number, outstanding: item.amount_due - item.amount_paid, status: new Date(item.due_date) < new Date() ? 'Overdue' : 'Due Today' }))
  } catch { /* Demo data remains visible while signed out. */ }
})
</script>
<template>
  <div class="space-y-6">
    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard v-for="metric in liveMetrics" :key="metric.label" v-bind="metric" />
    </section>
    <section class="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,.65fr)]">
      <div class="surface overflow-hidden">
        <div class="flex items-center justify-between px-5 py-5 sm:px-6"><div><h2 class="text-lg font-bold">Needs attention</h2><p class="mt-1 text-sm text-stone-500">Due and overdue payments</p></div><RouterLink to="/collections" class="text-sm font-semibold text-emerald-800">View queue</RouterLink></div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[680px] text-left text-sm">
            <thead class="bg-stone-50 text-xs font-semibold uppercase tracking-wide text-stone-500"><tr><th class="px-6 py-3">Borrower</th><th class="px-4 py-3">Amount</th><th class="px-4 py-3">Status</th><th class="px-6 py-3 text-right">Action</th></tr></thead>
            <tbody class="divide-y divide-stone-100">
              <tr v-for="person in attention.slice(0, 4)" :key="person.id" class="hover:bg-stone-50/70">
                <td class="px-6 py-4"><RouterLink :to="`/borrowers/${person.id}`" class="font-semibold text-stone-950 hover:text-emerald-800">{{ person.name }}</RouterLink><p class="mt-1 text-xs text-stone-500">{{ person.phone }}</p></td>
                <td class="px-4 py-4 font-semibold">{{ money(person.outstanding) }}</td><td class="px-4 py-4"><StatusBadge :status="person.status" /></td>
                <td class="px-6 py-4"><div class="flex justify-end gap-2"><a :href="`tel:${person.phone}`" class="btn-secondary !min-h-9 !px-3"><Phone :size="17" />Call</a><button class="btn-primary !min-h-9 !px-3"><Wallet :size="17" />Collect</button></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <aside class="surface p-5 sm:p-6"><h2 class="text-lg font-bold">Quick actions</h2><div class="mt-5 grid gap-3"><RouterLink to="/borrowers" class="btn-secondary justify-start"><Plus :size="19" />Add borrower</RouterLink><RouterLink to="/loans/new" class="btn-primary justify-start"><Plus :size="19" />Issue loan</RouterLink><RouterLink to="/collections" class="btn-secondary justify-start"><Wallet :size="19" />Collect payment</RouterLink></div><div class="mt-7 border-t border-stone-200 pt-6"><p class="text-sm font-semibold text-stone-700">Collection progress</p><div class="mt-3 flex items-end justify-between"><span class="text-3xl font-bold">70%</span><span class="text-sm text-stone-500">UGX 840k of 1.2m</span></div><div class="mt-3 h-2 overflow-hidden rounded-full bg-stone-100"><div class="h-full w-[70%] rounded-full bg-emerald-700" /></div></div></aside>
    </section>
  </div>
</template>
