import { createRouter, createWebHistory } from 'vue-router'
import AppShell from './layouts/AppShell.vue'
import LoginView from './views/LoginView.vue'
import RegisterView from './views/RegisterView.vue'
import DashboardView from './views/DashboardView.vue'
import BorrowersView from './views/BorrowersView.vue'
import BorrowerView from './views/BorrowerView.vue'
import LoansView from './views/LoansView.vue'
import CreateLoanView from './views/CreateLoanView.vue'
import CollectionsView from './views/CollectionsView.vue'
import ReportsView from './views/ReportsView.vue'
import TeamView from './views/TeamView.vue'
import SettingsView from './views/SettingsView.vue'
import PlatformView from './views/PlatformView.vue'

const routes = [
  { path: '/login', component: LoginView },
  { path: '/register', component: RegisterView },
  {
    path: '/', component: AppShell,
    children: [
      { path: '', name: 'dashboard', component: DashboardView, meta: { title: 'Dashboard' } },
      { path: 'borrowers', name: 'borrowers', component: BorrowersView, meta: { title: 'Borrowers' } },
      { path: 'borrowers/:id', name: 'borrower', component: BorrowerView, meta: { title: 'Borrower profile' } },
      { path: 'loans', name: 'loans', component: LoansView, meta: { title: 'Loans' } },
      { path: 'loans/new', name: 'create-loan', component: CreateLoanView, meta: { title: 'New loan' } },
      { path: 'collections', name: 'collections', component: CollectionsView, meta: { title: 'Collections' } },
      { path: 'reports', name: 'reports', component: ReportsView, meta: { title: 'Reports' } },
      { path: 'staff', name: 'staff', component: TeamView, meta: { title: 'Staff & branches' } },
      { path: 'settings', name: 'settings', component: SettingsView, meta: { title: 'Settings' } },
      { path: 'platform', name: 'platform', component: PlatformView, meta: { title: 'Platform admin' } },
    ],
  },
]

export default createRouter({ history: createWebHistory(), routes })
