<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowLeft, PhArrowRight, PhCheck, PhInfo, PhPlus, PhPrinter, PhShieldCheck, PhTrash } from '@phosphor-icons/vue'
import DocumentUploader from '../components/DocumentUploader.vue'
import LoanKeyFactsReport from '../components/LoanKeyFactsReport.vue'
import { useAuthStore } from '../stores/auth'
import { date, money } from '../utils/formatters'
import api from '../services/api'

const router = useRouter(); const route = useRoute()
const auth = useAuthStore()
const step = ref(0); const borrowers = ref([]); const branches = ref([]); const products = ref([]); const company = ref({}); const quote = ref(null)
const loading = ref(true); const calculating = ref(false); const saving = ref(false); const error = ref('')
const steps = ['Borrower', 'Product & terms', 'Security', 'Key facts']
const canPreviewSteps = import.meta.env.DEV
const today = new Date(); const first = new Date(); first.setDate(first.getDate() + 1)
const iso = (value) => value.toISOString().slice(0, 10)
const form = reactive({ loan_product_id: '', borrower_id: '', branch_id: '', principal_amount: 0, duration: 1, duration_unit: 'months', repayment_frequency: 'monthly', first_repayment_date: iso(first), purpose: '', source_of_repayment: '', guarantors: [], collateral: [], terms_confirmed: false })
const securityChoice = reactive({ guarantor: false, collateral: false })
const selectedBorrower = computed(() => borrowers.value.find((item) => item.id === form.borrower_id))
const selectedProduct = computed(() => products.value.find((item) => item.id === form.loan_product_id))
const requiredDocuments = computed(() => selectedProduct.value?.required_documents || [])
const reportLoan = computed(() => ({ ...form, ...quote.value, disbursement_date: iso(today) }))
const docLabel = (value) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

function addGuarantor() { form.guarantors.push({ name: '', phone: '', id_type: 'national_id', nin: '', relationship: '', address: '', consent_confirmed: false, documents: [] }) }
function addCollateral() { form.collateral.push({ security_type: 'business_asset', description: '', estimated_value: 0, owner: selectedBorrower.value?.full_name || '', location: '', custody_status: 'with_borrower', documents: [] }) }
function toggleGuarantor() { securityChoice.guarantor ? (!form.guarantors.length && addGuarantor()) : form.guarantors.splice(0) }
function toggleCollateral() { securityChoice.collateral ? (!form.collateral.length && addCollateral()) : form.collateral.splice(0) }
function identityComplete(guarantor) {
  const required = { national_id: ['national_id_front', 'national_id_back'], refugee_id: ['refugee_id_front', 'refugee_id_back'], passport: ['passport'] }[guarantor.id_type] || []
  return required.every((category) => guarantor.documents.some((document) => document.category === category))
}
function applyProduct() {
  const product = selectedProduct.value; if (!product) return
  form.principal_amount = Number(product.principal_amount)
  form.duration = Number(product.duration); form.duration_unit = product.duration_unit
  form.repayment_frequency = product.repayment_frequencies?.[0] || 'monthly'; quote.value = null
}
async function load() {
  try {
    const [borrowerResponse, branchResponse, productResponse, companyResponse] = await Promise.all([api.get('/borrowers'), api.get('/branches'), api.get('/loan-products'), api.get('/company')])
    borrowers.value = borrowerResponse.data.data; branches.value = branchResponse.data; products.value = productResponse.data.data.filter((item) => item.is_active)
    company.value = companyResponse.data
    form.borrower_id = borrowers.value.find((item) => item.id === route.query.borrower)?.id || borrowers.value[0]?.id || ''
    form.branch_id = selectedBorrower.value?.branch_id || branches.value[0]?.id || ''
    form.source_of_repayment = selectedBorrower.value?.repayment_source || ''
    form.loan_product_id = products.value[0]?.id || ''; applyProduct()
  } catch (e) { error.value = e.response?.data?.message || 'Loan form data could not be loaded.' }
  finally { loading.value = false }
}
function selectBorrower() { form.branch_id = selectedBorrower.value?.branch_id || form.branch_id; form.source_of_repayment = selectedBorrower.value?.repayment_source || '' }
function validateStep() {
  if (step.value === 0 && !form.borrower_id) return 'Select a borrower before continuing.'
  if (step.value === 1 && (!form.loan_product_id || !form.principal_amount || !form.duration || !form.purpose || !form.source_of_repayment)) return 'Complete the product, affordability, and loan-purpose details.'
  if (step.value === 2 && !securityChoice.guarantor && !securityChoice.collateral) return 'Choose at least one guarantor or collateral/security option.'
  if (step.value === 2 && securityChoice.guarantor && form.guarantors.some((item) => !item.name || !item.phone || !item.nin || !item.consent_confirmed || !identityComplete(item))) return 'Complete every guarantor, record consent, and upload the required identification files.'
  if (step.value === 2 && securityChoice.collateral && form.collateral.some((item) => !item.security_type || (item.security_type === 'other' && !item.description) || !item.documents.length)) return 'Complete every collateral item and upload its supporting evidence.'
  return ''
}
async function calculate() {
  calculating.value = true; error.value = ''
  try {
    const { data } = await api.post('/loans/calculate', form); quote.value = data
  } catch (e) { error.value = Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Loan terms could not be calculated.'; return false }
  finally { calculating.value = false }
  return true
}
async function next() {
  const validationError = validateStep()
  if (!canPreviewSteps && validationError) { error.value = validationError; return }
  error.value = ''
  if (step.value === 1 && !validationError && !await calculate() && !canPreviewSteps) return
  step.value = Math.min(steps.length - 1, step.value + 1); window.scrollTo({ top: 0, behavior: 'smooth' })
}
function previewStep(index) {
  if (!canPreviewSteps) return
  error.value = ''
  step.value = index
}
async function createLoan() {
  if (!form.terms_confirmed) { error.value = 'Confirm that the Key Facts and agreement were reviewed with the borrower.'; return }
  saving.value = true; error.value = ''
  const payload = {
    ...form,
    guarantors: form.guarantors.map(({ documents, ...item }) => ({ ...item, document_ids: documents.map((document) => document.id) })),
    collateral: form.collateral.map(({ documents, ...item }) => ({ ...item, document_ids: documents.map((document) => document.id) })),
  }
  try { const { data } = await api.post('/loans', payload); router.push(`/loans/${data.id}`) }
  catch (e) { error.value = Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Loan could not be activated.' }
  finally { saving.value = false }
}
watch(() => [form.principal_amount, form.duration, form.repayment_frequency, form.first_repayment_date], () => { if (step.value < 3) quote.value = null })
onMounted(load)
</script>

<template>
  <div class="form-workspace loan-create-workspace">
    <RouterLink to="/loans" class="back-link"><PhArrowLeft :size="17"/>Loans</RouterLink>
    <div class="step-rail" aria-label="Loan issuance progress">
      <component :is="canPreviewSteps ? 'button' : 'div'" v-for="(item, index) in steps" :key="item" :type="canPreviewSteps ? 'button' : undefined" :class="['step-item', { active: step === index, complete: step > index, interactive: canPreviewSteps }]" @click="previewStep(index)">
        <span>{{ step > index ? '✓' : index + 1 }}</span><small>{{ item }}</small>
      </component>
    </div>
    <section class="premium-panel">
      <header class="panel-heading"><div><p class="eyebrow">Instant loan issuance</p><h2>{{ steps[step] }}</h2><p v-if="step === 3">Review the server-calculated terms before activation and disbursement.</p></div><span>{{ step + 1 }} / {{ steps.length }}</span></header>
      <div v-if="loading" class="skeleton-stack m-7"><i/><i/><i/></div>
      <form v-else :novalidate="canPreviewSteps" @submit.prevent="step === steps.length - 1 ? createLoan() : next()">
        <p v-if="error" class="form-error">{{ error }}</p>
        <div v-if="step === 0" class="form-grid">
          <label class="wide"><span class="label">Registered borrower</span><select v-model="form.borrower_id" class="field" required @change="selectBorrower"><option value="" disabled>Select borrower</option><option v-for="person in borrowers" :key="person.id" :value="person.id">{{ person.full_name }} · {{ person.phone_number }}</option></select></label>
          <article v-if="selectedBorrower" class="wide borrower-summary"><div><span class="avatar">{{ selectedBorrower.full_name.charAt(0) }}</span><p><strong>{{ selectedBorrower.full_name }}</strong><small>{{ selectedBorrower.nin || 'Identity number not available' }} · {{ selectedBorrower.district || 'District not set' }}</small></p></div><dl><div><dt>Average monthly income</dt><dd>{{ money(selectedBorrower.average_monthly_income) }}</dd></div><div><dt>Organization / company</dt><dd>{{ selectedBorrower.organization_name || '—' }}</dd></div></dl></article>
          <RouterLink to="/borrowers/new" class="btn-secondary w-fit"><PhPlus :size="17"/>Register a borrower</RouterLink>
        </div>
        <div v-else-if="step === 1" class="space-y-6">
          <div v-if="!products.length" class="empty-state"><h2>No active loan products</h2><p>An owner or manager must configure one in Settings before a loan can be issued.</p><RouterLink to="/settings" class="btn-primary mt-5">Open settings</RouterLink></div>
          <template v-else><div class="form-grid">
            <label class="wide"><span class="label">Loan product</span><select v-model="form.loan_product_id" class="field" required @change="applyProduct"><option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }} · {{ Number(product.interest_rate).toFixed(2) }}% per {{ product.interest_period.replace('_', ' ') }}</option></select></label>
            <div v-if="selectedProduct" class="wide locked-terms"><PhShieldCheck :size="22"/><p><strong>Pricing is locked by {{ selectedProduct.name }}</strong><span>{{ money(selectedProduct.principal_amount) }} · {{ selectedProduct.duration }} {{ selectedProduct.duration_unit }} · simple interest only</span></p></div>
            <label><span class="label">Principal amount (UGX)</span><input v-model.number="form.principal_amount" type="number" readonly class="field" required/></label>
            <label><span class="label">Duration</span><div class="compound-field"><input v-model.number="form.duration" type="number" readonly class="field" required/><span>{{ form.duration_unit }}</span></div></label>
            <label><span class="label">Repayment frequency</span><select v-model="form.repayment_frequency" class="field"><option v-for="frequency in selectedProduct?.repayment_frequencies" :key="frequency" :value="frequency">{{ frequency === 'biweekly' ? 'Every two weeks' : frequency }}</option></select></label>
            <label><span class="label">Activation / disbursement date</span><input :value="iso(today)" type="date" readonly class="field"/></label><label><span class="label">First repayment date</span><input v-model="form.first_repayment_date" type="date" :min="iso(first)" class="field" required/></label>
            <label class="wide"><span class="label">Loan purpose</span><textarea v-model.trim="form.purpose" class="field min-h-20 py-3" placeholder="Explain what the funds will be used for" required/></label><label class="wide"><span class="label">Source of repayment</span><textarea v-model.trim="form.source_of_repayment" class="field min-h-20 py-3" required/></label>
          </div></template>
        </div>
        <div v-else-if="step === 2" class="space-y-7">
          <fieldset class="security-choice"><legend>Choose loan security</legend><p>Select at least one option. You may use both.</p><div><label><input v-model="securityChoice.guarantor" type="checkbox" @change="toggleGuarantor"/><span><strong>Guarantor</strong><small>Capture a responsible guarantor and verified identification.</small></span></label><label><input v-model="securityChoice.collateral" type="checkbox" @change="toggleCollateral"/><span><strong>Collateral / security</strong><small>Capture an asset and supporting photo or document.</small></span></label></div></fieldset>
          <section v-if="securityChoice.guarantor"><div class="subsection-heading"><div><h3>Loan guarantors</h3><p>Guarantors are attached to this loan and must consent.</p></div><button type="button" class="btn-secondary" @click="addGuarantor"><PhPlus :size="16"/>Add guarantor</button></div>
            <article v-for="(guarantor, index) in form.guarantors" :key="index" class="nested-form"><header><strong>Guarantor {{ index + 1 }}</strong><button v-if="form.guarantors.length > 1" type="button" aria-label="Remove guarantor" @click="form.guarantors.splice(index, 1)"><PhTrash :size="17"/></button></header><div class="security-entry-grid"><div class="form-grid"><label><span class="label">Full name</span><input v-model.trim="guarantor.name" class="field" required/></label><label><span class="label">Phone</span><input v-model.trim="guarantor.phone" class="field" required/></label><label><span class="label">Identification type</span><select v-model="guarantor.id_type" class="field"><option value="national_id">Uganda National ID</option><option value="passport">Passport</option><option value="refugee_id">Refugee ID</option></select></label><label><span class="label">NIN / document number</span><input v-model.trim="guarantor.nin" class="field uppercase" required/></label><label><span class="label">Relationship (optional)</span><input v-model.trim="guarantor.relationship" class="field"/></label><label><span class="label">Address (optional)</span><input v-model.trim="guarantor.address" class="field"/></label><label class="wide consent-box"><input v-model="guarantor.consent_confirmed" type="checkbox" required/><span><strong>Guarantor consent recorded</strong><small>The guarantor understands the obligation and use of their personal data.</small></span></label></div><DocumentUploader v-model="guarantor.documents" :identity-type="guarantor.id_type"/></div></article>
          </section>
          <section v-if="securityChoice.collateral"><div class="subsection-heading"><div><h3>Collateral and security</h3><p>Never retain a National ID, passport, ATM card, or PIN as collateral.</p></div><button type="button" class="btn-secondary" @click="addCollateral"><PhPlus :size="16"/>Add security</button></div>
            <article v-for="(item, index) in form.collateral" :key="index" class="nested-form"><header><strong>Security item {{ index + 1 }}</strong><button v-if="form.collateral.length > 1" type="button" aria-label="Remove security" @click="form.collateral.splice(index, 1)"><PhTrash :size="17"/></button></header><div class="security-entry-grid"><div class="form-grid"><label><span class="label">Security type</span><select v-model="item.security_type" class="field"><option v-for="kind in ['land','vehicle','motorcycle','business_asset','household_asset','inventory','equipment','livestock','other']" :key="kind" :value="kind">{{ docLabel(kind) }}</option></select></label><label><span class="label">Owner</span><input v-model.trim="item.owner" class="field"/></label><label><span class="label">Estimated value (UGX)</span><input v-model.number="item.estimated_value" type="number" min="0" class="field"/></label><label><span class="label">Location</span><input v-model.trim="item.location" class="field"/></label><label v-if="item.security_type === 'other'" class="wide"><span class="label">Description</span><input v-model.trim="item.description" class="field" required/></label></div><DocumentUploader v-model="item.documents" fixed-category="security_evidence" fixed-label="Collateral photo or supporting document"/></div></article>
          </section>
        </div>
        <div v-else class="key-facts-stage space-y-6">
          <div class="no-print flex justify-end"><button type="button" class="btn-secondary" @click="window.print()"><PhPrinter :size="17"/>Print preview</button></div>
          <LoanKeyFactsReport v-if="quote && selectedBorrower" :loan="reportLoan" :borrower="selectedBorrower" :product="selectedProduct" :guarantors="form.guarantors" :collateral="form.collateral" :schedule="quote.schedule" :company="company" :prepared-by="auth.user?.name" preview/>
          <div class="review-grid no-print"><section><h3>Activation checklist</h3><ul><li><PhCheck/>{{ form.guarantors.length }} guarantor(s) captured</li><li><PhCheck/>{{ form.collateral.length }} collateral item(s) captured</li><li v-for="item in requiredDocuments" :key="item"><PhCheck/>{{ docLabel(item) }} verified on borrower profile</li></ul></section><section><h3>Activation date</h3><p>{{ date(today) }}</p><small>The loan and repayment schedule do not exist until confirmation.</small></section></div>
          <div class="info-strip"><PhInfo :size="21"/><p><strong>Immediate activation</strong><span>Confirming creates the agreement, activates the loan and disburses the net amount after the processing fee. Product terms are snapshotted and cannot be changed later.</span></p></div>
          <label class="consent-box"><input v-model="form.terms_confirmed" type="checkbox" required/><span><strong>Key Facts and agreement reviewed</strong><small>I confirm the borrower received a clear explanation of principal, simple interest, fees, repayment dates, rights, and obligations.</small></span></label>
        </div>
        <footer class="form-actions"><button v-if="step" type="button" class="btn-secondary" @click="step--">Back</button><span class="flex-1"/><button v-if="step < steps.length - 1" class="btn-primary" :disabled="calculating || (step === 1 && !products.length)">{{ calculating ? 'Calculating' : 'Continue' }}<PhArrowRight :size="17"/></button><button v-else class="btn-primary" :disabled="saving"><PhCheck :size="17"/>{{ saving ? 'Activating loan' : 'Confirm & activate loan' }}</button></footer>
      </form>
    </section>
  </div>
</template>
