import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kopa_token')
  const tenant = localStorage.getItem('kopa_tenant')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (tenant) config.headers['X-Tenant'] = tenant
  return config
})
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('kopa_token')) {
      for (const key of ['kopa_token', 'kopa_tenant', 'kopa_user', 'kopa_company']) localStorage.removeItem(key)
      window.dispatchEvent(new Event('kopa:unauthorized'))
    }
    return Promise.reject(error)
  },
)
export default api
