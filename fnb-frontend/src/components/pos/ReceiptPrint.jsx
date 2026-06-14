/**
 * ReceiptPrint.jsx — Hóa đơn bán hàng kiểu phiếu in nhiệt (khổ 80mm)
 *
 * Hiển thị overlay sau khi thanh toán thành công ở POS, cho thu ngân In ngay.
 * Toàn bộ dữ liệu lấy từ snapshot client (không cần gọi thêm API / không đụng DB).
 *
 * Props:
 *   - order: {
 *       MaHD, NgayLap (Date|iso), TenCN, TenNhanVien,
 *       customer: { TenKH, SDT, HangThanhVien } | null,
 *       items: [{ TenSP, SoLuong, GiaBan, ThanhTien }],
 *       TongTienHang, GiamGia, TongThanhToan, PhuongThuc, DiemCong
 *     }
 *   - onClose: fn
 */
import { Printer, X } from 'lucide-react'
import { fmtCurrency } from '../../lib/format'

const PAY_LABEL = {
  Cash: 'Tiền mặt',
  Card: 'Thẻ ngân hàng',
  'E-Wallet': 'Ví điện tử',
  EWallet: 'Ví điện tử',
  BankTransfer: 'Chuyển khoản',
}

function fmtDateTime(value) {
  const d = value instanceof Date ? value : new Date(value)
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ReceiptPrint({ order, onClose }) {
  if (!order) return null

  const {
    MaHD, NgayLap, TenCN, TenNhanVien, customer,
    items = [], TongTienHang = 0, GiamGia = 0, TongThanhToan = 0,
    PhuongThuc, DiemCong = 0,
  } = order

  return (
    <div className="receipt-overlay" role="dialog" aria-modal="true">
      {/* Thanh công cụ — KHÔNG in */}
      <div className="receipt-toolbar no-print">
        <button onClick={() => window.print()} className="receipt-btn-print">
          <Printer size={15} /> In hóa đơn
        </button>
        <button onClick={onClose} className="receipt-btn-close">
          <X size={15} /> Đóng
        </button>
      </div>

      {/* Phiếu in 80mm */}
      <div className="receipt-paper">
        <div className="receipt-center">
          <div className="receipt-shop">F&amp;B CHAIN</div>
          <div className="receipt-branch">{TenCN || 'Chi nhánh'}</div>
          <div className="receipt-title">HÓA ĐƠN BÁN HÀNG</div>
        </div>

        <div className="receipt-divider" />

        <div className="receipt-meta">
          <div><span>Số HĐ:</span><b>{MaHD || '—'}</b></div>
          <div><span>Ngày:</span><span>{fmtDateTime(NgayLap || new Date())}</span></div>
          <div><span>Thu ngân:</span><span>{TenNhanVien || '—'}</span></div>
          {customer ? (
            <>
              <div><span>Khách:</span><span>{customer.TenKH}</span></div>
              {customer.SDT && <div><span>SĐT:</span><span>{customer.SDT}</span></div>}
            </>
          ) : (
            <div><span>Khách:</span><span>Khách vãng lai</span></div>
          )}
        </div>

        <div className="receipt-divider" />

        {/* Danh sách món */}
        <table className="receipt-items">
          <thead>
            <tr>
              <th className="ri-name">Mặt hàng</th>
              <th className="ri-qty">SL</th>
              <th className="ri-amt">T.Tiền</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td className="ri-name">
                  {it.TenSP}
                  <div className="ri-unit">{it.SoLuong} × {fmtCurrency(it.GiaBan)}</div>
                </td>
                <td className="ri-qty">{it.SoLuong}</td>
                <td className="ri-amt">{fmtCurrency(it.ThanhTien)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="receipt-divider" />

        {/* Tổng kết */}
        <div className="receipt-sum">
          <div><span>Tổng tiền hàng</span><span>{fmtCurrency(TongTienHang)}</span></div>
          {GiamGia > 0 && (
            <div><span>Giảm giá</span><span>− {fmtCurrency(GiamGia)}</span></div>
          )}
          <div className="receipt-total">
            <span>TỔNG THANH TOÁN</span><span>{fmtCurrency(TongThanhToan)}</span>
          </div>
          <div><span>Thanh toán</span><span>{PAY_LABEL[PhuongThuc] || PhuongThuc || '—'}</span></div>
          {customer && DiemCong > 0 && (
            <div><span>Điểm tích lũy</span><span>+{DiemCong}</span></div>
          )}
        </div>

        <div className="receipt-divider" />

        <div className="receipt-center receipt-thanks">
          <div>Cảm ơn quý khách!</div>
          <div>Hẹn gặp lại</div>
        </div>
      </div>
    </div>
  )
}
