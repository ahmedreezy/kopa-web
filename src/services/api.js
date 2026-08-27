import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kopa_token')
  const tenant = localStorage.getItem('kopa_tenant') || 'demo-loans'
  if (token) config.headers.Authorization = `Bearer ${token}`
  config.headers['X-Tenant'] = tenant
  return config
})
export default api
