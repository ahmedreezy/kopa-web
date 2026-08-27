<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { PhPhone as Phone, PhWallet as Wallet } from '@phosphor-icons/vue'
import StatusBadge from '../components/StatusBadge.vue'
import { borrowers, money, payments } from '../data/demo'
const route = useRoute()
const borrower = computed(() => borrowers.find((item) => item.id === route.params.id) || borrowers[0])
</script>
<template>
  <div class="space-y-6">
    <section class="surface p-5 sm:p-7"><div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><div class="flex items-center gap-3"><div class="grid size-12 place-items-center rounded-xl bg-emerald-100 font-bold text-emerald-900">{{ borrower.name.split(' ').map(n => n[0]).join('') }}</div><div><h2 class="text-xl font-bold">{{ borrower.name }}</h2><p class="text-sm text-stone-500">{{ borrower.phone }}</p></div></div><div class="mt-4"><StatusBadge :status="borrower.status" /></div></div><div class="flex gap-2"><a :href="`tel:${borrower.phone}`" class="btn-secondary"><Phone :size="19" />Call</a><button class="btn-primary"><Wallet :size="19" />Collect payment</button></div></div><div class="mt-8 grid gap-5 border-t border-stone-200 pt-6 sm:grid-cols-3"><div><p class="text-sm text-stone-500">Total outstanding</p><p class="mt-2 text-2xl font-bold">{{ money(borrower.outstanding) }}</p></div><div><p class="text-sm text-stone-500">Active loan</p><p class="mt-2 text-lg font-bold">{{ borrower.loan }}</p></div><div><p class="text-sm text-stone-500">Next payment</p><p class="mt-2 text-lg font-bold">{{ borrower.nextDue }}</p></div></div></section>
    <div class="grid gap-6 lg:grid-cols-[1.25fr_.75fr]"><section class="surface p-5 sm:p-6"><h2 class="text-lg font-bold">Payment history</h2><div class="mt-4 divide-y divide-stone-100"><div v-for="payment in payments" :key="payment.date" class="flex items-center justify-between py-4"><div><p class="font-semibold">{{ money(payment.amount) }}</p><p class="mt-1 text-xs text-stone-500">{{ payment.method }} · {{ payment.collector }}</p></div><time class="text-sm text-stone-500">{{ payment.date }}</time></div></div></section><section class="surface p-5 sm:p-6"><h2 class="text-lg font-bold">Collateral</h2><div class="mt-4 rounded-xl bg-stone-50 p-4"><p class="font-semibold">Bajaj Boxer motorcycle</p><p class="mt-1 text-sm text-stone-500">Registration UFP 482K</p><p class="mt-4 text-sm"><span class="text-stone-500">Estimated value</span><br><strong>{{ money(1800000) }}</strong></p></div></section></div>
  </div>
</template>
