/**
 * Sidebar — Navigation phân quyền theo vaiTro
 *
 * Hiển thị menu khác nhau:
 *   role_admin            → Toàn bộ hệ thống
 *   role_ops_director     → Dashboard chuỗi, báo cáo vận hành, tài chính
 *   role_branch_manager   → Dashboard + vận hành chi nhánh
 *   role_cashier          → Dashboard bán hàng + POS
 *   role_warehouse_staff  → Dashboard kho + nhập hàng
 */
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, ShoppingCart, FileText, Users, Package,
  ClipboardList, Truck, CalendarDays, Receipt,
  Building2, Coffee, UserCog, ScanLine, Factory,
} from 'lucide-react'
import clsx from 'clsx'
import useAuthStore from '../store/authStore'
import logoImg from '../assets/logo.png'
import { ROLE, ROLE_LABEL, normalizeRole } from '../lib/roles'

// ── Định nghĩa menu theo vai trò ──────────────────────────
const MENU = {
  [ROLE.ADMIN]: [
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
        { to: '/nhan-vien',          icon: UserCog,       label: 'Nhân viên & tài khoản' },
    ]},
    { group: 'Hệ thống',    items: [
        { to: '/san-pham',           icon: Coffee,        label: 'Sản phẩm' },
        { to: '/nha-cung-cap',       icon: Factory,       label: 'Nhà cung cấp' },
        { to: '/chi-nhanh',          icon: Building2,     label: 'Chi nhánh' },
    ]},
  ],
  [ROLE.OPS_DIRECTOR]: [
    { group: 'Tổng quan',   items: [{ to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' }] },
    { group: 'Vận hành chuỗi', items: [
        { to: '/hoa-don',            icon: FileText,      label: 'Lịch sử Hóa đơn' },
        { to: '/kho/ton-kho',        icon: Package,       label: 'Tồn kho' },
        { to: '/kho/nhat-ky',        icon: ClipboardList, label: 'Nhật ký kho' },
        { to: '/phieu-nhap',         icon: Truck,         label: 'Phiếu nhập hàng' },
        { to: '/phan-cong',          icon: CalendarDays,  label: 'Phân công ca' },
        { to: '/phieu-chi',          icon: Receipt,       label: 'Phiếu chi' },
    ]},
  ],
  [ROLE.BRANCH_MANAGER]: [
    { group: 'Tổng quan',   items: [{ to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' }] },
    { group: 'Bán hàng',    items: [
        { to: '/pos',                icon: ShoppingCart,  label: 'POS Bán hàng' },
        { to: '/hoa-don',            icon: FileText,      label: 'Lịch sử Hóa đơn' },
        { to: '/khach-hang',         icon: Users,         label: 'Khách hàng CRM' },
    ]},
    { group: 'Kho & vận hành', items: [
        { to: '/kho/ton-kho',        icon: Package,       label: 'Tồn kho' },
        { to: '/kho/nhat-ky',        icon: ClipboardList, label: 'Nhật ký kho' },
        { to: '/kho/kiem-kho',       icon: ScanLine,      label: 'Kiểm kho' },
        { to: '/phieu-nhap',         icon: Truck,         label: 'Phiếu nhập hàng' },
        { to: '/phieu-chi',          icon: Receipt,       label: 'Phiếu chi' },
    ]},
    { group: 'Nhân sự',     items: [
        { to: '/phan-cong',          icon: CalendarDays,  label: 'Phân công ca' },
        { to: '/nhan-vien',          icon: UserCog,       label: 'Nhân viên & tài khoản' },
    ]},
    { group: 'Danh mục',    items: [
        { to: '/san-pham',           icon: Coffee,        label: 'Sản phẩm' },
        { to: '/nha-cung-cap',       icon: Factory,       label: 'Nhà cung cấp' },
    ]},
  ],
  [ROLE.CASHIER]: [
    { group: 'Tổng quan',   items: [{ to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' }] },
    { group: 'Bán hàng',    items: [
        { to: '/pos',                icon: ShoppingCart,  label: 'POS Bán hàng' },
        { to: '/hoa-don',            icon: FileText,      label: 'Lịch sử Hóa đơn' },
        { to: '/khach-hang',         icon: Users,         label: 'Khách hàng CRM' },
        { to: '/phieu-chi',          icon: Receipt,       label: 'Phiếu chi' },
    ]},
    { group: 'Tham khảo kho', items: [
        { to: '/kho/ton-kho',        icon: Package,       label: 'Tồn kho' },
        { to: '/phan-cong',          icon: CalendarDays,  label: 'Phân công ca' },
    ]},
  ],
  [ROLE.WAREHOUSE]: [
    { group: 'Tổng quan',   items: [{ to: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard' }] },
    { group: 'Kho vận',     items: [
        { to: '/kho/ton-kho',        icon: Package,       label: 'Tồn kho' },
        { to: '/kho/nhat-ky',        icon: ClipboardList, label: 'Nhật ký kho' },
        { to: '/kho/kiem-kho',       icon: ScanLine,      label: 'Kiểm kho' },
        { to: '/phieu-nhap',         icon: Truck,         label: 'Phiếu nhập hàng' },
        { to: '/phieu-chi',          icon: Receipt,       label: 'Phiếu chi' },
        { to: '/phan-cong',          icon: CalendarDays,  label: 'Phân công ca' },
        { to: '/nha-cung-cap',       icon: Factory,       label: 'Nhà cung cấp' },
    ]},
  ],
}

// Badge nhãn vai trò
const ROLE_BADGE = {
  [ROLE.ADMIN]: { label: ROLE_LABEL[ROLE.ADMIN], cls: 'bg-purple-500/20 text-purple-300' },
  [ROLE.OPS_DIRECTOR]: { label: ROLE_LABEL[ROLE.OPS_DIRECTOR], cls: 'bg-sky-500/20 text-sky-300' },
  [ROLE.BRANCH_MANAGER]: { label: ROLE_LABEL[ROLE.BRANCH_MANAGER], cls: 'bg-blue-500/20 text-blue-300' },
  [ROLE.CASHIER]: { label: ROLE_LABEL[ROLE.CASHIER], cls: 'bg-brand-500/20 text-brand-300' },
  [ROLE.WAREHOUSE]: { label: ROLE_LABEL[ROLE.WAREHOUSE], cls: 'bg-green-500/20 text-green-300' },
}

export default function Sidebar({ collapsed }) {
  const user   = useAuthStore((s) => s.user)
  const role   = normalizeRole(user?.vaiTro)
  const groups = MENU[role] || []
  const badge  = ROLE_BADGE[role] || { label: role, cls: 'bg-gray-500/20 text-gray-300' }

  return (
    <aside
      className={clsx(
        'h-screen bg-sidebar flex flex-col transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <img src={logoImg} alt="FnB Chain logo" className="w-9 h-9 rounded-xl object-cover shrink-0" />
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
