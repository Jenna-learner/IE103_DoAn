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
    const status = err.response?.status
    const msg = err.response?.data?.message || 'Lỗi kết nối server.'
    const onLogin = window.location.pathname.startsWith('/login')
    const sentToken = !!err.config?.headers?.Authorization

    // Chỉ tự đăng xuất khi PHIÊN thực sự hỏng:
    //   - 403 kèm thông báo về token (token hết hạn / không hợp lệ), HOẶC
    //   - 401 mà request CÓ gửi token (token bị từ chối).
    // KHÔNG đăng xuất với: 403 do thiếu quyền, hoặc 401 lẻ không kèm token (race
    // giữa các request song song) — tránh làm mất phiên oan và báo lỗi nhầm.
    const sessionInvalid =
      (status === 403 && /token/i.test(msg)) ||
      (status === 401 && sentToken)

    if (sessionInvalid && !onLogin) {
      localStorage.removeItem('fnb_token')
      localStorage.removeItem('fnb_auth')
      window.location.href = '/login'
    }

    return Promise.reject(new Error(msg))
  }
)

export default api
