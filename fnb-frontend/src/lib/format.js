/**
 * Tiện ích định dạng số, ngày tháng cho UI
 */

/** Format tiền VND: 35000 → "35,000 ₫" */
export const fmtCurrency = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount ?? 0)

/** Format số ngắn: 1234 → "1,234" */
export const fmtNumber = (n) =>
  new Intl.NumberFormat('vi-VN').format(n ?? 0)

/** Badge màu theo hạng thành viên */
export const membershipStyle = (hang) => {
  const map = {
    Bronze:  { cls: 'bg-orange-100 text-orange-700', icon: '🥉' },
    Silver:  { cls: 'bg-gray-100 text-gray-700',     icon: '🥈' },
    Gold:    { cls: 'bg-yellow-100 text-yellow-700',  icon: '🥇' },
    Diamond: { cls: 'bg-blue-100 text-blue-700',      icon: '💎' },
  }
  return map[hang] || map['Bronze']
}

/** Badge màu trạng thái hóa đơn */
export const orderStatusStyle = (status) => {
  const map = {
    Pending:   'badge-yellow',
    Completed: 'badge-green',
    Cancelled: 'badge-red',
  }
  return map[status] || 'badge-gray'
}
