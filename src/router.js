import { createRouter, createWebHistory } from 'vue-router'
import AppShell from './layouts/AppShell.vue'
import LoginView from './views/LoginView.vue'
import RegisterView from './views/RegisterView.vue'
import DashboardView from './views/DashboardView.vue'
import BorrowersView from './views/BorrowersView.vue'
import BorrowerView from './views/BorrowerView.vue'
import BorrowerFormView from './views/BorrowerFormView.vue'
import LoansView from './views/LoansView.vue'
import CreateLoanView from './views/CreateLoanView.vue'
import CollectionsView from './views/CollectionsView.vue'
import ReportsView from './views/ReportsView.vue'
import TeamView from './views/TeamView.vue'
import SettingsView from './views/SettingsView.vue'
import LoanView from './views/LoanView.vue'
import ReceiptView from './views/ReceiptView.vue'

const routes = [
  { path: '/login', name: 'login', component: LoginView, meta: { guest: true } },
  { path: '/register', name: 'register', component: RegisterView, meta: { guest: true } },
  {
    path: '/', component: AppShell,
    children: [
      { path: '', name: 'dashboard', component: DashboardView, meta: { title: 'Dashboard', navSection: 'dashboard' } },
      { path: 'borrowers', name: 'borrowers', component: BorrowersView, meta: { title: 'Borrowers', navSection: 'borrowers' } },
      { path: 'borrowers/new', name: 'create-borrower', component: BorrowerFormView, meta: { title: 'New borrower', navSection: 'borrowers' } },
      { path: 'borrowers/:id/edit', name: 'edit-borrower', component: BorrowerFormView, meta: { title: 'Edit borrower', navSection: 'borrowers' } },
      { path: 'borrowers/:id', name: 'borrower', component: BorrowerView, meta: { title: 'Borrower profile', navSection: 'borrowers' } },
      { path: 'loans', name: 'loans', component: LoansView, meta: { title: 'Loans', navSection: 'loans' } },
      { path: 'loans/new', name: 'create-loan', component: CreateLoanView, meta: { title: 'New loan', navSection: 'loans' } },
      { path: 'loans/:id', name: 'loan', component: LoanView, meta: { title: 'Loan account', navSection: 'loans' } },
      { path: 'receipts/:id', name: 'receipt', component: ReceiptView, meta: { title: 'Payment receipt', navSection: 'collections' } },
      { path: 'collections', name: 'collections', component: CollectionsView, meta: { title: 'Collections', navSection: 'collections' } },
      { path: 'reports', name: 'reports', component: ReportsView, meta: { title: 'Reports', navSection: 'reports' } },
      { path: 'staff', name: 'staff', component: TeamView, meta: { title: 'Staff & branches', navSection: 'staff' } },
      { path: 'settings', name: 'settings', component: SettingsView, meta: { title: 'Settings', navSection: 'settings' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({ history: createWebHistory(), routes, scrollBehavior: () => ({ top: 0 }) })
router.beforeEach((to) => {
  const signedIn = Boolean(localStorage.getItem('kopa_token'))
  if (!to.meta.guest && !signedIn) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.guest && signedIn) return { name: 'dashboard' }
})

window.addEventListener('kopa:unauthorized', () => router.push({ name: 'login' }))
export default router
