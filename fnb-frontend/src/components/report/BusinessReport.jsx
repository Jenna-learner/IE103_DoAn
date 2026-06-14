/**
 * BusinessReport.jsx — Báo cáo nghiệp vụ in được (Print → Save as PDF)
 *
 * Dùng chung bố cục report-* (header · meta người lập/ngày · KPI · biểu đồ ·
 * bảng · khối ký tên · footer chạy có chỗ số trang).
 *
 * 6 loại báo cáo (prop `type`):
 *   - khach-hang      : Khách hàng & hội viên (hội viên mới, cơ cấu hạng, chi tiêu)
 *   - trang-thai-mon  : Trạng thái sản phẩm theo loại / trạng thái
 *   - nhap-hang       : Nhập hàng (giá NL, điều chỉnh kiểm kho, hao hụt)
 *   - luong           : Lương nhân viên
 *   - chi-van-hanh    : Chi phí vận hành
 *   - dong-tien       : Tổng hợp dòng tiền (DT − chi VH − nhập hàng = lợi nhuận)
 *
 * Dữ liệu lấy từ API /bao-cao/* (chỉ đọc). Không phụ thuộc PrintableReport.
 */
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { Printer, X } from 'lucide-react'
import { fmtCurrency, fmtNumber } from '../../lib/format'
import logoImg from '../../assets/logo.png'

const PIE_COLORS = ['#f97316', '#0ea5e9', '#22c55e', '#a855f7', '#eab308', '#ef4444', '#14b8a6', '#6366f1']

const RANK_VI = { Bronze: 'Đồng', Silver: 'Bạc', Gold: 'Vàng', Platinum: 'Bạch kim' }
const SP_STATUS_VI = { Available: 'Đang bán', OutOfStock: 'Hết hàng', Hidden: 'Ẩn' }
const CHI_VI = {
  Electricity: 'Tiền điện', Water: 'Tiền nước', Internet: 'Internet', Premises: 'Mặt bằng',
  'Maintenance & Repair': 'Bảo trì & sửa chữa', 'Marketing & Advertising': 'Marketing & quảng cáo',
  'Taxes & Fees': 'Thuế & phí', 'Other expenses': 'Chi phí khác',
}
const PC_STATUS_VI = { Pending: 'Chờ duyệt', Approved: 'Đã duyệt', Rejected: 'Từ chối' }

const TITLES = {
  'khach-hang': 'BÁO CÁO KHÁCH HÀNG & HỘI VIÊN',
  'trang-thai-mon': 'BÁO CÁO TRẠNG THÁI SẢN PHẨM',
  'nhap-hang': 'BÁO CÁO NHẬP HÀNG',
  'luong': 'BÁO CÁO LƯƠNG NHÂN VIÊN',
  'chi-van-hanh': 'BÁO CÁO CHI PHÍ VẬN HÀNH',
  'dong-tien': 'BÁO CÁO TỔNG HỢP DÒNG TIỀN',
}

function fmtToday() {
  return new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtNow() {
  return new Date().toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
const g = (obj, ...keys) => { for (const k of keys) { if (obj?.[k] !== undefined && obj?.[k] !== null) return obj[k] } return undefined }

function Section({ title, hint, children }) {
  return (
    <section className="report-section">
      <div className="report-section-head"><h2>{title}</h2>{hint && <span>{hint}</span>}</div>
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
function Empty({ msg }) { return <p className="report-empty">{msg}</p> }

export default function BusinessReport({
  type = 'khach-hang',
  data = {},
  roleLabel = '',
  branchLabel = 'Toàn hệ thống',
  period = '',
  preparedBy = 'Người dùng',
  onClose,
}) {
  const today = fmtToday()
  const reportTitle = TITLES[type] || 'BÁO CÁO NGHIỆP VỤ'

  return (
    <div className="report-overlay">
      <div className="report-toolbar no-print">
        <button className="btn-secondary text-sm px-3 py-1.5" onClick={onClose}><X size={14} /> Đóng</button>
        <button className="btn-primary text-sm px-4 py-1.5" onClick={() => window.print()}><Printer size={14} /> In / Lưu PDF</button>
      </div>

      <div className="report-root">
        {/* HEADER */}
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

        {/* META */}
        <div className="report-meta">
          <div><span>Người lập:</span> <strong>{preparedBy}</strong></div>
          <div><span>Chức vụ:</span> <strong>{roleLabel || '—'}</strong></div>
          <div><span>Phạm vi:</span> <strong>{branchLabel}</strong></div>
          <div><span>Ngày xuất:</span> <strong>{fmtNow()}</strong></div>
        </div>

        {type === 'khach-hang' && <KhachHang data={data} />}
        {type === 'trang-thai-mon' && <TrangThaiMon data={data} />}
        {type === 'nhap-hang' && <NhapHang data={data} />}
        {type === 'luong' && <Luong data={data} />}
        {type === 'chi-van-hanh' && <ChiVanHanh data={data} />}
        {type === 'dong-tien' && <DongTien data={data} />}

        {/* KÝ TÊN */}
        <div className="report-sign">
          <div>
            <p className="report-sign-place">………, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
            <p className="report-sign-role">NGƯỜI LẬP BÁO CÁO</p>
            <p className="report-sign-note">(Ký, ghi rõ họ tên)</p>
            <p className="report-sign-name">{preparedBy}</p>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="report-footer">
          <span>FnB Chain Management System · IE103</span>
          <span>Người lập: {preparedBy} · Xuất ngày {today}</span>
        </footer>
      </div>
    </div>
  )
}

/* ───────────────────────── 1. KHÁCH HÀNG ───────────────────────── */
function KhachHang({ data }) {
  const s = data.summary || {}
  const byRank = (data.byRank || []).map((r) => ({ ...r, name: RANK_VI[r.Hang] || r.Hang, value: r.SoLuong }))
  const top = data.topSpenders || []
  const news = data.newMembers || []
  const spendBars = top.slice(0, 8).map((t) => ({ name: t.HoTen, value: t.TongChiTieu }))
  return (
    <>
      <Section title="1. Chỉ số tổng quan">
        <KpiGrid items={[
          { label: 'Tổng khách hàng', value: fmtNumber(s.TongKH) },
          { label: 'Hội viên mới trong kỳ', value: fmtNumber(s.HoiVienMoi) },
          { label: 'Tổng điểm tích lũy', value: fmtNumber(s.TongDiem) },
          { label: 'Chi tiêu hội viên (kỳ)', value: fmtCurrency(s.ChiTieuHoiVien) },
        ]} />
      </Section>

      <Section title="2. Cơ cấu hạng thành viên (biểu đồ tròn)">
        {byRank.length === 0 ? <Empty msg="Chưa có dữ liệu khách hàng." /> : (
          <div className="report-chart">
            <PieChart width={690} height={260}>
              <Pie data={byRank} dataKey="value" nameKey="name" cx="42%" cy="50%" outerRadius={90} label={(e) => `${e.name}: ${e.value}`} isAnimationActive={false}>
                {byRank.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </div>
        )}
      </Section>

      <Section title="3. Top khách hàng theo chi tiêu (biểu đồ cột)">
        {spendBars.length === 0 ? <Empty msg="Chưa có dữ liệu chi tiêu trong kỳ." /> : (
          <div className="report-chart">
            <BarChart width={690} height={260} data={spendBars} margin={{ top: 8, right: 12, left: 4, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569' }} interval={0} angle={-25} textAnchor="end" />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v) => fmtCurrency(v)} />
              <Bar dataKey="value" name="Chi tiêu" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false} />
            </BarChart>
          </div>
        )}
      </Section>

      <Section title="4. Chi tiết chi tiêu hội viên">
        <table className="report-table">
          <thead><tr><th>#</th><th>Mã KH</th><th>Họ tên</th><th>Hạng</th><th className="num">Số đơn</th><th className="num">Tổng chi tiêu</th></tr></thead>
          <tbody>
            {top.length === 0 ? <tr><td colSpan={6} className="report-empty">Chưa có dữ liệu.</td></tr> :
              top.map((t, i) => (
                <tr key={t.MaKH || i}><td>{i + 1}</td><td>{t.MaKH}</td><td>{t.HoTen}</td>
                  <td>{RANK_VI[t.Hang] || t.Hang}</td><td className="num">{fmtNumber(t.SoDon)}</td>
                  <td className="num">{fmtCurrency(t.TongChiTieu)}</td></tr>
              ))}
          </tbody>
        </table>
      </Section>

      <Section title="5. Hội viên mới trong kỳ">
        <table className="report-table">
          <thead><tr><th>#</th><th>Mã KH</th><th>Họ tên</th><th>Hạng</th><th className="num">Điểm</th><th>Ngày đăng ký</th></tr></thead>
          <tbody>
            {news.length === 0 ? <tr><td colSpan={6} className="report-empty">Không có hội viên mới trong kỳ.</td></tr> :
              news.map((t, i) => (
                <tr key={t.MaKH || i}><td>{i + 1}</td><td>{t.MaKH}</td><td>{t.HoTen}</td>
                  <td>{RANK_VI[t.Hang] || t.Hang}</td><td className="num">{fmtNumber(t.DiemTichLuy)}</td>
                  <td>{fmtDate(t.NgayDangKy)}</td></tr>
              ))}
          </tbody>
        </table>
      </Section>
    </>
  )
}

/* ───────────────────────── 2. TRẠNG THÁI MÓN ───────────────────────── */
function TrangThaiMon({ data }) {
  const s = data.summary || {}
  const pie = (data.byStatus || []).map((r) => ({ name: SP_STATUS_VI[r.TrangThai] || r.TrangThai, value: r.SoLuong }))
  const cats = data.byCategory || []
  const items = data.items || []
  return (
    <>
      <Section title="1. Chỉ số tổng quan">
        <KpiGrid items={[
          { label: 'Tổng sản phẩm', value: fmtNumber(s.Tong) },
          { label: 'Đang bán', value: fmtNumber(s.DangBan) },
          { label: 'Hết hàng', value: fmtNumber(s.HetHang) },
          { label: 'Ẩn', value: fmtNumber(s.An) },
        ]} />
      </Section>

      <Section title="2. Cơ cấu theo trạng thái (biểu đồ tròn)">
        {pie.length === 0 ? <Empty msg="Chưa có sản phẩm." /> : (
          <div className="report-chart">
            <PieChart width={690} height={250}>
              <Pie data={pie} dataKey="value" nameKey="name" cx="42%" cy="50%" outerRadius={88} label={(e) => `${e.name}: ${e.value}`} isAnimationActive={false}>
                {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </div>
        )}
      </Section>

      <Section title="3. Số lượng món theo loại (biểu đồ cột)">
        {cats.length === 0 ? <Empty msg="Chưa có dữ liệu." /> : (
          <div className="report-chart">
            <BarChart width={690} height={260} data={cats} margin={{ top: 8, right: 12, left: 4, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="TenLoai" tick={{ fontSize: 9, fill: '#475569' }} interval={0} angle={-25} textAnchor="end" />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} allowDecimals={false} />
              <Tooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="DangBan" name="Đang bán" stackId="a" fill="#22c55e" isAnimationActive={false} maxBarSize={36} />
              <Bar dataKey="HetHang" name="Hết hàng" stackId="a" fill="#ef4444" isAnimationActive={false} maxBarSize={36} />
              <Bar dataKey="An" name="Ẩn" stackId="a" fill="#94a3b8" isAnimationActive={false} maxBarSize={36} />
            </BarChart>
          </div>
        )}
      </Section>

      <Section title="4. Thống kê theo loại sản phẩm">
        <table className="report-table">
          <thead><tr><th>#</th><th>Loại</th><th className="num">Tổng</th><th className="num">Đang bán</th><th className="num">Hết hàng</th><th className="num">Ẩn</th></tr></thead>
          <tbody>
            {cats.length === 0 ? <tr><td colSpan={6} className="report-empty">Chưa có dữ liệu.</td></tr> :
              cats.map((c, i) => (
                <tr key={c.TenLoai || i}><td>{i + 1}</td><td>{c.TenLoai}</td><td className="num">{fmtNumber(c.Tong)}</td>
                  <td className="num">{fmtNumber(c.DangBan)}</td><td className="num">{fmtNumber(c.HetHang)}</td><td className="num">{fmtNumber(c.An)}</td></tr>
              ))}
          </tbody>
        </table>
      </Section>

      <Section title="5. Danh sách sản phẩm & trạng thái">
        <table className="report-table">
          <thead><tr><th>#</th><th>Mã SP</th><th>Tên sản phẩm</th><th>Loại</th><th className="num">Giá bán</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan={6} className="report-empty">Chưa có sản phẩm.</td></tr> :
              items.map((p, i) => (
                <tr key={p.MaSP || i}><td>{i + 1}</td><td>{p.MaSP}</td><td>{p.TenSP}</td><td>{p.TenLoai}</td>
                  <td className="num">{fmtCurrency(p.GiaBanMacDinh)}</td><td>{SP_STATUS_VI[p.TrangThai] || p.TrangThai}</td></tr>
              ))}
          </tbody>
        </table>
      </Section>
    </>
  )
}

/* ───────────────────────── 3. NHẬP HÀNG ───────────────────────── */
function NhapHang({ data }) {
  const s = data.summary || {}
  const prices = data.ingredientPrices || []
  const adj = data.adjustments || []
  const waste = data.wastage || []
  const priceBars = prices.slice(0, 8).map((p) => ({ name: p.TenNL, value: p.TongTien }))
  return (
    <>
      <Section title="1. Chỉ số tổng quan">
        <KpiGrid items={[
          { label: 'Tổng giá trị nhập', value: fmtCurrency(s.TongGiaTriNhap) },
          { label: 'Số phiếu nhập', value: fmtNumber(s.SoPhieuNhap) },
          { label: 'Lần điều chỉnh kho', value: fmtNumber(s.SoLanDieuChinh) },
          { label: 'Lần hao hụt', value: fmtNumber(s.SoLanHaoHut) },
        ]} />
      </Section>

      <Section title="2. Giá trị nhập theo nguyên liệu (biểu đồ cột)">
        {priceBars.length === 0 ? <Empty msg="Chưa có phiếu nhập trong kỳ." /> : (
          <div className="report-chart">
            <BarChart width={690} height={260} data={priceBars} margin={{ top: 8, right: 12, left: 4, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569' }} interval={0} angle={-25} textAnchor="end" />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v) => fmtCurrency(v)} />
              <Bar dataKey="value" name="Giá trị nhập" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false} />
            </BarChart>
          </div>
        )}
      </Section>

      <Section title="3. Bảng giá nhập nguyên liệu">
        <table className="report-table">
          <thead><tr><th>#</th><th>Nguyên liệu</th><th>ĐVT</th><th className="num">SL nhập</th><th className="num">Giá TB</th><th className="num">Cao nhất</th><th className="num">Thấp nhất</th><th className="num">Tổng tiền</th></tr></thead>
          <tbody>
            {prices.length === 0 ? <tr><td colSpan={8} className="report-empty">Chưa có dữ liệu.</td></tr> :
              prices.map((p, i) => (
                <tr key={p.MaNL || i}><td>{i + 1}</td><td>{p.TenNL}</td><td>{p.DonViTinh}</td>
                  <td className="num">{fmtNumber(p.TongSL)}</td><td className="num">{fmtCurrency(p.GiaTB)}</td>
                  <td className="num">{fmtCurrency(p.GiaCaoNhat)}</td><td className="num">{fmtCurrency(p.GiaThapNhat)}</td>
                  <td className="num">{fmtCurrency(p.TongTien)}</td></tr>
              ))}
          </tbody>
        </table>
      </Section>

      <Section title="4. Điều chỉnh kiểm kho">
        <table className="report-table">
          <thead><tr><th>#</th><th>Nguyên liệu</th><th className="num">Trước</th><th className="num">Sau</th><th className="num">Chênh lệch</th><th>Ngày</th><th>Ghi chú</th></tr></thead>
          <tbody>
            {adj.length === 0 ? <tr><td colSpan={7} className="report-empty">Không có điều chỉnh trong kỳ.</td></tr> :
              adj.map((a, i) => (
                <tr key={i}><td>{i + 1}</td><td>{a.TenNL}</td><td className="num">{fmtNumber(a.SoLuongTruoc)}</td>
                  <td className="num">{fmtNumber(a.SoLuongSau)}</td><td className="num">{fmtNumber((a.SoLuongSau || 0) - (a.SoLuongTruoc || 0))}</td>
                  <td>{fmtDate(a.Ngay)}</td><td>{a.GhiChu || '—'}</td></tr>
              ))}
          </tbody>
        </table>
      </Section>

      <Section title="5. Hao hụt / hư hỏng">
        <table className="report-table">
          <thead><tr><th>#</th><th>Nguyên liệu</th><th className="num">Số lượng</th><th>Ngày</th><th>Ghi chú</th></tr></thead>
          <tbody>
            {waste.length === 0 ? <tr><td colSpan={5} className="report-empty">Không có hao hụt trong kỳ.</td></tr> :
              waste.map((w, i) => (
                <tr key={i}><td>{i + 1}</td><td>{w.TenNL}</td><td className="num">{fmtNumber(w.SoLuong)}</td>
                  <td>{fmtDate(w.Ngay)}</td><td>{w.GhiChu || '—'}</td></tr>
              ))}
          </tbody>
        </table>
      </Section>
    </>
  )
}

/* ───────────────────────── 4. LƯƠNG NHÂN VIÊN ───────────────────────── */
function Luong({ data }) {
  const rows = (Array.isArray(data) ? data : data.rows || data.items || []).map((r) => ({
    MaNV: g(r, 'MaNV', 'manv'), HoTen: g(r, 'HoTen', 'hoten'), TenBP: g(r, 'TenBP', 'tenbp'),
    TenCN: g(r, 'TenCN', 'tencn'), ThangNam: g(r, 'ThangNam', 'thangnam'),
    TongCaLam: Number(g(r, 'TongCaLam', 'tongcalam') || 0), DonGiaCa: Number(g(r, 'DonGiaCa', 'dongiaca') || 0),
    TongLuong: Number(g(r, 'TongLuong', 'tongluong') || 0),
  }))
  const tongQuy = rows.reduce((s, r) => s + r.TongLuong, 0)
  const tongCa = rows.reduce((s, r) => s + r.TongCaLam, 0)
  const bars = [...rows].sort((a, b) => b.TongLuong - a.TongLuong).slice(0, 8).map((r) => ({ name: r.HoTen, value: r.TongLuong }))
  return (
    <>
      <Section title="1. Chỉ số tổng quan">
        <KpiGrid items={[
          { label: 'Số nhân viên', value: fmtNumber(rows.length) },
          { label: 'Tổng ca làm', value: fmtNumber(tongCa) },
          { label: 'Tổng quỹ lương', value: fmtCurrency(tongQuy) },
        ]} />
      </Section>

      <Section title="2. Lương theo nhân viên (biểu đồ cột)">
        {bars.length === 0 ? <Empty msg="Chưa có dữ liệu lương." /> : (
          <div className="report-chart">
            <BarChart width={690} height={260} data={bars} margin={{ top: 8, right: 12, left: 4, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#475569' }} interval={0} angle={-25} textAnchor="end" />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v) => fmtCurrency(v)} />
              <Bar dataKey="value" name="Tổng lương" fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={32} isAnimationActive={false} />
            </BarChart>
          </div>
        )}
      </Section>

      <Section title="3. Bảng lương chi tiết">
        <table className="report-table">
          <thead><tr><th>#</th><th>Mã NV</th><th>Họ tên</th><th>Bộ phận</th><th>Chi nhánh</th><th>Kỳ</th><th className="num">Số ca</th><th className="num">Đơn giá/ca</th><th className="num">Tổng lương</th></tr></thead>
          <tbody>
            {rows.length === 0 ? <tr><td colSpan={9} className="report-empty">Chưa có dữ liệu lương.</td></tr> :
              rows.map((r, i) => (
                <tr key={`${r.MaNV}-${i}`}><td>{i + 1}</td><td>{r.MaNV}</td><td>{r.HoTen}</td><td>{r.TenBP || '—'}</td>
                  <td>{r.TenCN || '—'}</td><td>{r.ThangNam || '—'}</td><td className="num">{fmtNumber(r.TongCaLam)}</td>
                  <td className="num">{fmtCurrency(r.DonGiaCa)}</td><td className="num">{fmtCurrency(r.TongLuong)}</td></tr>
              ))}
          </tbody>
        </table>
      </Section>
    </>
  )
}

/* ───────────────────────── 5. CHI VẬN HÀNH ───────────────────────── */
function ChiVanHanh({ data }) {
  const s = data.summary || {}
  const byType = data.byType || []
  const items = data.items || []
  const pie = byType.map((r) => ({ name: CHI_VI[r.LoaiChi] || r.LoaiChi, value: r.TongTien }))
  return (
    <>
      <Section title="1. Chỉ số tổng quan">
        <KpiGrid items={[
          { label: 'Tổng chi vận hành', value: fmtCurrency(s.TongChi) },
          { label: 'Số phiếu chi (đã duyệt)', value: fmtNumber(s.SoPhieu) },
          { label: 'Số loại chi phí', value: fmtNumber(s.SoLoai) },
        ]} />
      </Section>

      <Section title="2. Cơ cấu chi phí theo loại (biểu đồ tròn)">
        {pie.length === 0 ? <Empty msg="Chưa có chi phí trong kỳ." /> : (
          <div className="report-chart">
            <PieChart width={690} height={260}>
              <Pie data={pie} dataKey="value" nameKey="name" cx="42%" cy="50%" outerRadius={90} label={(e) => `${Math.round((e.percent || 0) * 100)}%`} isAnimationActive={false}>
                {pie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmtCurrency(v)} /><Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </div>
        )}
      </Section>

      <Section title="3. Chi phí theo loại">
        <table className="report-table">
          <thead><tr><th>#</th><th>Loại chi phí</th><th className="num">Số phiếu</th><th className="num">Tổng tiền</th></tr></thead>
          <tbody>
            {byType.length === 0 ? <tr><td colSpan={4} className="report-empty">Chưa có dữ liệu.</td></tr> :
              byType.map((r, i) => (
                <tr key={r.LoaiChi || i}><td>{i + 1}</td><td>{CHI_VI[r.LoaiChi] || r.LoaiChi}</td>
                  <td className="num">{fmtNumber(r.SoPhieu)}</td><td className="num">{fmtCurrency(r.TongTien)}</td></tr>
              ))}
          </tbody>
        </table>
      </Section>

      <Section title="4. Chi tiết phiếu chi">
        <table className="report-table">
          <thead><tr><th>#</th><th>Mã PC</th><th>Ngày</th><th>Loại</th><th className="num">Số tiền</th><th>Trạng thái</th><th>Mô tả</th></tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan={7} className="report-empty">Chưa có phiếu chi.</td></tr> :
              items.map((r, i) => (
                <tr key={r.MaPC || i}><td>{i + 1}</td><td>{r.MaPC}</td><td>{fmtDate(r.Ngay)}</td>
                  <td>{CHI_VI[r.LoaiChi] || r.LoaiChi}</td><td className="num">{fmtCurrency(r.SoTien)}</td>
                  <td>{PC_STATUS_VI[r.TrangThai] || r.TrangThai}</td><td>{r.MoTa || '—'}</td></tr>
              ))}
          </tbody>
        </table>
      </Section>
    </>
  )
}

/* ───────────────────────── 6. DÒNG TIỀN ───────────────────────── */
function DongTien({ data }) {
  const s = data.summary || {}
  const branches = data.byBranch || []
  const trend = (data.trend || []).map((t) => ({ ...t, label: t.ThangNam }))
  return (
    <>
      <Section title="1. Tổng hợp dòng tiền trong kỳ">
        <KpiGrid items={[
          { label: 'Doanh thu bán hàng', value: fmtCurrency(s.DoanhThu) },
          { label: 'Chi phí vận hành', value: fmtCurrency(s.ChiPhiVanHanh) },
          { label: 'Chi phí nhập hàng', value: fmtCurrency(s.ChiPhiNhapHang) },
          { label: 'Lợi nhuận ước tính', value: fmtCurrency(s.LoiNhuan) },
        ]} />
        <p style={{ fontSize: 11, color: '#475569', marginTop: 8 }}>
          Công thức: <strong>Lợi nhuận ước tính = Doanh thu − Chi phí vận hành − Chi phí nhập hàng</strong>.
        </p>
      </Section>

      <Section title="2. Xu hướng dòng tiền 12 tháng (biểu đồ đường)">
        {trend.length === 0 ? <Empty msg="Chưa có dữ liệu." /> : (
          <div className="report-chart">
            <LineChart width={690} height={270} data={trend} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(v) => `${Math.round(v / 1000000)}tr`} />
              <Tooltip formatter={(v) => fmtCurrency(v)} /><Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="DoanhThu" name="Doanh thu" stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
              <Line type="monotone" dataKey="LoiNhuan" name="Lợi nhuận" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
            </LineChart>
          </div>
        )}
      </Section>

      <Section title="3. Cơ cấu doanh thu / chi phí theo tháng (biểu đồ cột)">
        {trend.length === 0 ? <Empty msg="Chưa có dữ liệu." /> : (
          <div className="report-chart">
            <BarChart width={690} height={260} data={trend} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#475569' }} />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} tickFormatter={(v) => `${Math.round(v / 1000000)}tr`} />
              <Tooltip formatter={(v) => fmtCurrency(v)} /><Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="ChiPhiVanHanh" name="Chi vận hành" stackId="c" fill="#ef4444" isAnimationActive={false} maxBarSize={24} />
              <Bar dataKey="ChiPhiNhapHang" name="Nhập hàng" stackId="c" fill="#eab308" isAnimationActive={false} maxBarSize={24} />
            </BarChart>
          </div>
        )}
      </Section>

      <Section title="4. Chi tiết theo chi nhánh (trong kỳ)">
        <table className="report-table">
          <thead><tr><th>#</th><th>Chi nhánh</th><th className="num">Doanh thu</th><th className="num">Chi vận hành</th><th className="num">Nhập hàng</th><th className="num">Lợi nhuận</th></tr></thead>
          <tbody>
            {branches.length === 0 ? <tr><td colSpan={6} className="report-empty">Chưa có dữ liệu trong kỳ.</td></tr> :
              branches.map((b, i) => (
                <tr key={b.MaCN || i}><td>{i + 1}</td><td>{b.TenCN}</td><td className="num">{fmtCurrency(b.DoanhThu)}</td>
                  <td className="num">{fmtCurrency(b.ChiPhiVanHanh)}</td><td className="num">{fmtCurrency(b.ChiPhiNhapHang)}</td>
                  <td className="num">{fmtCurrency(b.LoiNhuan)}</td></tr>
              ))}
          </tbody>
        </table>
      </Section>
    </>
  )
}
