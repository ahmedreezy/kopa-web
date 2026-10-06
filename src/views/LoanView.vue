<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PhArrowLeft, PhPrinter, PhReceipt, PhWallet } from '@phosphor-icons/vue'
import LoanKeyFactsReport from '../components/LoanKeyFactsReport.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { dateTime, money } from '../utils/formatters'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const route = useRoute()
const auth = useAuthStore()
const loan = ref(null)
const company = ref({})
const loading = ref(true)
const error = ref('')
const paid = computed(() => loan.value ? Number(loan.value.total_payable) - Number(loan.value.outstanding_amount) : 0)
async function load() { loading.value = true; error.value = ''; try { const [loanResponse, companyResponse] = await Promise.all([api.get(`/loans/${route.params.id}`), api.get('/company')]); loan.value = loanResponse.data; company.value = companyResponse.data } catch (e) { error.value = e.response?.status === 404 ? 'Loan account not found.' : 'Loan account could not be loaded.' } finally { loading.value = false } }
onMounted(load)
</script>

<template>
  <div class="space-y-5 loan-account-workspace">
    <RouterLink to="/loans" class="back-link"><PhArrowLeft :size="17"/>Loans</RouterLink>
    <div v-if="loading" class="surface p-8 text-center text-sm text-[#667085]">Loading loan account</div>
    <p v-else-if="error" class="form-error">{{ error }} <button class="ml-2 font-semibold underline" @click="load">Retry</button></p>
    <template v-else>
      <header class="surface no-print flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div class="flex items-center gap-3"><h2 class="text-lg font-semibold text-[#1d2939]">{{ loan.loan_number }}</h2><StatusBadge :status="loan.status === 'completed' ? 'Completed' : 'Active'"/></div><RouterLink :to="`/borrowers/${loan.borrower.id}`" class="mt-1.5 block text-sm font-medium text-[#287f71]">{{ loan.borrower.full_name }} · {{ loan.borrower.phone_number }}</RouterLink></div><div class="flex flex-wrap gap-2"><button class="btn-secondary" @click="window.print()"><PhPrinter :size="17"/>Print agreement</button><RouterLink v-if="loan.status === 'active' && auth.can('repayments.create')" :to="{ path: '/collections', query: { loan: loan.id } }" class="btn-primary"><PhWallet :size="17"/>Record repayment</RouterLink></div></header>

      <LoanKeyFactsReport :loan="loan" :borrower="loan.borrower" :product="loan.product" :guarantors="loan.guarantors" :collateral="loan.collateral" :schedule="loan.schedules" :company="company" :prepared-by="loan.creator?.name || auth.user?.name"/>

      <section class="surface overflow-hidden no-print"><header class="flex items-center justify-between border-b border-[#e8ecef] px-5 py-4"><div><h2 class="font-semibold text-[#1d2939]">Repayments & receipts</h2><p class="mt-1 text-xs text-[#7d8796]">{{ money(paid) }} paid · {{ money(loan.outstanding_amount) }} outstanding</p></div><PhReceipt :size="19" class="text-[#287f71]"/></header><div v-if="!loan.repayments.length" class="p-8 text-center text-sm text-[#667085]">No repayments recorded.</div><div v-else class="divide-y divide-[#edf0f2]"><article v-for="payment in loan.repayments" :key="payment.id" class="flex items-start justify-between gap-3 px-5 py-4"><div><p class="font-semibold tabular-nums" :class="payment.entry_type === 'reversal' ? 'text-red-700' : 'text-[#1d2939]'">{{ money(payment.amount) }}</p><p class="mt-1 text-xs capitalize text-[#7d8796]">{{ payment.payment_method.replace('_', ' ') }} · {{ payment.entry_type }}</p><RouterLink v-if="payment.receipt" :to="`/receipts/${payment.receipt.id}`" class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#287f71]"><PhReceipt :size="14"/>{{ payment.receipt.status === 'reversed' ? 'View reversed receipt' : 'View receipt' }}</RouterLink></div><time class="text-xs text-[#7d8796]">{{ dateTime(payment.paid_at) }}</time></article></div></section>
    </template>
  </div>
</template>
