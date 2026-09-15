<script setup>
import { onMounted, reactive, ref } from 'vue'
import { PhBuildings, PhCheckCircle, PhScales } from '@phosphor-icons/vue'
import { useAuthStore } from '../stores/auth'
import LoanProductsPanel from '../components/LoanProductsPanel.vue'
import api from '../services/api'

const auth = useAuthStore()
const activeTab = ref('company')
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const message = ref('')
const form = reactive({ name: '', phone: '', email: '', address: '', currency: 'UGX', regulatory_class: 'money_lender', umra_license_number: '', umra_license_expires_on: '', pdpo_registration_number: '' })

async function load() {
  loading.value = true; error.value = ''
  try {
    const { data } = await api.get('/company')
    Object.assign(form, {
      name: data.name || '', phone: data.settings?.phone || '', email: data.settings?.email || '', address: data.settings?.address || '', currency: data.settings?.currency || 'UGX',
      regulatory_class: data.regulatory_class || 'money_lender', umra_license_number: data.umra_license_number || '',
      umra_license_expires_on: data.umra_license_expires_on?.slice(0, 10) || '', pdpo_registration_number: data.pdpo_registration_number || '',
    })
  } catch (e) { error.value = e.response?.data?.message || 'Company settings could not be loaded.' }
  finally { loading.value = false }
}

async function save() {
  saving.value = true; error.value = ''; message.value = ''
  try {
    const { data } = await api.put('/company', form)
    auth.tenant.name = data.name; auth.tenant.regulatory_class = data.regulatory_class
    localStorage.setItem('kopa_company', JSON.stringify(auth.tenant))
    message.value = 'Company and compliance settings saved.'
  } catch (e) { error.value = Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Settings could not be saved.' }
  finally { saving.value = false }
}
onMounted(load)
</script>

<template>
  <div class="settings-workspace">
    <nav class="section-tabs" aria-label="Settings sections">
      <button :class="{ active: activeTab === 'company' }" @click="activeTab = 'company'"><PhBuildings :size="18"/>Company & compliance</button>
      <button :class="{ active: activeTab === 'products' }" @click="activeTab = 'products'"><PhScales :size="18"/>Loan products</button>
    </nav>
    <LoanProductsPanel v-if="activeTab === 'products'"/>
    <section v-else class="premium-panel overflow-hidden">
      <header class="panel-heading"><div><p class="eyebrow">Workspace profile</p><h2>Company & compliance</h2><p>These details appear on agreements and immutable payment receipts.</p></div><PhCheckCircle :size="24" class="text-[#287f71]"/></header>
      <div v-if="loading" class="skeleton-stack m-7"><i/><i/><i/></div>
      <form v-else class="p-5 sm:p-7" @submit.prevent="save">
        <p v-if="error" class="form-error">{{ error }}</p><p v-if="message" class="form-success">{{ message }}</p>
        <div class="form-grid">
          <label><span class="label">Company name</span><input v-model.trim="form.name" class="field" required/></label><label><span class="label">Phone</span><input v-model.trim="form.phone" class="field"/></label>
          <label><span class="label">Email</span><input v-model.trim="form.email" type="email" class="field"/></label><label><span class="label">Currency</span><select v-model="form.currency" class="field"><option value="UGX">UGX — Uganda Shilling</option></select></label>
          <label class="wide"><span class="label">Business address</span><input v-model.trim="form.address" class="field"/></label>
        </div>
        <div class="form-divider"><span>Uganda regulatory profile</span></div>
        <div class="form-grid">
          <label><span class="label">Regulatory class</span><select v-model="form.regulatory_class" class="field"><option value="money_lender">Tier 4 money lender</option><option value="non_deposit_mfi">Non-deposit-taking MFI</option><option value="sacco">SACCO</option><option value="other">Other Tier 4 provider</option></select></label>
          <label><span class="label">UMRA licence number</span><input v-model.trim="form.umra_license_number" class="field"/></label>
          <label><span class="label">UMRA licence expiry</span><input v-model="form.umra_license_expires_on" type="date" class="field"/></label><label><span class="label">PDPO registration number</span><input v-model.trim="form.pdpo_registration_number" class="field"/></label>
          <div class="wide info-strip"><PhScales :size="21"/><p><strong>Money-lender compliance is enforced server-side.</strong><span>Products use simple interest and cannot exceed the configured 2.8% monthly ceiling. Other regulatory classes remain configurable.</span></p></div>
        </div>
        <footer class="form-actions"><span class="flex-1"/><button class="btn-primary" :disabled="saving">{{ saving ? 'Saving settings' : 'Save changes' }}</button></footer>
      </form>
    </section>
  </div>
</template>
