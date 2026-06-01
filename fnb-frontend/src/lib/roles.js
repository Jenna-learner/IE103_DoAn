export const ROLE = {
  ADMIN: 'role_admin',
  OPS_DIRECTOR: 'role_ops_director',
  BRANCH_MANAGER: 'role_branch_manager',
  CASHIER: 'role_cashier',
  WAREHOUSE: 'role_warehouse_staff',
}

const ROLE_MAP = {
  admin: ROLE.ADMIN,
  giam_doc_van_hanh: ROLE.OPS_DIRECTOR,
  quan_ly_chinhanh: ROLE.BRANCH_MANAGER,
  thu_ngan: ROLE.CASHIER,
  kho: ROLE.WAREHOUSE,
  role_admin: ROLE.ADMIN,
  role_ops_director: ROLE.OPS_DIRECTOR,
  role_branch_manager: ROLE.BRANCH_MANAGER,
  role_cashier: ROLE.CASHIER,
  role_warehouse_staff: ROLE.WAREHOUSE,
  role_readonly: ROLE.BRANCH_MANAGER,
}

export const ALL_ROLES = Object.values(ROLE)

export const ROLE_LABEL = {
  [ROLE.ADMIN]: 'Admin hệ thống',
  [ROLE.OPS_DIRECTOR]: 'Giám đốc vận hành',
  [ROLE.BRANCH_MANAGER]: 'Quản lý chi nhánh',
  [ROLE.CASHIER]: 'Thu ngân',
  [ROLE.WAREHOUSE]: 'Kho vận',
}

export const ROLE_HOME = {
  [ROLE.ADMIN]: '/dashboard',
  [ROLE.OPS_DIRECTOR]: '/dashboard',
  [ROLE.BRANCH_MANAGER]: '/dashboard',
  [ROLE.CASHIER]: '/dashboard',
  [ROLE.WAREHOUSE]: '/dashboard',
}

export const MANAGER_ROLES = [ROLE.ADMIN, ROLE.OPS_DIRECTOR, ROLE.BRANCH_MANAGER]
export const SALES_ROLES = [ROLE.ADMIN, ROLE.BRANCH_MANAGER, ROLE.CASHIER]
export const INVENTORY_WRITE_ROLES = [ROLE.ADMIN, ROLE.BRANCH_MANAGER, ROLE.WAREHOUSE]

export function normalizeRole(role) {
  return ROLE_MAP[role] || role || null
}

export function normalizeUser(user) {
  if (!user) return null
  return { ...user, vaiTro: normalizeRole(user.vaiTro) }
}
