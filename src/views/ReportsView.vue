<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  PhArrowDownRight, PhBank, PhCheckCircle, PhCoins, PhDownloadSimple,
  PhReceipt, PhTrendUp, PhWarningCircle,
} from '@phosphor-icons/vue'
import StatusBadge from '../components/StatusBadge.vue'
import { dateTime, money } from '../utils/formatters'
import api from '../services/api'

const month = ref(new Date().toISOString().slice(0, 7))
const report = ref(null)
const loading = ref(true)
const error = ref('')

const range = computed(() => {
  const [year, value] = month.value.split('-').map(Number)
  const lastDay = String(new Date(year, value, 0).getDate()).padStart(2, '0')
  return { from: `${month.value}-01`, to: `${month.value}-${lastDay}` }
})
const periodLabel = computed(() => new Intl.DateTimeFormat('en-UG', {
  month: 'long', year: 'numeric',
}).format(new Date(`${month.value}-01T12:00:00`)))
const collectionRate = computed(() => Number(report.value?.collection_rate || 0))
const collectionBar = computed(() => Math.min(100, Math.max(0, collectionRate.value)))
const maxStaffAmount = computed(() => Math.max(1, ...((report.value?.collections_by_staff || []).map((row) => Number(row.amount)))))
const portfolioStats = computed(() => report.value ? [
  { label: 'Net collections', value: report.value.money_collected, detail: `${report.value.loans_with_collections} loan accounts`, icon: PhCoins, tone: 'primary' },
  { label: 'Net disbursed', value: report.value.money_lent, detail: `${report.value.loans_disbursed} new loans`, icon: PhBank },
  { label: 'Outstanding', value: report.value.outstanding, detail: 'Across active loans', icon: PhTrendUp },
  { label: 'Overdue balance', value: report.value.overdue, detail: 'Past-due installments', icon: PhWarningCircle, tone: 'danger' },
] : [])

async function load() {
  loading.value = true
  error.value = ''
  try {
    report.value = (await api.get('/reports/summary', { params: range.value })).data
  } catch (e) {
    error.value = e.response?.data?.message || 'Report data could not be loaded.'
  } finally {
    loading.value = false
  }
}

function csvCell(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function exportCsv() {
  if (!report.value) return
  const rows = [
    ['Kopa collections report', periodLabel.value],
    [],
    ['Metric', 'Value'],
    ['Net collections', report.value.money_collected],
    ['Gross collections', report.value.gross_collected],
    ['Reversals', report.value.reversed_amount],
    ['Scheduled due', report.value.scheduled_due],
    ['Collection rate', `${report.value.collection_rate}%`],
    ['Net disbursed', report.value.money_lent],
    ['Interest expected', report.value.interest_expected],
    ['Outstanding', report.value.outstanding],
    ['Overdue', report.value.overdue],
    [],
    ['Collected loan', 'Borrower', 'Collected in period', 'Total collected', 'Outstanding', 'Last payment', 'Status'],
    ...report.value.loan_collections.map((row) => [
      row.loan_number, row.borrower?.full_name, row.collected_in_period, row.total_collected,
      row.outstanding, row.last_payment_at, row.status,
    ]),
    [],
    ['Staff member', 'Role', 'Payments', 'Gross amount', 'Reversals', 'Net amount'],
    ...report.value.collections_by_staff.map((row) => [
      row.name, row.role, row.payments, row.gross_amount, row.reversed_amount, row.amount,
    ]),
  ]
  const blob = new Blob([rows.map((row) => row.map(csvCell).join(',')).join('\n')], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `kopa-collections-report-${month.value}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

function repaymentProgress(row) {
  if (!Number(row.total_payable)) return 0
  return Math.min(100, Math.round((Number(row.total_collected) / Number(row.total_payable)) * 100))
}

onMounted(load)
watch(month, load)
</script>

<template>
  <div class="reports-workspace">
    <section class="report-toolbar">
      <div>
        <p class="eyebrow">Portfolio performance</p>
        <h2>{{ periodLabel }}</h2>
        <p>Disbursements, repayments, arrears and staff collection activity across all branches.</p>
      </div>
      <div class="report-toolbar-actions">
        <label>
          <span>Reporting month</span>
          <input v-model="month" type="month" class="field" aria-label="Reporting month" />
        </label>
        <button class="btn-secondary" :disabled="!report || loading" @click="exportCsv">
          <PhDownloadSimple :size="17" />Export CSV
        </button>
      </div>
    </section>

    <p v-if="error" class="form-error !m-0">
      {{ error }} <button class="ml-2 font-semibold underline" @click="load">Retry</button>
    </p>

    <template v-if="loading">
      <section class="report-kpi-skeleton"><i v-for="n in 5" :key="n" /></section>
      <section class="surface h-80 animate-pulse bg-[#f8faf9]" />
    </template>

    <template v-else-if="report">
      <section class="report-overview">
        <article class="collection-score">
          <div class="collection-score-heading">
            <span><PhReceipt :size="20" weight="duotone" /></span>
            <div><small>Collection performance</small><strong>{{ collectionRate.toFixed(1) }}%</strong></div>
          </div>
          <div class="collection-track" role="progressbar" :aria-valuenow="collectionBar" aria-valuemin="0" aria-valuemax="100">
            <span :style="{ width: `${collectionBar}%` }" />
          </div>
          <div class="collection-score-foot">
            <p><span>Collected</span><strong>{{ money(report.money_collected) }}</strong></p>
            <p><span>Scheduled</span><strong>{{ money(report.scheduled_due) }}</strong></p>
          </div>
          <p v-if="report.reversed_amount" class="reversal-note"><PhArrowDownRight :size="15" />{{ money(report.reversed_amount) }} reversed in this period</p>
        </article>

        <div class="report-stat-grid">
          <article v-for="stat in portfolioStats" :key="stat.label" class="report-stat" :class="`is-${stat.tone || 'neutral'}`">
            <span class="report-stat-icon"><component :is="stat.icon" :size="19" weight="duotone" /></span>
            <div><small>{{ stat.label }}</small><strong>{{ money(stat.value) }}</strong><p>{{ stat.detail }}</p></div>
          </article>
        </div>
      </section>

      <section class="report-facts">
        <div><span>Gross collected</span><strong>{{ money(report.gross_collected) }}</strong></div>
        <div><span>Expected interest</span><strong>{{ money(report.interest_expected) }}</strong></div>
        <div><span>Loans collected</span><strong>{{ report.loans_with_collections }}</strong></div>
        <div><span>Loans completed</span><strong>{{ report.completed_loans }}</strong></div>
      </section>

      <section class="report-data-panel">
        <header class="report-panel-heading">
          <div><p class="eyebrow">Loan-level ledger</p><h2>Collected loans</h2><p>Every loan with a repayment or reversal during {{ periodLabel }}.</p></div>
          <span>{{ report.loan_collections.length }} accounts</span>
        </header>
        <div v-if="!report.loan_collections.length" class="report-empty"><PhReceipt :size="28" /><strong>No collected loans</strong><p>No repayments were posted during this reporting month.</p></div>
        <div v-else class="overflow-x-auto">
          <table class="report-ledger">
            <thead><tr><th>Loan & borrower</th><th>Collected this period</th><th>Total collected</th><th>Outstanding</th><th>Repayment progress</th><th>Last payment</th><th>Status</th></tr></thead>
            <tbody>
              <tr v-for="row in report.loan_collections" :key="row.id">
                <td><RouterLink :to="`/loans/${row.id}`">{{ row.loan_number }}</RouterLink><small>{{ row.borrower?.full_name }} · {{ row.borrower?.phone_number }}</small></td>
                <td class="report-money positive">{{ money(row.collected_in_period) }}</td>
                <td class="report-money">{{ money(row.total_collected) }}</td>
                <td class="report-money">{{ money(row.outstanding) }}</td>
                <td><div class="loan-progress"><span><i :style="{ width: `${repaymentProgress(row)}%` }" /></span><small>{{ repaymentProgress(row) }}%</small></div></td>
                <td>{{ dateTime(row.last_payment_at) }}</td>
                <td><StatusBadge :status="row.status === 'completed' ? 'Completed' : 'Active'" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="report-data-panel">
        <header class="report-panel-heading compact">
          <div><p class="eyebrow">Team accountability</p><h2>Collections by staff</h2><p>Net posted value after reversals.</p></div>
          <PhCheckCircle :size="22" weight="duotone" />
        </header>
        <div v-if="!report.collections_by_staff.length" class="report-empty"><strong>No staff activity</strong><p>No repayments were posted during this reporting month.</p></div>
        <div v-else class="staff-performance-list">
          <article v-for="row in report.collections_by_staff" :key="row.id">
            <div class="staff-rank">{{ row.name.split(' ').map((part) => part[0]).slice(0, 2).join('') }}</div>
            <div class="staff-performance-main"><strong>{{ row.name }}</strong><small>{{ row.role.replace('_', ' ') }} · {{ row.payments }} payment{{ row.payments === 1 ? '' : 's' }}</small><span><i :style="{ width: `${Math.max(3, (Number(row.amount) / maxStaffAmount) * 100)}%` }" /></span></div>
            <div class="staff-performance-value"><strong>{{ money(row.amount) }}</strong><small v-if="row.reversed_amount">{{ money(row.reversed_amount) }} reversed</small></div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>
