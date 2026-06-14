/**
 * PrintableReport.jsx — Báo cáo in được (Print → Save as PDF)
 *
 * Dùng chung cho 3 vai trò: quản lý (manager), thu ngân (cashier), kho (warehouse).
 * Bố cục: Header (logo + tiêu đề + kỳ báo cáo) · Khối thông tin người lập/ngày ·
 *         KPI · Biểu đồ (cột / tròn / đường) · Bảng xếp hạng · Khối ký tên ·
 *         Footer chạy (tên hệ thống + người lập + ngày + chỗ số trang).
 *
 * Số trang: footer chạy lặp ở mỗi trang khi in; để có "Trang X/Y" tự động,
 * giữ tùy chọn "Headers and footers" trong hộp thoại in của trình duyệt.
 */
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { Printer, X } from 'lucide-react'
import { fmtCurrency, fmtNumber } from '../../lib/format'
import logoImg from '../../assets/logo.png'

const PIE_COLORS = ['#f97316', '#0ea5e9', '#22c55e', '#a855f7', '#eab308', '#ef4444', '#14b8a6', '#6366f1']

function fmtToday() {
  return new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtNow() {
  return new Date().toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function Section({ title, hint, children }) {
  return (
    <section className="report-section">
      <div className="report-section-head">
        <h2>{title}</h2>
        {hint && <span>{hint}</span>}
      </div>
      {children}
    </section>
  )
}

function KpiGrid({ items }) {
  return (
    <div className="report-kpi-grid">
      {items.map((k) => (
        <div key={k.label} className="report-kpi">
          <p className="report-kpi-label">{k.label}</p>
          <p className="report-kpi-value">{k.value}</p>
        </div>
      ))}
    </div>
  )
}

export default function PrintableReport({
  role = 'manager',
  roleLabel = '',
  branchLabel = 'Toàn hệ thống',
  period = '',
  preparedBy = 'Người dùng',
  summary = {},
  revenueSeries = [],
  topProducts = [],
  lowStockItems = [],
  orders = [],
  inventoryLogs = [],
  stockCount = 0,
  pendingPO = 0,
  onClose,
}) {
  const today = fmtToday()
  const reportTitle =
    role === 'cashier' ? 'BÁO CÁO BÁN HÀNG' :
    role === 'warehouse' ? 'BÁO CÁO KHO VẬN' :
    'BÁO CÁO KINH DOANH'

  const revenueTotal = revenueSeries.reduce((s, r) => s + (r.DoanhThuThuan || 0), 0)
  const pieData = topProducts.slice(0, 6).map((p) => ({ name: p.TenSP, value: p.TongDoanhThu || 0 }))

  return (
    <div className="report-overlay">
      {/* Thanh công cụ — không in */}
      <div className="report-toolbar no-print">
        <button className="btn-secondary text-sm px-3 py-1.5" onClick={onClose}>
          <X size={14} /> Đóng
        </button>
        <button className="btn-primary text-sm px-4 py-1.5" onClick={() => window.print()}>
          <Printer size={14} /> In / Lưu PDF
        </button>
      </div>

      <div className="report-root">
        {/* ── HEADER ── */}
        <header className="report-header">
          <div className="report-brand">
            <img src={logoImg} alt="logo" />
            <div>
              <p className="report-company">FnB Chain Management System</p>
              <p className="report-company-sub">Hệ thống quản lý chuỗi F&amp;B · IE103</p>
            </div>
          </div>
          <div className="report-title-block">
            <h1>{reportTitle}</h1>
            <p>{period ? `Kỳ báo cáo: ${period}` : `Ngày: ${today}`}</p>
          </div>
        </header>

        {/* ── META: người lập / phạm vi / ngày ── */}
        <div className="report-meta">
          <div><span>Người lập:</span> <strong>{preparedBy}</strong></div>
          <div><span>Chức vụ:</span> <strong>{roleLabel || '—'}</strong></div>
          <div><span>Phạm vi:</span> <strong>{branchLabel}</strong></div>
          <div><span>Ngày xuất:</span> <strong>{fmtNow()}</strong></div>
        </div>

        {/* ====================== MANAGER ====================== */}
        {role === 'manager' && (
          <>
            <Section title="1. Chỉ số tổng quan">
              <KpiGrid items={[
                { label: 'Doanh thu thô hôm nay', value: fmtCurrency(summary.TongDoanhThuTho) },
                { label: 'Giảm giá hôm nay', value: fmtCurrency(summary.TongGiamGia) },
                { label: 'Doanh thu thuần', value: fmtCurrency(summary.DoanhThuThuan) },
                { label: 'Hóa đơn hoàn tất', value: fmtNumber(summary.SoHoaDon) },
                { label: 'Cảnh báo tồn kho', value: `${fmtNumber(summary.SoCanhBaoTonKho)} NL` },
                { label: 'Tổng DT thuần kỳ', value: fmtCurrency(revenueTotal) },
              ]} />
            </Section>

            <Section title="2. Doanh thu theo ngày (biểu đồ cột)" hint={period}>
              {revenueSeries.length === 0 ? <p className="report-empty">Chưa có dữ liệu doanh thu.</p> : (
                <div className="report-chart">
                  <BarChart width={690} height={260} data={revenueSeries} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v) => fmtCurrency(v)} />
                    <Bar dataKey="DoanhThuThuan" name="Doanh thu thuần" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={26} isAnimationActive={false} />
                  </BarChart>
                </div>
              )}
            </Section>

            <Section title="3. Xu hướng doanh thu (biểu đồ đường)">
              {revenueSeries.length === 0 ? <p className="report-empty">Chưa có dữ liệu.</p> : (
                <div className="report-chart">
                  <LineChart width={690} height={240} data={revenueSeries} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip formatter={(v) => fmtCurrency(v)} />
                    <Line type="monotone" dataKey="DoanhThuThuan" name="Doanh thu thuần" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
                  </LineChart>
                </div>
              )}
            </Section>

            <Section title="4. Cơ cấu doanh thu theo sản phẩm (biểu đồ tròn)">
              {pieData.length === 0 ? <p className="report-empty">Chưa có dữ liệu bán hàng.</p> : (
                <div className="report-chart">
                  <PieChart width={690} height={280}>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="42%" cy="50%" outerRadius={95} label={(e) => `${Math.round((e.percent || 0) * 100)}%`} isAnimationActive={false}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtCurrency(v)} />
                    <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </div>
              )}
            </Section>

            <Section title="5. Top sản phẩm bán chạy">
              <table className="report-table">
                <thead>
                  <tr><th>#</th><th>Mã SP</th><th>Tên sản phẩm</th><th className="num">SL bán</th><th className="num">Doanh thu</th></tr>
                </thead>
                <tbody>
                  {topProducts.length === 0 ? (
                    <tr><td colSpan={5} className="report-empty">Chưa có dữ liệu.</td></tr>
                  ) : topProducts.map((p, i) => (
                    <tr key={p.MaSP || i}>
                      <td>{i + 1}</td><td>{p.MaSP || '—'}</td><td>{p.TenSP}</td>
                      <td className="num">{fmtNumber(p.TongSoLuongBan)}</td>
                      <td className="num">{fmtCurrency(p.TongDoanhThu)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="6. Cảnh báo tồn kho">
              <table className="report-table">
                <thead>
                  <tr><th>#</th><th>Nguyên liệu</th><th>Chi nhánh</th><th className="num">Tồn hiện tại</th><th className="num">Mức tối thiểu</th></tr>
                </thead>
                <tbody>
                  {lowStockItems.length === 0 ? (
                    <tr><td colSpan={5} className="report-empty">Không có cảnh báo tồn kho.</td></tr>
                  ) : lowStockItems.map((it, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td><td>{it.TenNL}</td><td>{it.TenCN || branchLabel}</td>
                      <td className="num">{fmtNumber(it.SoLuongTon)}</td>
                      <td className="num">{fmtNumber(it.TonToiThieu)} {it.DonViTinh || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </>
        )}

        {/* ====================== CASHIER ====================== */}
        {role === 'cashier' && (
          <>
            <Section title="1. Chỉ số bán hàng trong ngày">
              <KpiGrid items={[
                { label: 'Hóa đơn hôm nay', value: fmtNumber(orders.length) },
                { label: 'Đơn hoàn tất', value: fmtNumber(orders.filter((o) => o.TrangThai === 'Completed').length) },
                { label: 'Đơn đang xử lý', value: fmtNumber(orders.filter((o) => o.TrangThai === 'Pending').length) },
                { label: 'Doanh thu đã chốt', value: fmtCurrency(orders.filter((o) => o.TrangThai === 'Completed').reduce((s, o) => s + (o.TongThanhToan || 0), 0)) },
              ]} />
            </Section>

            <Section title="2. Danh sách hóa đơn trong ngày">
              <table className="report-table">
                <thead>
                  <tr><th>#</th><th>Mã HĐ</th><th>Khách hàng</th><th>Trạng thái</th><th className="num">Thành tiền</th></tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr><td colSpan={5} className="report-empty">Chưa có hóa đơn.</td></tr>
                  ) : orders.map((o, i) => (
                    <tr key={o.MaHD || i}>
                      <td>{i + 1}</td><td>{o.MaHD}</td><td>{o.TenKH || 'Khách vãng lai'}</td><td>{o.TrangThai}</td>
                      <td className="num">{fmtCurrency(o.TongThanhToan)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </>
        )}

        {/* ====================== WAREHOUSE ====================== */}
        {role === 'warehouse' && (
          <>
            <Section title="1. Chỉ số kho">
              <KpiGrid items={[
                { label: 'Nguyên liệu theo dõi', value: fmtNumber(stockCount) },
                { label: 'Cảnh báo tồn thấp', value: fmtNumber(lowStockItems.length) },
                { label: 'Phiếu nhập chờ xử lý', value: fmtNumber(pendingPO) },
                { label: 'Biến động gần đây', value: fmtNumber(inventoryLogs.length) },
              ]} />
            </Section>

            <Section title="2. Nguyên liệu dưới mức tối thiểu">
              <table className="report-table">
                <thead>
                  <tr><th>#</th><th>Mã NL</th><th>Nguyên liệu</th><th className="num">Tồn</th><th className="num">Tối thiểu</th></tr>
                </thead>
                <tbody>
                  {lowStockItems.length === 0 ? (
                    <tr><td colSpan={5} className="report-empty">Không có nguyên liệu dưới ngưỡng.</td></tr>
                  ) : lowStockItems.map((it, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td><td>{it.MaNL || '—'}</td><td>{it.TenNL}</td>
                      <td className="num">{fmtNumber(it.SoLuongTon)}</td>
                      <td className="num">{fmtNumber(it.TonToiThieu)} {it.DonViTinh || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Section title="3. Nhật ký biến động kho gần đây">
              <table className="report-table">
                <thead>
                  <tr><th>#</th><th>Nguyên liệu</th><th>Loại</th><th className="num">Số lượng</th></tr>
                </thead>
                <tbody>
                  {inventoryLogs.length === 0 ? (
                    <tr><td colSpan={4} className="report-empty">Chưa có biến động.</td></tr>
                  ) : inventoryLogs.map((l, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td><td>{l.TenNL}</td><td>{l.LoaiBienDong}</td>
                      <td className="num">{fmtNumber(l.SoLuong)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          </>
        )}

        {/* ── KHỐI KÝ TÊN ── */}
        <div className="report-sign">
          <div>
            <p className="report-sign-place">………, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
            <p className="report-sign-role">NGƯỜI LẬP BÁO CÁO</p>
            <p className="report-sign-note">(Ký, ghi rõ họ tên)</p>
            <p className="report-sign-name">{preparedBy}</p>
          </div>
        </div>

        {/* ── FOOTER CHẠY (lặp mỗi trang khi in) ── */}
        <footer className="report-footer">
          <span>FnB Chain Management System · IE103</span>
          <span>Người lập: {preparedBy} · Xuất ngày {today}</span>
        </footer>
      </div>
    </div>
  )
}
