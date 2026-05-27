/**
 * ComingSoon — Trang placeholder cho các module chưa viết
 */
import { Hammer } from 'lucide-react'
import { useLocation } from 'react-router-dom'

const LABELS = {
  '/pos':           'POS Bán hàng',
  '/hoa-don':       'Lịch sử Hóa đơn',
  '/khach-hang':    'Khách hàng CRM',
  '/kho/ton-kho':   'Quản lý Tồn kho',
  '/kho/nhat-ky':   'Nhật ký Biến động Kho',
  '/phieu-nhap':    'Phiếu Nhập hàng',
  '/phan-cong':     'Phân công Ca làm việc',
  '/phieu-chi':     'Phiếu Chi vận hành',
  '/bao-cao':       'Báo cáo & Thống kê',
  '/san-pham':      'Quản lý Sản phẩm',
  '/chi-nhanh':     'Chi nhánh & Bộ phận',
  '/nhan-vien':     'Quản lý Nhân viên',
}

export default function ComingSoon() {
  const { pathname } = useLocation()
  const name = LABELS[pathname] || pathname

  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-5">
        <Hammer size={28} className="text-brand-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-800 mb-1">{name}</h2>
      <p className="text-gray-400 text-sm max-w-xs">
        Trang này đang được xây dựng. Sẽ hoàn thiện trong các bước tiếp theo.
      </p>
      <div className="mt-6 px-4 py-2 bg-brand-50 border border-brand-100 rounded-lg">
        <code className="text-brand-600 text-xs">{pathname}</code>
      </div>
    </div>
  )
}
