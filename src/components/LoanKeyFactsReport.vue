<script setup>
import { computed } from 'vue'
import { date, money } from '../utils/formatters'

const props = defineProps({
  loan: { type: Object, required: true },
  borrower: { type: Object, required: true },
  product: { type: Object, default: () => ({}) },
  guarantors: { type: Array, default: () => [] },
  collateral: { type: Array, default: () => [] },
  schedule: { type: Array, default: () => [] },
  company: { type: Object, default: () => ({}) },
  preparedBy: { type: String, default: '' },
  preview: { type: Boolean, default: false },
})

const frequencyLabel = computed(() => ({ daily: 'Daily', weekly: 'Weekly', biweekly: 'Every two weeks', monthly: 'Monthly' }[props.loan.repayment_frequency] || props.loan.repayment_frequency))
const securityLabel = (value) => value?.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) || '—'
const documentCount = (item) => item.documents?.length || item.document_ids?.length || 0
const preparedDate = new Date().toISOString().slice(0, 10)
const companyContact = computed(() => [props.company.settings?.phone, props.company.settings?.email, props.company.settings?.address].filter(Boolean).join(' · '))
</script>

<template>
  <article class="key-facts-report">
    <header class="report-header">
      <div><p class="eyebrow">{{ preview ? 'Loan review · not yet activated' : 'Active loan agreement' }}</p><h1>{{ company.name || 'Kopa Lending Company' }}</h1><p>Key Facts statement and repayment agreement</p><p v-if="companyContact">{{ companyContact }}</p><p v-if="company.umra_license_number">UMRA licence: {{ company.umra_license_number }}</p></div>
      <div class="report-reference"><small>{{ preview ? 'Preview' : 'Loan number' }}</small><strong>{{ preview ? 'Pending activation' : loan.loan_number }}</strong><span>Prepared {{ date(preparedDate) }}</span></div>
    </header>

    <section class="report-section">
      <h2>Borrower</h2>
      <dl class="report-grid"><div><dt>Full name</dt><dd>{{ borrower.full_name }}</dd></div><div><dt>Phone</dt><dd>{{ borrower.phone_number }}</dd></div><div><dt>Address</dt><dd>{{ borrower.address || '—' }}</dd></div><div><dt>District</dt><dd>{{ borrower.district || '—' }}</dd></div><div><dt>Occupation</dt><dd>{{ borrower.occupation || '—' }}</dd></div><div><dt>Organization / company</dt><dd>{{ borrower.organization_name || '—' }}</dd></div><div><dt>Average monthly income</dt><dd>{{ money(borrower.average_monthly_income) }}</dd></div><div><dt>Prepared by</dt><dd>{{ preparedBy || '—' }}</dd></div></dl>
    </section>

    <section class="report-section">
      <h2>Loan terms</h2>
      <dl class="report-grid report-grid-financial"><div><dt>Product</dt><dd>{{ product?.name || loan.product?.name || 'Loan product' }}</dd></div><div><dt>Principal</dt><dd>{{ money(loan.principal_amount) }}</dd></div><div><dt>Processing fee</dt><dd>{{ money(loan.fees_amount) }}</dd></div><div><dt>Borrower receives</dt><dd>{{ money(loan.net_disbursement_amount) }}</dd></div><div><dt>Total interest</dt><dd>{{ money(loan.total_interest) }}</dd></div><div class="featured"><dt>Total payable</dt><dd>{{ money(loan.total_payable) }}</dd></div><div><dt>{{ frequencyLabel }} installment</dt><dd>{{ money(loan.installment_amount) }}</dd></div><div><dt>Repayment frequency</dt><dd>{{ frequencyLabel }}</dd></div><div><dt>Interest rate</dt><dd>{{ Number(loan.interest_rate || 0).toFixed(2) }}% per {{ loan.interest_period?.replace('_', ' ') }}</dd></div><div><dt>Duration</dt><dd>{{ loan.duration }} {{ loan.duration_unit }}</dd></div><div><dt>Disbursement / activation</dt><dd>{{ date(loan.disbursement_date) }}</dd></div><div><dt>First repayment</dt><dd>{{ date(loan.first_repayment_date) }}</dd></div><div><dt>Maturity</dt><dd>{{ date(loan.maturity_date) }}</dd></div><div v-if="!preview"><dt>Status</dt><dd class="capitalize">{{ loan.status }}</dd></div><div v-if="!preview"><dt>Paid to date</dt><dd>{{ money(Number(loan.total_payable) - Number(loan.outstanding_amount)) }}</dd></div><div v-if="!preview"><dt>Outstanding</dt><dd>{{ money(loan.outstanding_amount) }}</dd></div></dl>
      <div class="report-narrative"><div><strong>Loan purpose</strong><p>{{ loan.purpose }}</p></div><div><strong>Expected source of repayments</strong><p>{{ loan.source_of_repayment }}</p></div></div>
    </section>

    <section class="report-section">
      <h2>Repayment schedule</h2>
      <div class="overflow-x-auto"><table class="report-table"><thead><tr><th>No.</th><th>Due date</th><th>Amount due</th><th v-if="!preview">Amount paid</th><th v-if="!preview">Status</th></tr></thead><tbody><tr v-for="item in schedule" :key="item.id || item.installment_number"><td>{{ item.installment_number }}</td><td>{{ date(item.due_date) }}</td><td>{{ money(item.amount_due) }}</td><td v-if="!preview">{{ money(item.amount_paid) }}</td><td v-if="!preview" class="capitalize">{{ item.status?.replace('_', ' ') }}</td></tr></tbody></table></div>
    </section>

    <section class="report-section" v-if="guarantors.length">
      <h2>Guarantors</h2>
      <div class="report-records"><article v-for="(guarantor, index) in guarantors" :key="guarantor.id || index"><strong>Guarantor {{ index + 1 }} · {{ guarantor.name }}</strong><dl><div><dt>Phone</dt><dd>{{ guarantor.phone }}</dd></div><div><dt>Relationship</dt><dd>{{ guarantor.relationship || '—' }}</dd></div><div><dt>Address</dt><dd>{{ guarantor.address || '—' }}</dd></div><div><dt>Evidence</dt><dd>{{ documentCount(guarantor) }} file(s) attached</dd></div></dl></article></div>
    </section>

    <section class="report-section" v-if="collateral.length">
      <h2>Collateral / security</h2>
      <div class="report-records"><article v-for="(item, index) in collateral" :key="item.id || index"><strong>Security {{ index + 1 }} · {{ securityLabel(item.security_type) }}</strong><dl><div><dt>Owner</dt><dd>{{ item.owner || '—' }}</dd></div><div><dt>Estimated value</dt><dd>{{ money(item.estimated_value) }}</dd></div><div><dt>Location</dt><dd>{{ item.location || '—' }}</dd></div><div><dt>Evidence</dt><dd>{{ documentCount(item) }} file(s) attached</dd></div><div v-if="item.description" class="wide"><dt>Description</dt><dd>{{ item.description }}</dd></div></dl></article></div>
    </section>

    <section class="report-acknowledgement"><h2>Acknowledgement</h2><p>The borrower and guarantor(s) confirm that the loan terms, fees, repayment dates, obligations, and consequences of missed payments were explained clearly before activation.</p><div class="signature-grid"><div><span>Borrower signature</span></div><div v-for="(guarantor, index) in guarantors" :key="`signature-${guarantor.id || index}`"><span>{{ guarantor.name }} · guarantor</span></div><div><span>{{ preparedBy || 'Operator' }} · prepared by</span></div><div><span>Date</span></div></div></section>
  </article>
</template>
