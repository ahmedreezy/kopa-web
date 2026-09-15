<script setup>
import { computed, onMounted, ref } from 'vue'
import { PhDownloadSimple, PhMagnifyingGlass, PhPlus, PhUsersThree } from '@phosphor-icons/vue'
import StatusBadge from '../components/StatusBadge.vue'
import { money } from '../utils/formatters'
import api from '../services/api'

const query = ref(''); const records = ref([]); const loading = ref(true); const exporting = ref(false); const error = ref('')
const filtered = computed(() => records.value.filter((b) => `${b.name} ${b.phone} ${b.nin || ''} ${b.loan}`.toLowerCase().includes(query.value.toLowerCase())))
const mapBorrower = (b) => { const loan = b.loans?.[0]; return { id: b.id, name: b.full_name, phone: b.phone_number, nin: b.nin, documents: b.documents?.length || 0, loanId: loan?.id, loan: loan?.loan_number || 'No active loan', outstanding: loan?.outstanding_amount || 0, nextDue: loan?.maturity_date || '—', status: loan ? (loan.status === 'overdue' ? 'Overdue' : 'On Track') : 'Registered' } }
async function load() { loading.value = true; error.value = ''; try { const { data } = await api.get('/borrowers'); records.value = data.data.map(mapBorrower) } catch (e) { error.value = e.response?.data?.message || 'Borrowers could not be loaded.' } finally { loading.value = false } }
async function exportCsv() {
  exporting.value = true; error.value = ''
  try {
    const { data } = await api.get('/borrowers/export.csv', { params: { search: query.value || undefined }, responseType: 'blob' })
    const url = URL.createObjectURL(data); const link = document.createElement('a'); link.href = url; link.download = `kopa-borrowers-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url)
  } catch (e) { error.value = e.response?.status === 403 ? 'Only owners and managers can export the borrower register.' : 'The borrower register could not be exported.' }
  finally { exporting.value = false }
}
onMounted(load)
</script>

<template>
  <section class="premium-panel overflow-hidden">
    <header class="list-toolbar">
      <div class="global-filter"><PhMagnifyingGlass :size="18"/><input v-model="query" placeholder="Search name, phone or NIN" aria-label="Search borrowers"/></div>
      <div class="toolbar-actions"><button class="btn-secondary" :disabled="exporting" @click="exportCsv"><PhDownloadSimple :size="17"/>{{ exporting ? 'Exporting' : 'Export CSV' }}</button><RouterLink to="/borrowers/new" class="btn-primary"><PhPlus :size="17"/>Add borrower</RouterLink></div>
    </header>
    <p v-if="error" class="form-error m-5">{{ error }} <button class="font-semibold underline" @click="load">Retry</button></p>
    <div v-if="loading" class="skeleton-stack m-6"><i/><i/><i/></div>
    <div v-else-if="!filtered.length" class="empty-state"><span><PhUsersThree :size="28"/></span><h2>No borrowers found</h2><p>Register a borrower to begin building a lending record.</p><RouterLink to="/borrowers/new" class="btn-primary mt-5"><PhPlus :size="17"/>Add first borrower</RouterLink></div>
    <div v-else class="hidden overflow-x-auto md:block"><table class="data-table"><thead><tr><th>Borrower</th><th>Identity & files</th><th>Loan account</th><th>Outstanding</th><th>Maturity</th><th>Status</th></tr></thead><tbody><tr v-for="person in filtered" :key="person.id"><td><RouterLink :to="`/borrowers/${person.id}`">{{ person.name }}</RouterLink><small>{{ person.phone }}</small></td><td><span class="identity-code">{{ person.nin }}</span><small>{{ person.documents }} document{{ person.documents === 1 ? '' : 's' }}</small></td><td><RouterLink v-if="person.loanId" :to="`/loans/${person.loanId}`">{{ person.loan }}</RouterLink><span v-else>{{ person.loan }}</span></td><td class="tabular-nums font-semibold">{{ money(person.outstanding) }}</td><td>{{ person.nextDue }}</td><td><StatusBadge :status="person.status"/></td></tr></tbody></table></div>
    <div class="mobile-records md:hidden"><RouterLink v-for="person in filtered" :key="person.id" :to="`/borrowers/${person.id}`"><div><strong>{{ person.name }}</strong><small>{{ person.phone }} · {{ person.nin }}</small></div><StatusBadge :status="person.status"/><dl><dt>Outstanding</dt><dd>{{ money(person.outstanding) }}</dd></dl></RouterLink></div>
  </section>
</template>
