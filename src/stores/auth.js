import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('kopa_user') || 'null'))
  const tenant = ref(JSON.parse(localStorage.getItem('kopa_company') || 'null'))
  const authenticated = computed(() => Boolean(localStorage.getItem('kopa_token')))

  function remember(payload) {
    localStorage.setItem('kopa_token', payload.token)
    localStorage.setItem('kopa_tenant', payload.tenant.slug)
    localStorage.setItem('kopa_user', JSON.stringify(payload.user))
    localStorage.setItem('kopa_company', JSON.stringify(payload.tenant))
    user.value = payload.user
    tenant.value = payload.tenant
  }

  async function signIn(credentials) {
    const { data } = await api.post('/auth/login', credentials)
    remember(data)
  }

  async function register(details) {
    const { data } = await api.post('/auth/register-company', details)
    remember(data)
  }

  async function refreshUser() {
    if (!authenticated.value) return
    const { data } = await api.get('/auth/me')
    user.value = data.user
    localStorage.setItem('kopa_user', JSON.stringify(data.user))
  }

  function clear() {
    for (const key of ['kopa_token', 'kopa_tenant', 'kopa_user', 'kopa_company']) localStorage.removeItem(key)
    user.value = null
    tenant.value = null
  }

  async function signOut() {
    try { await api.post('/auth/logout') } finally { clear() }
  }

  return { user, tenant, authenticated, signIn, register, refreshUser, signOut, clear }
})
