/**
 * Sidebar — Navigation phân quyền theo vaiTro
 *
 * Hiển thị menu khác nhau:
 *   role_admin              → Tất cả module
 *   role_readonly   → Dashboard, Kho, Phiếu nhập, Phân công, Phiếu chi, Báo cáo
 *   role_cashier           → POS, Lịch sử HĐ, Khách hàng
 *   kho                → Tồn kho, Nhật ký, Phiếu nhập
 */
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, FileText, Users, Package,
  ClipboardList, Truck, CalendarDays, Receipt, BarChart2,
  Building2, Coffee, UserCog, ChevronRight, ScanLine,
} from 'lucide-react'
import clsx from 'clsx'
import useAuthStore from '../store/authStore'

// ── Định nghĩa menu theo vai trò ──────────────────────────
const MENU = {
  role_admin: [
    { group: 'Tổng quan',   items: [{ to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' }] },
    { group: 'Bán hàng',    items: [
        { to: '/pos',                icon: ShoppingCart,  label: 'POS Bán hàng' },
        { to: '/hoa-don',            icon: FileText,      label: 'Lịch sử Hóa đơn' },
        { to: '/khach-hang',         icon: Users,         label: 'Khách hàng CRM' },
    ]},
    { group: 'Kho & Nhập',  items: [
        { to: '/kho/ton-kho',        icon: Package,       label: 'Tồn kho' },
        { to: '/kho/nhat-ky',        icon: ClipboardList, label: 'Nhật ký kho' },
        { to: '/kho/kiem-kho',       icon: ScanLine,      label: 'Kiểm kho' },
        { to: '/phieu-nhap',         icon: Truck,         label: 'Phiếu nhập hàng' },
    ]},
    { group: 'Nhân sự',     items: [
        { to: '/phan-cong',          icon: CalendarDays,  label: 'Phân công ca' },
        { to: '/phieu-chi',          icon: Receipt,       label: 'Phiếu chi' },
        { to: '/nhan-vien',          icon: UserCog,       label: 'Nhân viên' },
    ]},
    { group: 'Hệ thống',    items: [
        { to: '/bao-cao',            icon: BarChart2,     label: 'Báo cáo' },
        { to: '/san-pham',           icon: Coffee,        label: 'Sản phẩm' },
        { to: '/chi-nhanh',          icon: Building2,     label: 'Chi nhánh' },
    ]},
  ],
  role_readonly: [
    { group: 'Tổng quan',   items: [{ to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' }] },
    { group: 'Kho & Nhập',  items: [
        { to: '/kho/ton-kho',        icon: Package,       label: 'Tồn kho' },
        { to: '/kho/nhat-ky',        icon: ClipboardList, label: 'Nhật ký kho' },
        { to: '/kho/kiem-kho',       icon: ScanLine,      label: 'Kiểm kho' },
        { to: '/phieu-nhap',         icon: Truck,         label: 'Phiếu nhập hàng' },
    ]},
    { group: 'Vận hành',    items: [
        { to: '/phieu-chi',          icon: Receipt,       label: 'Phiếu chi' },
        { to: '/hoa-don',            icon: FileText,      label: 'Lịch sử Hóa đơn' },
    ]},
    { group: 'Báo cáo',     items: [
        { to: '/bao-cao',            icon: BarChart2,     label: 'Báo cáo' },
    ]},
  ],
  role_cashier: [
    { group: 'Bán hàng',    items: [
        { to: '/pos',                icon: ShoppingCart,  label: 'POS Bán hàng' },
        { to: '/hoa-don',            icon: FileText,      label: 'Lịch sử Hóa đơn' },
        { to: '/khach-hang',         icon: Users,         label: 'Khách hàng CRM' },
    ]},
  ],
  role_warehouse_staff: [
    { group: 'Kho vận',     items: [
        { to: '/kho/ton-kho',        icon: Package,       label: 'Tồn kho' },
        { to: '/kho/nhat-ky',        icon: ClipboardList, label: 'Nhật ký kho' },
        { to: '/kho/kiem-kho',       icon: ScanLine,      label: 'Kiểm kho' },
        { to: '/phieu-nhap',         icon: Truck,         label: 'Phiếu nhập hàng' },
    ]},
  ],
}

// Badge nhãn vai trò
const ROLE_BADGE = {
  role_admin:             { label: 'Admin',        cls: 'bg-purple-500/20 text-purple-300' },
  role_readonly:        { label: 'Giám sát',       cls: 'bg-blue-500/20 text-blue-300' },
  role_cashier:          { label: 'Thu ngân',       cls: 'bg-brand-500/20 text-brand-300' },
  role_warehouse_staff:  { label: 'Kho vận',        cls: 'bg-green-500/20 text-green-300' },
}

export default function Sidebar({ collapsed }) {
  const user   = useAuthStore((s) => s.user)
  const groups = MENU[user?.vaiTro] || []
  const badge  = ROLE_BADGE[user?.vaiTro] || { label: user?.vaiTro, cls: 'bg-gray-500/20 text-gray-300' }

  return (
    <aside
      className={clsx(
        'h-screen bg-sidebar flex flex-col transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center shrink-0">
          <Coffee size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm truncate">FnB Chain</p>
            <p className="text-gray-500 text-xs truncate">Management System</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {groups.map((group) => (
          <div key={group.group} className="mb-1">
            {/* Group label */}
            {!collapsed && (
              <p className="text-gray-600 text-[10px] font-semibold uppercase tracking-widest px-3 py-2">
                {group.group}
              </p>
            )}

            {group.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 group',
                    isActive
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  )
                }
                title={collapsed ? label : undefined}
              >
                <Icon size={17} className="shrink-0" />
                {!collapsed && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User info */}
      {!collapsed && user && (
        <div className="border-t border-white/5 px-3 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0">
              <span className="text-brand-400 text-xs font-bold">
                {user.hoTen?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-white text-xs font-medium truncate">{user.hoTen}</p>
              <span className={clsx('text-[10px] px-1.5 py-0.5 rounded font-medium', badge.cls)}>
                {badge.label}
              </span>
            </div>
          </div>
          {user.tenCN && (
            <p className="text-gray-600 text-[10px] mt-2 px-0.5 truncate">
              📍 {user.tenCN}
            </p>
          )}
        </div>
      )}
    </aside>
  )
}
