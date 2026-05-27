/**
 * Axios instance — kết nối đến Express Backend (localhost:5000)
 * JWT token tự động được đính kèm qua interceptor
 */
import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',   // Vite proxy → http://localhost:5000/api/v1
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// ── REQUEST: tự gắn JWT token vào header ──────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fnb_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── RESPONSE: xử lý lỗi tập trung ────────────────────────
api.interceptors.response.use(
  (res) => res.data,   // Trả thẳng data, không cần .data mỗi lần gọi
  (err) => {
    const msg = err.response?.data?.message || 'Lỗi kết nối server.'

    // Token hết hạn → tự logout
    if (err.response?.status === 401 || err.response?.status === 403) {
      localStorage.removeItem('fnb_token')
      localStorage.removeItem('fnb_user')
      window.location.href = '/login'
    }

    return Promise.reject(new Error(msg))
  }
)

export default api
