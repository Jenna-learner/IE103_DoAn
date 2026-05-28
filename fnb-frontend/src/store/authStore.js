/**
 * Zustand Auth Store
 * Lưu: token JWT, thông tin user (maNV, hoTen, vaiTro, maCN, tenCN)
 * Persist vào localStorage để giữ đăng nhập sau khi reload trang
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../lib/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,       // { maTK, maNV, hoTen, vaiTro, maCN, tenCN, tenDangNhap }
      isLoading: false,

      // ── Đăng nhập ───────────────────────────────────────
      login: async (tenDangNhap, matKhau) => {
        set({ isLoading: true })
        try {
          const res = await api.post('/auth/login', { tenDangNhap, matKhau })
          const { token, user } = res.data
          localStorage.setItem('fnb_token', token)
          set({ token, user, isLoading: false })
          return { ok: true, user }
        } catch (err) {
          set({ isLoading: false })
          return { ok: false, message: err.message }
        }
      },

      // ── Đăng xuất ───────────────────────────────────────
      logout: () => {
        localStorage.removeItem('fnb_token')
        localStorage.removeItem('fnb_user')
        set({ token: null, user: null })
      },

      // ── Kiểm tra quyền ──────────────────────────────────
      hasRole: (...roles) => {
        const { user } = get()
        return user ? roles.includes(user.vaiTro) : false
      },

      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'fnb_auth',           // Key trong localStorage
      partialize: (s) => ({       // Chỉ persist token + user
        token: s.token,
        user:  s.user,
      }),
    }
  )
)

export { useAuthStore }
export default useAuthStore
