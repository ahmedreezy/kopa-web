<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { PhArrowLeft, PhArrowRight, PhCheck, PhShieldCheck } from '@phosphor-icons/vue'
import DocumentUploader from '../components/DocumentUploader.vue'
import api from '../services/api'

const route = useRoute(); const router = useRouter()
const editing = computed(() => Boolean(route.params.id))
const step = ref(0); const loading = ref(true); const saving = ref(false); const error = ref(''); const branches = ref([]); const documents = ref([])
const steps = ['Identity', 'Residence', 'Work & income', 'Next of kin', 'Documents & consent']
const form = reactive({
  branch_id: '', borrower_type: 'individual', full_name: '', date_of_birth: '', phone_number: '', alternative_phone: '', email: '', id_type: 'national_id', nin: '',
  address: '', district: '', sub_county: '', parish: '', village: '', lc1_reference: '', occupation: '', employer_name: '', business_name: '', business_sector: '', tin: '', years_operating: '',
  monthly_income: 0, monthly_expenses: 0, disposable_income: 0, repayment_source: '', next_of_kin: '', next_of_kin_relationship: '', next_of_kin_phone: '', next_of_kin_alternative_phone: '', next_of_kin_address: '', notes: '', consent_confirmed: false,
})
const maxBirthDate = computed(() => { const date = new Date(); date.setFullYear(date.getFullYear() - 18); return date.toISOString().slice(0, 10) })

async function load() {
  try {
    branches.value = (await api.get('/branches')).data
    form.branch_id = branches.value[0]?.id || ''
    if (editing.value) {
      const { data } = await api.get(`/borrowers/${route.params.id}`)
      for (const key of Object.keys(form)) if (data[key] !== null && data[key] !== undefined && key !== 'consent_confirmed') form[key] = data[key]
      form.date_of_birth = data.date_of_birth?.slice(0, 10) || ''
      form.consent_confirmed = true
      documents.value = data.documents || []
    }
  } catch (e) { error.value = e.response?.data?.message || 'The borrower form could not be loaded.' }
  finally { loading.value = false }
}
function next() { error.value = ''; step.value = Math.min(steps.length - 1, step.value + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
function previous() { step.value = Math.max(0, step.value - 1) }
async function save() {
  saving.value = true; error.value = ''
  try {
    const payload = { ...form, document_ids: documents.value.map((item) => item.id), years_operating: form.years_operating === '' ? null : Number(form.years_operating) }
    const { data } = editing.value ? await api.put(`/borrowers/${route.params.id}`, payload) : await api.post('/borrowers', payload)
    router.push(`/borrowers/${data.id}`)
  } catch (e) { error.value = Object.values(e.response?.data?.errors || {})[0]?.[0] || e.response?.data?.message || 'The borrower could not be saved.' }
  finally { saving.value = false }
}
onMounted(load)
</script>

<template>
  <div class="form-workspace">
    <RouterLink to="/borrowers" class="back-link"><PhArrowLeft :size="17"/>Borrowers</RouterLink>
    <div class="step-rail" aria-label="Borrower application progress">
      <div v-for="(item, index) in steps" :key="item" :class="['step-item', { active: step === index, complete: step > index }]">
        <span>{{ step > index ? '✓' : index + 1 }}</span><small>{{ item }}</small>
      </div>
    </div>
    <section class="premium-panel">
      <header class="panel-heading"><div><p class="eyebrow">Borrower application</p><h2>{{ editing ? 'Update' : 'Create' }} borrower · {{ steps[step] }}</h2></div><span>{{ step + 1 }} / {{ steps.length }}</span></header>
      <div v-if="loading" class="skeleton-stack"><i/><i/><i/></div>
      <form v-else @submit.prevent="step === steps.length - 1 ? save() : next()">
        <p v-if="error" class="form-error">{{ error }}</p>
        <div v-if="step === 0" class="form-grid">
          <label><span class="label">Borrower type</span><select v-model="form.borrower_type" class="field"><option value="individual">Individual</option><option value="sole_trader">Sole trader / microbusiness</option></select></label>
          <label><span class="label">Branch</span><select v-model="form.branch_id" class="field" required><option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option></select></label>
          <label class="wide"><span class="label">Full legal name</span><input v-model.trim="form.full_name" class="field" required/></label>
          <label><span class="label">Date of birth</span><input v-model="form.date_of_birth" type="date" :max="maxBirthDate" class="field" required/></label>
          <label><span class="label">Primary phone</span><input v-model.trim="form.phone_number" class="field" placeholder="07…" required/></label>
          <label><span class="label">Alternative phone</span><input v-model.trim="form.alternative_phone" class="field"/></label>
          <label><span class="label">Email</span><input v-model.trim="form.email" type="email" class="field"/></label>
          <label><span class="label">Identification type</span><select v-model="form.id_type" class="field"><option value="national_id">Uganda National ID</option><option value="passport">Passport</option><option value="refugee_id">Refugee ID</option></select></label>
          <label><span class="label">NIN / document number</span><input v-model.trim="form.nin" class="field uppercase" required/></label>
        </div>
        <div v-else-if="step === 1" class="form-grid">
          <label class="wide"><span class="label">Physical address</span><input v-model.trim="form.address" class="field" required/></label>
          <label><span class="label">District</span><input v-model.trim="form.district" class="field" required/></label>
          <label><span class="label">Sub-county</span><input v-model.trim="form.sub_county" class="field"/></label>
          <label><span class="label">Parish</span><input v-model.trim="form.parish" class="field"/></label>
          <label><span class="label">Village</span><input v-model.trim="form.village" class="field"/></label>
          <label class="wide"><span class="label">LC1 reference or recommendation</span><input v-model.trim="form.lc1_reference" class="field"/></label>
        </div>
        <div v-else-if="step === 2" class="form-grid">
          <label><span class="label">Occupation</span><input v-model.trim="form.occupation" class="field" required/></label>
          <label><span class="label">Employer</span><input v-model.trim="form.employer_name" class="field"/></label>
          <label><span class="label">Business name</span><input v-model.trim="form.business_name" class="field"/></label>
          <label><span class="label">Business sector</span><input v-model.trim="form.business_sector" class="field"/></label>
          <label><span class="label">TIN</span><input v-model.trim="form.tin" class="field"/></label>
          <label><span class="label">Years operating</span><input v-model="form.years_operating" type="number" min="0" max="100" class="field"/></label>
          <label><span class="label">Monthly income / revenue (UGX)</span><input v-model.number="form.monthly_income" type="number" min="0" class="field" required/></label>
          <label><span class="label">Monthly expenses (UGX)</span><input v-model.number="form.monthly_expenses" type="number" min="0" class="field" required/></label>
          <label><span class="label">Disposable income (UGX)</span><input v-model.number="form.disposable_income" type="number" min="0" class="field" required/></label>
          <label class="wide"><span class="label">Expected source of repayments</span><textarea v-model.trim="form.repayment_source" class="field min-h-24 py-3" required/></label>
        </div>
        <div v-else-if="step === 3" class="form-grid">
          <div class="wide info-strip"><PhShieldCheck :size="21"/><p><strong>Next of kin is a contact, not a guarantor.</strong><span>A guarantor is captured separately for a specific loan and must provide consent.</span></p></div>
          <label><span class="label">Full name</span><input v-model.trim="form.next_of_kin" class="field" required/></label>
          <label><span class="label">Relationship</span><input v-model.trim="form.next_of_kin_relationship" class="field" required/></label>
          <label><span class="label">Primary phone</span><input v-model.trim="form.next_of_kin_phone" class="field" required/></label>
          <label><span class="label">Alternative phone</span><input v-model.trim="form.next_of_kin_alternative_phone" class="field"/></label>
          <label class="wide"><span class="label">Address</span><input v-model.trim="form.next_of_kin_address" class="field"/></label>
        </div>
        <div v-else class="space-y-6">
          <DocumentUploader v-model="documents"/>
          <label class="consent-box"><input v-model="form.consent_confirmed" type="checkbox" required/><span><strong>Borrower consent recorded</strong><small>I confirm that the borrower was informed why identity, financial and contact data is collected and consented to its use for credit assessment and loan servicing.</small></span></label>
          <label><span class="label">Internal notes</span><textarea v-model.trim="form.notes" class="field min-h-24 py-3"/></label>
        </div>
        <footer class="form-actions"><button v-if="step" type="button" class="btn-secondary" @click="previous">Back</button><span class="flex-1"/><button class="btn-primary" :disabled="saving"><template v-if="step < steps.length - 1">Continue <PhArrowRight :size="17"/></template><template v-else>{{ saving ? 'Saving application' : 'Save borrower' }} <PhCheck :size="17"/></template></button></footer>
      </form>
    </section>
  </div>
</template>
