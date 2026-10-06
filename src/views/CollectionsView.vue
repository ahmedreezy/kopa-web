<script setup>
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { PhCheckCircle, PhPhone } from '@phosphor-icons/vue'
import StatusBadge from '../components/StatusBadge.vue'
import { date, money } from '../utils/formatters'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const route = useRoute()
const auth = useAuthStore()
const activeTab = ref(
  route.query.view === 'overdue'
    ? 'Overdue'
    : route.query.view === 'upcoming'
      ? 'Upcoming'
      : 'Due today',
)
const records = ref([])
const loading = ref(true)
const collectingId = ref(null)
const error = ref('')
const success = ref(null)

const tabs = ['Due today', 'Overdue', 'Upcoming']
const views = { 'Due today': 'due_today', Overdue: 'overdue', Upcoming: 'upcoming' }

function installmentStatus(dueDate) {
  const today = new Date()
  const due = new Date(`${dueDate}T00:00:00`)

  if (due.toDateString() === today.toDateString()) return 'Due Today'
  return due < today ? 'Overdue' : 'Upcoming'
}

async function load() {
  loading.value = true
  error.value = ''

  try {
    const { data } = await api.get('/collections', {
      params: { view: views[activeTab.value] },
    })

    records.value = data.data.map((item) => ({
      id: item.id,
      loanId: item.loan_id,
      borrowerId: item.loan.borrower.id,
      name: item.loan.borrower.full_name,
      phone: item.loan.borrower.phone_number,
      loan: item.loan.loan_number,
      due: item.amount_due - item.amount_paid,
      dueDate: item.due_date,
      status: installmentStatus(item.due_date),
    }))
  } catch (e) {
    error.value = e.response?.data?.message || 'Collection queue could not be loaded.'
  } finally {
    loading.value = false
  }
}

async function collect(item) {
  collectingId.value = item.id
  error.value = ''
  success.value = null

  try {
    const { data } = await api.post(`/collections/${item.id}/collect`)
    success.value = {
      borrower: item.name,
      amount: item.due,
      receiptId: data.receipt.id,
    }
    await load()
  } catch (e) {
    error.value =
      Object.values(e.response?.data?.errors || {})[0]?.[0] ||
      e.response?.data?.message ||
      'The installment could not be marked as collected.'
  } finally {
    collectingId.value = null
  }
}

onMounted(load)
watch(activeTab, () => {
  success.value = null
  load()
})
</script>

<template>
  <div class="space-y-4">
    <div class="border-l-4 border-[#287f71] bg-[#f1f8f6] px-4 py-3 text-sm text-[#365f58]">
      Only the next unpaid installment for each loan appears here. After it is collected, the
      following installment will appear on its due date.
    </div>

    <div class="flex gap-1 overflow-x-auto border-b border-[#dfe4e8]">
      <button
        v-for="tab in tabs"
        :key="tab"
        class="shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold"
        :class="
          activeTab === tab
            ? 'border-[#287f71] text-[#1f675c]'
            : 'border-transparent text-[#667085]'
        "
        @click="activeTab = tab"
      >
        {{ tab }}
      </button>
    </div>

    <div
      v-if="success"
      class="flex flex-wrap items-center justify-between gap-3 border-l-4 border-emerald-500 bg-emerald-50 p-3 text-sm text-emerald-900"
    >
      <span>
        {{ money(success.amount) }} collected from {{ success.borrower }}. The next installment
        will appear when due.
      </span>
      <RouterLink :to="`/receipts/${success.receiptId}`" class="font-semibold underline">
        View receipt
      </RouterLink>
    </div>

    <p v-if="error" class="border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">
      {{ error }}
      <button class="ml-2 font-semibold underline" @click="load">Retry</button>
    </p>

    <div v-if="loading" class="surface p-8 text-center text-sm text-[#667085]">
      Loading collection queue
    </div>

    <div v-else-if="!records.length" class="surface p-10 text-center text-sm text-[#667085]">
      {{
        activeTab === 'Due today'
          ? 'Nothing to collect today. Scheduled installments will appear when they are due.'
          : 'No installments in this queue.'
      }}
    </div>

    <section v-else class="surface overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[780px] text-left text-sm">
          <thead class="bg-[#f8fafb] text-[.68rem] font-bold uppercase tracking-wide text-[#7d8796]">
            <tr>
              <th class="px-5 py-3">Borrower</th>
              <th class="px-4 py-3">Loan</th>
              <th class="px-4 py-3">Due date</th>
              <th class="px-4 py-3">Amount due</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#edf0f2]">
            <tr v-for="item in records" :key="item.id" class="hover:bg-[#fafcfc]">
              <td class="px-5 py-3.5">
                <RouterLink
                  :to="`/borrowers/${item.borrowerId}`"
                  class="font-semibold text-[#1d2939]"
                >
                  {{ item.name }}
                </RouterLink>
                <p class="mt-1 text-xs text-[#7d8796]">{{ item.phone }}</p>
              </td>
              <td class="px-4 py-3.5">
                <RouterLink :to="`/loans/${item.loanId}`" class="font-medium text-[#287f71]">
                  {{ item.loan }}
                </RouterLink>
              </td>
              <td class="px-4 py-3.5">{{ date(item.dueDate) }}</td>
              <td class="px-4 py-3.5 font-semibold tabular-nums">{{ money(item.due) }}</td>
              <td class="px-4 py-3.5"><StatusBadge :status="item.status" /></td>
              <td class="px-5 py-3.5">
                <div class="flex justify-end gap-2">
                  <a :href="`tel:${item.phone}`" class="btn-secondary !min-h-8 !px-2.5 !text-xs">
                    <PhPhone :size="15" />Call
                  </a>
                  <button
                    v-if="activeTab !== 'Upcoming' && auth.can('repayments.create')"
                    class="btn-primary !min-h-8 !px-2.5 !text-xs"
                    :disabled="collectingId === item.id"
                    @click="collect(item)"
                  >
                    <PhCheckCircle :size="15" />
                    {{ collectingId === item.id ? 'Collecting' : 'Mark collected' }}
                  </button>
                  <span v-else class="inline-flex items-center px-2.5 text-xs font-semibold text-[#7d8796]">
                    {{ activeTab === 'Upcoming' ? 'Wait until due' : 'View only' }}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
