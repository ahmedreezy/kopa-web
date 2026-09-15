<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowLeft, PhArrowRight, PhCheck, PhInfo, PhPlus, PhShieldCheck, PhTrash } from '@phosphor-icons/vue'
import DocumentUploader from '../components/DocumentUploader.vue'
import { date, money } from '../utils/formatters'
import api from '../services/api'

const router = useRouter(); const route = useRoute()
const step = ref(0); const borrowers = ref([]); const branches = ref([]); const products = ref([]); const documents = ref([]); const quote = ref(null)
const loading = ref(true); const calculating = ref(false); const saving = ref(false); const error = ref('')
const steps = ['Borrower', 'Product & terms', 'Security', 'Key facts']
const today = new Date(); const first = new Date(); first.setDate(first.getDate() + 7)
const iso = (value) => value.toISOString().slice(0, 10)
const form = reactive({ loan_product_id: '', borrower_id: '', branch_id: '', principal_amount: 0, duration: 1, duration_unit: 'months', repayment_frequency: 'monthly', disbursement_date: iso(today), first_repayment_date: iso(first), purpose: '', source_of_repayment: '', declared_disposable_income: 0, guarantors: [], collateral: [], terms_confirmed: false })
const selectedBorrower = computed(() => borrowers.value.find((item) => item.id === form.borrower_id))
const selectedProduct = computed(() => products.value.find((item) => item.id === form.loan_product_id))
const requiredDocuments = computed(() => selectedProduct.value?.required_documents || [])
const docLabel = (value) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

function addGuarantor() { form.guarantors.push({ name: '', phone: '', alternative_phone: '', nin: '', relationship: '', address: '', occupation: '', employer_name: '', monthly_income: 0, consent_confirmed: false }) }
function addCollateral() { form.collateral.push({ security_type: 'business_asset', description: '', estimated_value: 0, forced_sale_value: 0, reference_number: '', owner: selectedBorrower.value?.full_name || '', condition: '', location: '', custody_status: 'with_borrower', simpo_registration_number: '', notes: '' }) }
function applyProduct() {
  const product = selectedProduct.value; if (!product) return
  form.principal_amount = Math.max(Number(product.minimum_principal), Number(form.principal_amount) || 0)
  form.duration = Number(product.minimum_duration); form.duration_unit = product.duration_unit
  form.repayment_frequency = product.repayment_frequencies?.[0] || 'monthly'; quote.value = null
  while (form.guarantors.length < Number(product.minimum_guarantors || 0)) addGuarantor()
  if (product.collateral_required && !form.collateral.length) addCollateral()
}
async function load() {
  try {
    const [borrowerResponse, branchResponse, productResponse] = await Promise.all([api.get('/borrowers'), api.get('/branches'), api.get('/loan-products')])
    borrowers.value = borrowerResponse.data.data; branches.value = branchResponse.data; products.value = productResponse.data.data.filter((item) => item.is_active)
    form.borrower_id = borrowers.value.find((item) => item.id === route.query.borrower)?.id || borrowers.value[0]?.id || ''
    form.branch_id = selectedBorrower.value?.branch_id || branches.value[0]?.id || ''
    form.declared_disposable_income = Number(selectedBorrower.value?.disposable_income || 0)
    form.source_of_repayment = selectedBorrower.value?.repayment_source || ''
    form.loan_product_id = products.value[0]?.id || ''; applyProduct()
  } catch (e) { error.value = e.response?.data?.message || 'Loan form data could not be loaded.' }
  finally { loading.value = false }
}
function selectBorrower() { form.branch_id = selectedBorrower.value?.branch_id || form.branch_id; form.declared_disposable_income = Number(selectedBorrower.value?.disposable_income || 0); form.source_of_repayment = selectedBorrower.value?.repayment_source || '' }
function validateStep() {
  if (step.value === 0 && !form.borrower_id) return 'Select a borrower before continuing.'
  if (step.value === 1 && (!form.loan_product_id || !form.principal_amount || !form.duration || !form.purpose || !form.source_of_repayment)) return 'Complete the product, affordability, and loan-purpose details.'
  if (step.value === 2 && form.guarantors.some((item) => !item.name || !item.phone || !item.consent_confirmed)) return 'Complete each guarantor and record their consent.'
  if (step.value === 2 && selectedProduct.value?.collateral_required && !form.collateral.length) return 'This product requires collateral.'
  if (step.value === 2 && form.collateral.some((item) => !item.description || !item.security_type)) return 'Complete each collateral item.'
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
  error.value = validateStep(); if (error.value) return
  if (step.value === 1 && !await calculate()) return
  step.value = Math.min(steps.length - 1, step.value + 1); window.scrollTo({ top: 0, behavior: 'smooth' })
}
async function createLoan() {
  if (!form.terms_confirmed) { error.value = 'Confirm that the Key Facts and agreement were reviewed with the borrower.'; return }
  saving.value = true; error.value = ''
  try { const { data } = await api.post('/loans', { ...form, document_ids: documents.value.map((item) => item.id) }); router.push(`/loans/${data.id}`) }
  catch (e) { error.value = Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'Loan could not be activated.' }
  finally { saving.value = false }
}
watch(() => [form.principal_amount, form.duration, form.repayment_frequency, form.first_repayment_date], () => { if (step.value < 3) quote.value = null })
onMounted(load)
</script>

<template>
  <div class="form-workspace">
    <RouterLink to="/loans" class="back-link"><PhArrowLeft :size="17"/>Loans</RouterLink>
    <div class="step-rail" aria-label="Loan issuance progress"><div v-for="(item, index) in steps" :key="item" :class="['step-item', { active: step === index, complete: step > index }]"><span>{{ step > index ? '✓' : index + 1 }}</span><small>{{ item }}</small></div></div>
    <section class="premium-panel">
      <header class="panel-heading"><div><p class="eyebrow">Instant loan issuance</p><h2>{{ steps[step] }}</h2><p v-if="step === 3">Review the server-calculated terms before activation and disbursement.</p></div><span>{{ step + 1 }} / {{ steps.length }}</span></header>
      <div v-if="loading" class="skeleton-stack m-7"><i/><i/><i/></div>
      <form v-else @submit.prevent="step === steps.length - 1 ? createLoan() : next()">
        <p v-if="error" class="form-error">{{ error }}</p>
        <div v-if="step === 0" class="form-grid">
          <label class="wide"><span class="label">Registered borrower</span><select v-model="form.borrower_id" class="field" required @change="selectBorrower"><option value="" disabled>Select borrower</option><option v-for="person in borrowers" :key="person.id" :value="person.id">{{ person.full_name }} · {{ person.phone_number }}</option></select></label>
          <article v-if="selectedBorrower" class="wide borrower-summary"><div><span class="avatar">{{ selectedBorrower.full_name.charAt(0) }}</span><p><strong>{{ selectedBorrower.full_name }}</strong><small>{{ selectedBorrower.nin || 'Identity number not available' }} · {{ selectedBorrower.district || 'District not set' }}</small></p></div><dl><div><dt>Monthly income</dt><dd>{{ money(selectedBorrower.monthly_income) }}</dd></div><div><dt>Disposable income</dt><dd>{{ money(selectedBorrower.disposable_income) }}</dd></div></dl></article>
          <RouterLink to="/borrowers/new" class="btn-secondary w-fit"><PhPlus :size="17"/>Register a borrower</RouterLink>
        </div>
        <div v-else-if="step === 1" class="space-y-6">
          <div v-if="!products.length" class="empty-state"><h2>No active loan products</h2><p>An owner or manager must configure one in Settings before a loan can be issued.</p><RouterLink to="/settings" class="btn-primary mt-5">Open settings</RouterLink></div>
          <template v-else><div class="form-grid">
            <label class="wide"><span class="label">Loan product</span><select v-model="form.loan_product_id" class="field" required @change="applyProduct"><option v-for="product in products" :key="product.id" :value="product.id">{{ product.name }} · {{ Number(product.interest_rate).toFixed(2) }}% per {{ product.interest_period.replace('_', ' ') }}</option></select></label>
            <div v-if="selectedProduct" class="wide locked-terms"><PhShieldCheck :size="22"/><p><strong>Pricing is locked by {{ selectedProduct.name }}</strong><span>{{ money(selectedProduct.minimum_principal) }}–{{ money(selectedProduct.maximum_principal) }} · {{ selectedProduct.minimum_duration }}–{{ selectedProduct.maximum_duration }} {{ selectedProduct.duration_unit }} · simple interest only</span></p></div>
            <label><span class="label">Principal amount (UGX)</span><input v-model.number="form.principal_amount" type="number" :min="selectedProduct?.minimum_principal" :max="selectedProduct?.maximum_principal" step="1000" class="field" required/></label>
            <label><span class="label">Duration</span><div class="compound-field"><input v-model.number="form.duration" type="number" :min="selectedProduct?.minimum_duration" :max="selectedProduct?.maximum_duration" class="field" required/><span>{{ form.duration_unit }}</span></div></label>
            <label><span class="label">Repayment frequency</span><select v-model="form.repayment_frequency" class="field"><option v-for="frequency in selectedProduct?.repayment_frequencies" :key="frequency" :value="frequency">{{ frequency === 'biweekly' ? 'Every two weeks' : frequency }}</option></select></label>
            <label><span class="label">Declared disposable income</span><input v-model.number="form.declared_disposable_income" type="number" min="0" class="field" required/></label>
            <label><span class="label">Disbursement date</span><input v-model="form.disbursement_date" type="date" class="field" required/></label><label><span class="label">First repayment date</span><input v-model="form.first_repayment_date" type="date" :min="form.disbursement_date" class="field" required/></label>
            <label class="wide"><span class="label">Loan purpose</span><textarea v-model.trim="form.purpose" class="field min-h-20 py-3" placeholder="Explain what the funds will be used for" required/></label><label class="wide"><span class="label">Source of repayment</span><textarea v-model.trim="form.source_of_repayment" class="field min-h-20 py-3" required/></label>
          </div></template>
        </div>
        <div v-else-if="step === 2" class="space-y-7">
          <section><div class="subsection-heading"><div><h3>Loan guarantors</h3><p>These are legal guarantors for this loan, not the borrower’s next of kin.</p></div><button type="button" class="btn-secondary" @click="addGuarantor"><PhPlus :size="16"/>Add guarantor</button></div>
            <div v-if="!form.guarantors.length" class="inline-empty">This product does not require a guarantor. You may still add one.</div>
            <article v-for="(guarantor, index) in form.guarantors" :key="index" class="nested-form"><header><strong>Guarantor {{ index + 1 }}</strong><button type="button" aria-label="Remove guarantor" @click="form.guarantors.splice(index, 1)"><PhTrash :size="17"/></button></header><div class="form-grid"><label><span class="label">Full name</span><input v-model.trim="guarantor.name" class="field" required/></label><label><span class="label">Phone</span><input v-model.trim="guarantor.phone" class="field" required/></label><label><span class="label">NIN</span><input v-model.trim="guarantor.nin" class="field uppercase"/></label><label><span class="label">Relationship</span><input v-model.trim="guarantor.relationship" class="field"/></label><label class="wide"><span class="label">Address</span><input v-model.trim="guarantor.address" class="field"/></label><label class="wide consent-box"><input v-model="guarantor.consent_confirmed" type="checkbox" required/><span><strong>Guarantor consent recorded</strong><small>The guarantor understands the obligation and use of their personal data.</small></span></label></div></article>
          </section>
          <section><div class="subsection-heading"><div><h3>Collateral and security</h3><p>Never retain a National ID, passport, ATM card, or PIN as collateral.</p></div><button type="button" class="btn-secondary" @click="addCollateral"><PhPlus :size="16"/>Add security</button></div>
            <article v-for="(item, index) in form.collateral" :key="index" class="nested-form"><header><strong>Security item {{ index + 1 }}</strong><button type="button" aria-label="Remove security" @click="form.collateral.splice(index, 1)"><PhTrash :size="17"/></button></header><div class="form-grid"><label><span class="label">Security type</span><select v-model="item.security_type" class="field"><option v-for="kind in ['land','vehicle','motorcycle','business_asset','household_asset','inventory','equipment','livestock','other']" :key="kind" :value="kind">{{ docLabel(kind) }}</option></select></label><label><span class="label">Owner</span><input v-model.trim="item.owner" class="field"/></label><label class="wide"><span class="label">Description</span><input v-model.trim="item.description" class="field" required/></label><label><span class="label">Estimated value</span><input v-model.number="item.estimated_value" type="number" min="0" class="field"/></label><label><span class="label">Forced-sale value</span><input v-model.number="item.forced_sale_value" type="number" min="0" class="field"/></label><label><span class="label">Reference / registration</span><input v-model.trim="item.reference_number" class="field"/></label><label><span class="label">Location</span><input v-model.trim="item.location" class="field"/></label></div></article>
          </section>
          <section><div class="subsection-heading"><div><h3>Loan-specific evidence</h3><p>Files remain private and are attached to this loan after activation.</p></div></div><DocumentUploader v-model="documents"/></section>
        </div>
        <div v-else class="space-y-6">
          <div class="key-facts-title"><p class="eyebrow">Key Facts statement</p><h2>{{ selectedProduct?.name }}</h2><p>{{ selectedBorrower?.full_name }} · issued in Uganda Shillings</p></div>
          <dl v-if="quote" class="facts-grid"><div><dt>Principal</dt><dd>{{ money(form.principal_amount) }}</dd></div><div><dt>Total interest</dt><dd>{{ money(quote.total_interest) }}</dd></div><div><dt>Processing fees</dt><dd>{{ money(quote.fees_amount) }}</dd></div><div class="featured"><dt>Total payable</dt><dd>{{ money(quote.total_payable) }}</dd></div><div><dt>Installment</dt><dd>{{ money(quote.installment_amount) }}</dd></div><div><dt>Maturity</dt><dd>{{ date(quote.maturity_date) }}</dd></div><div><dt>Effective monthly rate</dt><dd>{{ Number(quote.effective_monthly_rate).toFixed(2) }}%</dd></div><div><dt>Effective annual rate</dt><dd>{{ Number(quote.effective_annual_rate).toFixed(2) }}%</dd></div></dl>
          <div class="review-grid"><section><h3>Purpose & affordability</h3><p>{{ form.purpose }}</p><small>Repayment source: {{ form.source_of_repayment }}</small></section><section><h3>Underwriting checklist</h3><ul><li><PhCheck/>{{ form.guarantors.length }} guarantor(s) captured</li><li><PhCheck/>{{ form.collateral.length }} security item(s) captured</li><li v-for="item in requiredDocuments" :key="item"><PhCheck/>{{ docLabel(item) }} required on borrower profile</li></ul></section></div>
          <div class="info-strip"><PhInfo :size="21"/><p><strong>Immediate activation</strong><span>Confirming creates the agreement, activates and disburses the loan. Product terms are snapshotted and cannot be changed later.</span></p></div>
          <label class="consent-box"><input v-model="form.terms_confirmed" type="checkbox" required/><span><strong>Key Facts and agreement reviewed</strong><small>I confirm the borrower received a clear explanation of principal, simple interest, fees, repayment dates, rights, and obligations.</small></span></label>
        </div>
        <footer class="form-actions"><button v-if="step" type="button" class="btn-secondary" @click="step--">Back</button><span class="flex-1"/><button v-if="step < steps.length - 1" class="btn-primary" :disabled="calculating || (step === 1 && !products.length)">{{ calculating ? 'Calculating' : 'Continue' }}<PhArrowRight :size="17"/></button><button v-else class="btn-primary" :disabled="saving"><PhCheck :size="17"/>{{ saving ? 'Activating loan' : 'Confirm & activate loan' }}</button></footer>
      </form>
    </section>
  </div>
</template>
