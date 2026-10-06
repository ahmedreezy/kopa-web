<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { PhBuildings, PhCheck, PhPlus, PhShieldCheck, PhUsers, PhX } from '@phosphor-icons/vue'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const auth = useAuthStore()
const staff = ref([])
const branches = ref([])
const tab = ref('staff')
const adding = ref(false)
const saving = ref(false)
const loading = ref(true)
const error = ref('')
const staffForm = reactive({ name: '', email: '', phone: '', role: 'loan_officer', branch_id: '', password: '' })
const branchForm = reactive({ name: '', code: '', phone: '', address: '' })
const branchNames = computed(() => Object.fromEntries(branches.value.map((branch) => [branch.id, branch.name])))
const canAdd = computed(() => tab.value === 'staff' ? auth.can('staff.manage') : tab.value === 'branches' && auth.can('branches.manage'))
const tabs = [
  { id: 'staff', label: 'Staff', icon: PhUsers },
  { id: 'branches', label: 'Branches', icon: PhBuildings },
  { id: 'roles', label: 'Role access', icon: PhShieldCheck },
]
const roleProfiles = [
  { role: 'Owner', summary: 'Full workspace control and final accountability.', access: ['All records and documents', 'Company and loan products', 'Staff, branches and reports', 'Repayment reversal'] },
  { role: 'Manager', summary: 'Runs lending operations without ownership controls.', access: ['Borrowers and loans', 'Collections and reversals', 'Reports and staff register', 'Branches and loan products'] },
  { role: 'Loan officer', summary: 'Registers borrowers and originates loans.', access: ['Borrower registration and edit', 'Identity document handling', 'Loan quotation and activation', 'Own operational dashboard'] },
  { role: 'Collector', summary: 'Works the repayment queue and issues receipts.', access: ['Collection queue', 'Record repayments', 'Borrower and loan lookup', 'Payment receipts'] },
  { role: 'Accountant', summary: 'Reviews portfolio and financial performance.', access: ['Reports and exports', 'Borrower and loan lookup', 'Collections in view-only mode', 'Payment receipts'] },
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [staffResponse, branchResponse] = await Promise.all([api.get('/staff'), api.get('/branches')])
    staff.value = staffResponse.data
    branches.value = branchResponse.data
    staffForm.branch_id ||= branches.value[0]?.id || ''
  } catch (e) {
    error.value = e.response?.data?.message || 'Staff records could not be loaded.'
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  error.value = ''
  try {
    if (tab.value === 'staff') {
      const { data } = await api.post('/staff', staffForm)
      staff.value.push(data)
      Object.assign(staffForm, { name: '', email: '', phone: '', role: 'loan_officer', branch_id: branches.value[0]?.id || '', password: '' })
    } else {
      const { data } = await api.post('/branches', branchForm)
      branches.value.push(data)
      Object.assign(branchForm, { name: '', code: '', phone: '', address: '' })
    }
    adding.value = false
  } catch (e) {
    error.value = Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Record could not be saved.'
  } finally {
    saving.value = false
  }
}

function selectTab(value) {
  tab.value = value
  adding.value = false
}

onMounted(load)
</script>

<template>
  <section class="surface overflow-hidden">
    <header class="flex flex-col gap-3 border-b border-[#e8ecef] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex gap-1 overflow-x-auto">
        <button v-for="item in tabs" :key="item.id" class="flex min-h-10 shrink-0 items-center gap-2 rounded-[7px] px-3 text-sm font-semibold" :class="tab === item.id ? 'bg-[#eaf4f2] text-[#1f675c]' : 'text-[#667085]'" @click="selectTab(item.id)">
          <component :is="item.icon" :size="17" />{{ item.label }}
        </button>
      </div>
      <button v-if="canAdd" class="btn-primary" @click="adding = !adding"><component :is="adding ? PhX : PhPlus" :size="17" />{{ adding ? 'Close' : `Add ${tab === 'staff' ? 'staff' : 'branch'}` }}</button>
    </header>

    <p v-if="error" class="m-4 border-l-4 border-red-500 bg-red-50 p-3 text-sm text-red-800">{{ error }}</p>

    <form v-if="adding" class="grid gap-4 border-b border-[#e8ecef] bg-[#f8fafb] p-5 sm:grid-cols-2 lg:grid-cols-3" @submit.prevent="save">
      <template v-if="tab === 'staff'">
        <label><span class="label">Full name</span><input v-model.trim="staffForm.name" class="field" required /></label>
        <label><span class="label">Email</span><input v-model.trim="staffForm.email" type="email" class="field" required /></label>
        <label><span class="label">Phone</span><input v-model.trim="staffForm.phone" class="field" /></label>
        <label><span class="label">Role</span><select v-model="staffForm.role" class="field"><option value="manager">Manager</option><option value="loan_officer">Loan officer</option><option value="collector">Collector</option><option value="accountant">Accountant</option></select></label>
        <label><span class="label">Branch</span><select v-model="staffForm.branch_id" class="field"><option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option></select></label>
        <label><span class="label">Temporary password</span><input v-model="staffForm.password" type="password" minlength="8" class="field" required /></label>
      </template>
      <template v-else>
        <label><span class="label">Branch name</span><input v-model.trim="branchForm.name" class="field" required /></label>
        <label><span class="label">Code</span><input v-model.trim="branchForm.code" class="field uppercase" required /></label>
        <label><span class="label">Phone</span><input v-model.trim="branchForm.phone" class="field" /></label>
        <label class="sm:col-span-2"><span class="label">Address</span><input v-model.trim="branchForm.address" class="field" /></label>
      </template>
      <div class="flex justify-end gap-2 sm:col-span-2 lg:col-span-3"><button type="button" class="btn-secondary" @click="adding = false">Cancel</button><button class="btn-primary" :disabled="saving">{{ saving ? 'Saving' : 'Save record' }}</button></div>
    </form>

    <div v-if="loading" class="p-8 text-center text-sm text-[#667085]">Loading records</div>
    <div v-else-if="tab === 'staff'" class="overflow-x-auto">
      <table class="w-full min-w-[650px] text-left text-sm"><thead class="bg-[#f8fafb] text-[.68rem] font-bold uppercase tracking-wide text-[#7d8796]"><tr><th class="px-5 py-3">Staff member</th><th class="px-4 py-3">Role</th><th class="px-4 py-3">Branch</th><th class="px-5 py-3">Status</th></tr></thead><tbody class="divide-y divide-[#edf0f2]"><tr v-for="person in staff" :key="person.id"><td class="px-5 py-3.5"><p class="font-semibold text-[#1d2939]">{{ person.name }}</p><p class="mt-1 text-xs text-[#7d8796]">{{ person.email }}</p></td><td class="px-4 py-3.5 capitalize">{{ person.role.replace('_', ' ') }}</td><td class="px-4 py-3.5">{{ branchNames[person.branch_id] || 'All branches' }}</td><td class="px-5 py-3.5"><span :class="person.is_active ? 'text-[#287f71]' : 'text-red-700'" class="font-semibold">{{ person.is_active ? 'Active' : 'Inactive' }}</span></td></tr></tbody></table>
    </div>
    <div v-else-if="tab === 'branches'" class="divide-y divide-[#edf0f2]"><div v-for="branch in branches" :key="branch.id" class="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_120px_1fr_80px]"><strong class="text-[#1d2939]">{{ branch.name }}</strong><span class="text-sm">{{ branch.code }}</span><span class="text-sm text-[#667085]">{{ branch.address || branch.phone || 'No contact details' }}</span><span class="text-sm font-semibold text-[#287f71]">{{ branch.is_active ? 'Active' : 'Inactive' }}</span></div></div>
    <div v-else class="role-access-grid">
      <article v-for="profile in roleProfiles" :key="profile.role"><header><span><PhShieldCheck :size="18" /></span><div><h2>{{ profile.role }}</h2><p>{{ profile.summary }}</p></div></header><ul><li v-for="access in profile.access" :key="access"><PhCheck :size="14" />{{ access }}</li></ul></article>
    </div>
  </section>
</template>
