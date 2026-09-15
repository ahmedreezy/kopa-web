<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { PhArrowLeft, PhPrinter, PhSealCheck, PhWarningCircle } from '@phosphor-icons/vue'
import { dateTime, money } from '../utils/formatters'
import api from '../services/api'

const route = useRoute(); const receipt = ref(null); const loading = ref(true); const error = ref('')
async function load() { loading.value = true; error.value = ''; try { receipt.value = (await api.get(`/receipts/${route.params.id}`)).data } catch (e) { error.value = e.response?.status === 404 ? 'Receipt not found.' : 'Receipt could not be loaded.' } finally { loading.value = false } }
const printReceipt = () => window.print()
onMounted(load)
</script>

<template>
  <div class="receipt-workspace">
    <div class="receipt-actions"><RouterLink :to="receipt?.loan_id ? `/loans/${receipt.loan_id}` : '/collections'" class="back-link"><PhArrowLeft :size="17"/>Back to loan</RouterLink><button class="btn-primary" @click="printReceipt"><PhPrinter :size="17"/>Print / Save PDF</button></div>
    <div v-if="loading" class="premium-panel skeleton-stack p-8"><i/><i/><i/></div>
    <p v-else-if="error" class="form-error">{{ error }}</p>
    <article v-else class="receipt-paper">
      <div v-if="receipt.status === 'reversed'" class="reversal-banner"><PhWarningCircle :size="20"/><strong>REVERSED RECEIPT</strong><span>This original receipt is retained for audit. Reversed {{ dateTime(receipt.reversed_at) }}.</span></div>
      <header class="receipt-header"><div class="receipt-brand"><span>K</span><div><h2>{{ receipt.snapshot?.company?.name || 'Kopa' }}</h2><p>{{ receipt.snapshot?.company?.address }}</p><p>{{ [receipt.snapshot?.company?.phone, receipt.snapshot?.company?.email].filter(Boolean).join(' · ') }}</p></div></div><div class="receipt-number"><p>Official payment receipt</p><strong>{{ receipt.receipt_number }}</strong><small>Issued {{ dateTime(receipt.issued_at) }}</small></div></header>
      <section class="receipt-paid"><PhSealCheck :size="35"/><p>Amount received</p><strong>{{ money(receipt.amount_paid) }}</strong><span>Uganda Shillings</span></section>
      <dl class="receipt-details">
        <div><dt>Received from</dt><dd>{{ receipt.snapshot?.borrower?.name || receipt.loan?.borrower?.full_name }}</dd></div><div><dt>Borrower phone</dt><dd>{{ receipt.snapshot?.borrower?.phone || '—' }}</dd></div>
        <div><dt>Loan account</dt><dd>{{ receipt.snapshot?.loan?.number || receipt.loan?.loan_number }}</dd></div><div><dt>Balance after payment</dt><dd>{{ money(receipt.remaining_balance) }}</dd></div>
        <div><dt>Payment method</dt><dd class="capitalize">{{ receipt.snapshot?.payment?.method?.replace('_', ' ') }}</dd></div><div><dt>Transaction reference</dt><dd>{{ receipt.snapshot?.payment?.reference || 'Cash payment' }}</dd></div>
        <div><dt>Payment date</dt><dd>{{ dateTime(receipt.snapshot?.payment?.paid_at) }}</dd></div><div><dt>Collected by</dt><dd>{{ receipt.snapshot?.collector?.name || 'Kopa staff' }}</dd></div>
      </dl>
      <footer class="receipt-footer"><p>This computer-generated receipt is an immutable record of payment. Keep it for your records.</p><span>Generated securely by Kopa · UGX</span></footer>
    </article>
  </div>
</template>
