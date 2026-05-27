/**
 * AppLayout — Layout chính của toàn bộ ứng dụng (sau khi đăng nhập)
 * Cấu trúc: Sidebar (trái) + [Topbar + Nội dung trang] (phải)
 */
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Topbar  from '../components/Topbar'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} />

      {/* Vùng nội dung phải */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onToggleSidebar={() => setCollapsed((v) => !v)} />

        {/* Nội dung trang — scroll độc lập */}
        <main className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
