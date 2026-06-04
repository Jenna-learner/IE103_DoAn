import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardList, CheckCircle, RefreshCw, Search, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

import api from '../lib/api'
import { fmtNumber } from '../lib/format'
import { useAuthStore } from '../store/authStore'
import { INVENTORY_WRITE_ROLES, ROLE, normalizeRole } from '../lib/roles'

function fmtNow() {
  return new Date().toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function normalizeStock(item) {
  return {
    maNL: item.MaNL || item.manl,
    tenNL: item.TenNL || item.tennl,
    donVi: item.DonViTinh || item.donvitinh,
    heThong: Number(item.SoLuongTon ?? item.soluongton ?? 0),
    tonToiThieu: Number(item.TonToiThieu ?? item.tontoithieu ?? 0),
  }
}

function normalizeLog(item) {
  return {
    maNL: item.MaNL || item.manl,
    tenNL: item.TenNL || item.tennl,
    donVi: item.DonViTinh || item.donvitinh || '',
    loai: item.LoaiBienDong || item.loaibiendong,
    soLuong: Number(item.SoLuong ?? item.soluong ?? 0),
    truoc: Number(item.SoLuongTruoc ?? item.soluongtruoc ?? 0),
    sau: Number(item.SoLuongSau ?? item.soluongsau ?? 0),
    ngay: item.NgayThayDoi || item.ngaythaydoi,
    tenNV: item.TenNhanVien || item.tennhanvien || '—',
  }
}

const LOG_LABEL = {
  Adjustment: 'Điều chỉnh',
  Wastage: 'Hao hụt',
  ReverseExport: 'Hoàn kho',
  Audit_Loss: 'Hao hụt',
  Audit_Gain: 'Điều chỉnh tăng',
}

export default function KiemKho() {
  const { user } = useAuthStore()
  const role = normalizeRole(user?.vaiTro)
  const canSubmit = INVENTORY_WRITE_ROLES.includes(role)
  const canPickBranch = role === ROLE.ADMIN
  const [rows, setRows] = useState([])
  const [logs, setLogs] = useState([])
  const [branches, setBranches] = useState([])
  const [selectedBranch, setSelectedBranch] = useState(user?.maCN || '')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')

  const loadData = useCallback(async (showToast = false) => {
    setLoading(true)
    try {
      const params = canPickBranch && selectedBranch ? { maCN: selectedBranch } : {}
      const requests = [
        api.get('/kho/ton-kho', { params }),
        api.get('/kho/nhat-ky', { params }),
      ]
      if (canPickBranch) requests.push(api.get('/chi-nhanh'))

      const [stockRes, logRes, branchRes] = await Promise.all(requests)
      setRows((stockRes.data || []).map((item) => ({
        ...normalizeStock(item),
        thucTe: '',
        lyDo: '',
      })))
      setLogs((logRes.data || []).map(normalizeLog).filter((item) => ['Adjustment', 'Wastage', 'Audit_Loss', 'Audit_Gain'].includes(item.loai)))
      setBranches(canPickBranch ? (branchRes?.data || []).map((item) => ({ MaCN: item.MaCN || item.macn, TenCN: item.TenCN || item.tencn })) : [])
      if (showToast) toast.success('Đã làm mới dữ liệu kiểm kho')
    } catch (err) {
      toast.error(err.message || 'Không tải được dữ liệu kiểm kho')
    } finally {
      setLoading(false)
    }
  }, [canPickBranch, selectedBranch])

  useEffect(() => {
    loadData()
  }, [loadData])

  const updateRow = (maNL, field, value) => {
    setRows((prev) => prev.map((row) => row.maNL === maNL ? { ...row, [field]: value } : row))
  }

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => row.tenNL.toLowerCase().includes(q) || row.maNL.toLowerCase().includes(q))
  }, [rows, search])

  const soLechDong = rows.filter((row) => row.thucTe !== '' && Number(row.thucTe) !== row.heThong).length

  const validate = () => {
    for (const row of rows) {
      if (row.thucTe === '') continue
      const lech = Number(row.thucTe) - row.heThong
      if (lech !== 0 && !row.lyDo.trim()) {
        toast.error(`Vui lòng nhập lý do cho "${row.tenNL}"`)
        return false
      }
    }
    return true
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    if (canPickBranch && !selectedBranch) {
      toast.error('Vui lòng chọn chi nhánh để kiểm kho')
      return
    }
    if (!validate()) return

    const items = rows
      .filter((row) => row.thucTe !== '')
      .map((row) => ({ MaNL: row.maNL, SoLuongThucTe: Number(row.thucTe) }))

    if (!items.length) {
      toast.error('Vui lòng nhập ít nhất 1 số lượng thực tế')
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post('/kho/kiem-kho', {
        MaCN: canPickBranch ? selectedBranch : user?.maCN,
        items,
        GhiChu: rows.filter((row) => row.lyDo.trim()).map((row) => `${row.tenNL}: ${row.lyDo.trim()}`).join(' | '),
      })
      toast.success(res.message || 'Kiểm kho thành công')
      await loadData()
    } catch (err) {
      toast.error(err.message || 'Không gửi được phiếu kiểm kho')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList size={18} className="text-brand-500" />
            Kiểm kho & Điều chỉnh thực tế
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {canSubmit
              ? 'Đối chiếu số lượng hệ thống với thực tế và cập nhật trực tiếp qua API'
              : 'Chế độ chỉ xem: vai trò hiện tại không được điều chỉnh kiểm kho'}
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          className="btn-secondary text-sm px-3 py-2"
          disabled={loading}
        >
          <RefreshCw size={14} className={clsx(loading && 'animate-spin')} /> Làm mới
        </button>
      </div>

      <div className="card shrink-0 flex flex-wrap items-center justify-between gap-3">
        {canPickBranch && (
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="input w-full md:w-64 text-sm"
          >
            <option value="">-- Chọn chi nhánh --</option>
            {branches.map((branch) => (
              <option key={branch.MaCN} value={branch.MaCN}>{branch.TenCN}</option>
            ))}
          </select>
        )}
        <div className="relative w-full md:w-80">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Lọc nguyên liệu..."
            className="input pl-8 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 text-xs">
          {!canSubmit && (
            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-semibold">
              Chỉ xem
            </span>
          )}
          {soLechDong > 0 && (
            <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-lg font-semibold">
              {soLechDong} dòng có chênh lệch
            </span>
          )}
          <span className="text-gray-400">{fmtNow()} · {user?.hoTen || 'Người dùng'}</span>
        </div>
      </div>

      <div className="card flex-1 flex flex-col overflow-hidden p-0">
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">
          <div className="col-span-4">Nguyên liệu</div>
          <div className="col-span-1 text-center">ĐV</div>
          <div className="col-span-2 text-right">Hệ thống</div>
          <div className="col-span-2 text-right">Thực tế</div>
          <div className="col-span-1 text-right">Chênh lệch</div>
          <div className="col-span-2">Lý do</div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
              <RefreshCw size={16} className="animate-spin" /> Đang tải dữ liệu kiểm kho...
            </div>
          ) : filteredRows.map((row) => {
            const lech = row.thucTe !== '' ? Number(row.thucTe) - row.heThong : null
            const hasLech = lech !== null && lech !== 0
            const needLyDo = hasLech && !row.lyDo.trim()
            const isWarn = row.heThong <= row.tonToiThieu

            return (
              <div
                key={row.maNL}
                className={clsx(
                  'grid grid-cols-12 gap-2 px-4 py-2.5 items-center transition-colors',
                  lech !== null && lech < 0 ? 'bg-red-50/50' : lech !== null && lech > 0 ? 'bg-green-50/50' : ''
                )}
              >
                <div className="col-span-4">
                  <div className="flex items-center gap-2">
                    {isWarn && <AlertTriangle size={13} className="text-red-500" />}
                    <div>
                      <p className="text-sm font-medium text-gray-800">{row.tenNL}</p>
                      <p className="text-[11px] text-gray-400">{row.maNL}</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 text-center text-xs text-gray-500">{row.donVi}</div>
                <div className="col-span-2 text-right text-sm font-semibold text-gray-600">{fmtNumber(row.heThong)}</div>
                <div className="col-span-2 flex justify-end">
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.thucTe}
                    onChange={(e) => updateRow(row.maNL, 'thucTe', e.target.value)}
                    placeholder="Nhập..."
                    className={clsx(
                      'w-24 text-right text-sm px-2 py-1 border rounded-lg outline-none transition-colors',
                      needLyDo ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-brand-400 focus:ring-1 focus:ring-brand-200'
                    )}
                    disabled={!canSubmit}
                  />
                </div>
                <div className="col-span-1 text-right">
                  {lech !== null && lech !== 0 ? (
                    <span className={clsx('text-sm font-bold', lech < 0 ? 'text-red-600' : 'text-green-600')}>
                      {lech > 0 ? '+' : ''}{fmtNumber(lech)}
                    </span>
                  ) : <span className="text-xs text-gray-400">—</span>}
                </div>
                <div className="col-span-2">
                  {hasLech ? (
                    <input
                      type="text"
                      value={row.lyDo}
                      onChange={(e) => updateRow(row.maNL, 'lyDo', e.target.value)}
                      placeholder="Nhập lý do..."
                      className={clsx(
                        'w-full text-xs px-2 py-1 border rounded-lg outline-none transition-colors',
                        needLyDo ? 'border-red-300 bg-red-50 placeholder-red-400' : 'border-gray-200 focus:border-brand-400 focus:ring-1 focus:ring-brand-200'
                      )}
                      disabled={!canSubmit}
                    />
                  ) : <span className="text-xs text-gray-300">—</span>}
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between shrink-0">
          <p className="text-xs text-gray-400">Các chênh lệch sẽ được cập nhật tồn kho và ghi vào nhật ký kho ngay khi submit</p>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading || !canSubmit}
            className="btn-primary flex items-center gap-1.5 text-sm px-4 py-1.5 disabled:opacity-60"
          >
            {submitting ? <><RefreshCw size={13} className="animate-spin" /> Đang gửi...</> : canSubmit ? <><CheckCircle size={13} /> Xác nhận kiểm kho</> : 'Không có quyền điều chỉnh'}
          </button>
        </div>
      </div>

      <div className="card shrink-0 max-h-60 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Lịch sử điều chỉnh gần đây</h3>
          <span className="text-xs text-gray-400">{logs.length} bản ghi</span>
        </div>
        <div className="space-y-2">
          {logs.slice(0, 8).map((log, index) => (
            <div key={`${log.maNL}-${index}`} className="rounded-lg border border-gray-100 px-3 py-2.5 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-800">{log.tenNL}</p>
                <p className="text-[11px] text-gray-400">{log.maNL} · {LOG_LABEL[log.loai] || log.loai} · {log.tenNV}</p>
              </div>
              <div className="text-right">
                <p className={clsx('text-sm font-semibold', (log.loai === 'Wastage' || log.loai === 'Audit_Loss' || log.sau < log.truoc) ? 'text-red-600' : 'text-green-600')}>
                  {(log.loai === 'Audit_Gain' || log.sau >= log.truoc) ? '+' : '-'}{fmtNumber(log.soLuong)} {log.donVi}
                </p>
                <p className="text-[11px] text-gray-400">{fmtNumber(log.truoc)} → {fmtNumber(log.sau)}</p>
                <p className="text-[11px] text-gray-400">{fmtDateTime(log.ngay)}</p>
              </div>
            </div>
          ))}
          {!loading && logs.length === 0 && <p className="text-sm text-gray-400">Chưa có điều chỉnh kiểm kho nào.</p>}
        </div>
      </div>
    </div>
  )
}
