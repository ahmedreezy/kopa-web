<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  PhAddressBook as AddressBook, PhBank as Bank, PhChartBar as ChartBar, PhGear as Gear,
  PhHouse as House, PhList as List, PhMagnifyingGlass as MagnifyingGlass,
  PhMoney as Money, PhReceipt as Receipt, PhSidebarSimple as SidebarSimple,
  PhUsers as Users, PhX as X,
} from '@phosphor-icons/vue'

const route = useRoute()
const drawerOpen = ref(false)
const collapsed = ref(false)
const search = ref('')
const nav = [
  { label: 'Dashboard', to: '/', icon: House },
  { label: 'Borrowers', to: '/borrowers', icon: AddressBook },
  { label: 'Loans', to: '/loans', icon: Bank },
  { label: 'Collections', to: '/collections', icon: Money },
  { label: 'Reports', to: '/reports', icon: ChartBar },
  { label: 'Staff', to: '/staff', icon: Users },
  { label: 'Settings', to: '/settings', icon: Gear },
]
const title = computed(() => route.meta.title || 'Kopa')
</script>

<template>
  <div class="min-h-[100dvh] bg-[#f4f7f5] text-stone-900">
    <div v-if="drawerOpen" class="fixed inset-0 z-20 bg-stone-950/35 lg:hidden" @click="drawerOpen = false" />
    <aside
      class="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-emerald-950/10 bg-[#143b31] text-white transition-[width,transform] duration-200"
      :class="[collapsed ? 'lg:w-20' : 'lg:w-64', drawerOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full lg:translate-x-0']"
    >
      <div class="flex h-20 items-center gap-3 border-b border-white/10 px-5">
        <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#d9f75f] font-black text-[#143b31]">K</div>
        <div v-if="!collapsed" class="min-w-0">
          <p class="truncate text-base font-bold">Kiboga Capital</p>
          <p class="truncate text-xs text-emerald-100/70">Head Office</p>
        </div>
        <button class="ml-auto lg:hidden" aria-label="Close navigation" @click="drawerOpen = false"><X :size="22" /></button>
      </div>

      <nav class="flex-1 space-y-1 p-3" aria-label="Main navigation">
        <RouterLink v-for="item in nav" :key="item.to" :to="item.to" class="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-emerald-50/75 transition hover:bg-white/8 hover:text-white" active-class="!bg-[#d9f75f] !text-[#143b31]" @click="drawerOpen = false">
          <component :is="item.icon" :size="21" weight="duotone" class="shrink-0" />
          <span v-if="!collapsed || drawerOpen">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="border-t border-white/10 p-3">
        <button class="hidden min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-emerald-50/70 hover:bg-white/8 lg:flex" @click="collapsed = !collapsed">
          <SidebarSimple :size="21" /><span v-if="!collapsed">Collapse sidebar</span>
        </button>
        <div class="mt-2 flex items-center gap-3 rounded-xl bg-white/8 p-3">
          <div class="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-900">AK</div>
          <div v-if="!collapsed || drawerOpen" class="min-w-0"><p class="truncate text-sm font-semibold">Ahmed Kato</p><p class="text-xs text-emerald-100/60">Owner</p></div>
        </div>
      </div>
    </aside>

    <div class="transition-[padding] duration-200" :class="collapsed ? 'lg:pl-20' : 'lg:pl-64'">
      <header class="sticky top-0 z-10 flex h-20 items-center gap-3 border-b border-stone-200/80 bg-[#f4f7f5]/95 px-4 backdrop-blur sm:px-6 lg:px-8">
        <button class="grid size-11 place-items-center rounded-xl border border-stone-300 bg-white lg:hidden" aria-label="Open navigation" @click="drawerOpen = true"><List :size="22" /></button>
        <div class="relative max-w-xl flex-1">
          <MagnifyingGlass :size="20" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input v-model="search" class="field pl-11" placeholder="Search borrower, phone or loan number..." aria-label="Global search" />
        </div>
        <RouterLink to="/loans/new" class="btn-primary hidden sm:inline-flex"><Receipt :size="19" />New loan</RouterLink>
      </header>
      <main class="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
        <div class="mb-6 flex items-center justify-between"><h1 class="page-title">{{ title }}</h1></div>
        <RouterView />
      </main>
    </div>
  </div>
</template>
