const ROLE_MAP = {
  admin: 'role_admin',
  quan_ly_chinhanh: 'role_readonly',
  thu_ngan: 'role_cashier',
  kho: 'role_warehouse_staff',
  role_admin: 'role_admin',
  role_readonly: 'role_readonly',
  role_cashier: 'role_cashier',
  role_warehouse_staff: 'role_warehouse_staff',
}

export function normalizeRole(role) {
  return ROLE_MAP[role] || role || null
}

export function normalizeUser(user) {
  if (!user) return null
  return { ...user, vaiTro: normalizeRole(user.vaiTro) }
}
