<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'
import {
  PhAddressBook, PhBank, PhBell, PhCaretDown, PhChartBar, PhGear, PhHouse,
  PhList, PhMagnifyingGlass, PhMoney, PhPlus, PhSignOut, PhUsers, PhX,
} from '@phosphor-icons/vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const drawerOpen = ref(false)
const accountOpen = ref(false)
const search = ref('')
const searching = ref(false)
const results = ref(null)
let searchTimer

const nav = [
  { label: 'Dashboard', to: '/', icon: PhHouse },
  { label: 'Borrowers', to: '/borrowers', icon: PhAddressBook },
  { label: 'Loans', to: '/loans', icon: PhBank },
  { label: 'Collections', to: '/collections', icon: PhMoney },
  { label: 'Reports', to: '/reports', icon: PhChartBar },
  { label: 'Staff & branches', to: '/staff', icon: PhUsers },
  { label: 'Settings', to: '/settings', icon: PhGear },
]
const title = computed(() => route.meta.title || 'Kopa')
const initials = computed(() => (auth.user?.name || 'K').split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase())

watch(search, (value) => {
  clearTimeout(searchTimer)
  if (value.trim().length < 2) { results.value = null; return }
  searchTimer = setTimeout(async () => {
    searching.value = true
    try { results.value = (await api.get(`/search/${encodeURIComponent(value.trim())}`)).data }
    finally { searching.value = false }
  }, 250)
})

function chooseResult(path) {
  search.value = ''
  results.value = null
  router.push(path)
}

async function logout() {
  accountOpen.value = false
  await auth.signOut()
  router.push('/login')
}

onMounted(() => auth.refreshUser().catch(() => {}))
</script>

<template>
  <a href="#main-content" class="skip-link">Skip to content</a>
  <div class="app-frame">
    <div v-if="drawerOpen" class="sidebar-backdrop" @click="drawerOpen = false" />
    <aside class="sidebar" :class="drawerOpen ? 'sidebar-open' : ''">
      <div class="brand-bar">
        <div class="brand-mark">K</div>
        <div class="min-w-0">
          <p class="brand-name">Kopa</p>
          <p class="brand-company">{{ auth.tenant?.name || 'Loan management' }}</p>
        </div>
        <button class="icon-button ml-auto lg:hidden" aria-label="Close menu" @click="drawerOpen = false"><PhX :size="19" /></button>
      </div>
      <nav class="sidebar-nav" aria-label="Main navigation">
        <p class="nav-label">Workspace</p>
        <RouterLink v-for="item in nav" :key="item.to" :to="item.to" class="nav-link" @click="drawerOpen = false">
          <component :is="item.icon" :size="18" /><span>{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <div class="branch-block"><span class="status-dot" />Head Office</div>
        <p>Kopa Loan Management</p>
      </div>
    </aside>

    <div class="content-frame">
      <header class="topbar">
        <button class="icon-button lg:hidden" aria-label="Open menu" @click="drawerOpen = true"><PhList :size="21" /></button>
        <div class="global-search">
          <PhMagnifyingGlass :size="18" />
          <input v-model="search" placeholder="Search borrower, phone or loan number" aria-label="Search records" @keydown.escape="search = ''" />
          <span v-if="searching" class="search-state">Searching</span>
          <div v-if="results" class="search-results">
            <button v-for="person in results.borrowers" :key="person.id" @click="chooseResult(`/borrowers/${person.id}`)">
              <span><strong>{{ person.full_name }}</strong><small>{{ person.phone_number }}</small></span><span>Borrower</span>
            </button>
            <button v-for="loan in results.loans" :key="loan.id" @click="chooseResult(`/loans/${loan.id}`)">
              <span><strong>{{ loan.loan_number }}</strong><small>{{ loan.borrower?.full_name }}</small></span><span>Loan</span>
            </button>
            <p v-if="!results.borrowers?.length && !results.loans?.length" class="search-empty">No matching records</p>
          </div>
        </div>
        <RouterLink to="/loans/new" class="btn-primary hidden sm:inline-flex"><PhPlus :size="17" />New loan</RouterLink>
        <button class="icon-button hidden sm:grid" aria-label="Notifications"><PhBell :size="19" /></button>
        <div class="account-menu">
          <button class="account-trigger" @click="accountOpen = !accountOpen">
            <span class="avatar">{{ initials }}</span>
            <span class="hidden text-left md:block"><strong>{{ auth.user?.name }}</strong><small>{{ auth.user?.role?.replace('_', ' ') }}</small></span>
            <PhCaretDown :size="14" />
          </button>
          <div v-if="accountOpen" class="account-popover">
            <div><strong>{{ auth.user?.name }}</strong><small>{{ auth.user?.email }}</small></div>
            <RouterLink to="/settings" @click="accountOpen = false"><PhGear :size="17" />Settings</RouterLink>
            <button @click="logout"><PhSignOut :size="17" />Sign out</button>
          </div>
        </div>
      </header>
      <main id="main-content" class="main-content" tabindex="-1">
        <div class="page-heading"><div><p class="breadcrumb">{{ auth.tenant?.name || 'Kopa' }}</p><h1 class="page-title">{{ title }}</h1></div></div>
        <RouterView />
      </main>
    </div>
  </div>
</template>
