/**
 * PostgreSQL Connection Pools
 *
 * Mô hình cho đồ án:
 * - 1 service/auth pool tối thiểu để login + health check
 * - Nhiều pool theo DB role thực tế để runtime request dùng đúng quyền DB
 * - Mọi authenticated request được bind vào req.db qua middleware
 */
const { Pool, types } = require('pg');
require('dotenv').config();

types.setTypeParser(1082, (val) => val);

const baseConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: false,
};

const DEFAULT_DB_USERS = {
  auth: {
    user: process.env.DB_AUTH_USER || process.env.DB_USER || 'app_auth_user',
    password: process.env.DB_AUTH_PASSWORD || process.env.DB_PASSWORD || 'Auth@Service2026!',
  },
  admin: {
    user: process.env.DB_ADMIN_USER || 'app_admin',
    password: process.env.DB_ADMIN_PASSWORD || 'Admin@Str0ng!2026',
  },
  giam_doc_van_hanh: {
    user: process.env.DB_HQ_USER || 'app_hq_user',
    password: process.env.DB_HQ_PASSWORD || 'HQ_Mgr!2026',
  },
  quan_ly_chinhanh: {
    user: process.env.DB_BRANCH_MANAGER_USER || 'app_manager_user',
    password: process.env.DB_BRANCH_MANAGER_PASSWORD || 'Mgr@Br4nch2026',
  },
  thu_ngan: {
    user: process.env.DB_CASHIER_USER || 'app_cashier_user',
    password: process.env.DB_CASHIER_PASSWORD || 'Cash!er2026',
  },
  kho: {
    user: process.env.DB_WAREHOUSE_USER || 'app_warehouse_user',
    password: process.env.DB_WAREHOUSE_PASSWORD || 'War3house2026!',
  },
  hr: {
    user: process.env.DB_HR_USER || 'app_hr_user',
    password: process.env.DB_HR_PASSWORD || 'HR_Staff@2026',
  },
};

const poolCache = new Map();

const createPool = (name, credentials) => {
  const pool = new Pool({
    ...baseConfig,
    user: credentials.user,
    password: credentials.password,
  });

  pool.on('connect', () => {
    console.log(`✅ PostgreSQL connected via ZeroTier (${name})`);
  });

  pool.on('error', (err) => {
    console.error(`❌ PostgreSQL Pool Error (${name}):`, err.message);
    process.exit(1);
  });

  return pool;
};

const getOrCreatePool = (name, credentials) => {
  if (!poolCache.has(name)) {
    poolCache.set(name, createPool(name, credentials));
  }
  return poolCache.get(name);
};

const servicePool = getOrCreatePool('auth', DEFAULT_DB_USERS.auth);

const resolvePoolKeyByRole = (vaiTro) => {
  if (vaiTro === 'admin') return 'admin';
  if (vaiTro === 'giam_doc_van_hanh') return 'giam_doc_van_hanh';
  if (vaiTro === 'quan_ly_chinhanh') return 'quan_ly_chinhanh';
  if (vaiTro === 'thu_ngan') return 'thu_ngan';
  if (vaiTro === 'kho') return 'kho';
  if (vaiTro === 'hr') return 'hr';
  return 'auth';
};

const getPoolByRole = (vaiTro) => {
  const key = resolvePoolKeyByRole(vaiTro);
  return getOrCreatePool(key, DEFAULT_DB_USERS[key] || DEFAULT_DB_USERS.auth);
};

const setRequestContext = async (client, req) => {
  const maNV = req?.user?.maNV ? String(req.user.maNV) : '';
  const maCN = req?.user?.maCN ? String(req.user.maCN) : '';
  await client.query(
    `SELECT set_config('app.current_employee_id', $1, false),
            set_config('app.current_branch_id',   $2, false)`,
    [maNV, maCN]
  );
};

const clearRequestContext = async (client) => {
  await client.query(
    `SELECT set_config('app.current_employee_id', '', false),
            set_config('app.current_branch_id',   '', false)`
  );
};

const wrapRequestClient = (client) => {
  const originalRelease = client.release.bind(client);
  client.release = () => {
    clearRequestContext(client)
      .catch(() => {})
      .finally(() => originalRelease());
  };
  return client;
};

const query = (text, params) => servicePool.query(text, params);

const getClient = async () => servicePool.connect();

const queryCtx = async (req, text, params) => {
  const client = await getPoolByRole(req?.user?.vaiTro).connect();
  try {
    await setRequestContext(client, req);
    return await client.query(text, params);
  } finally {
    try {
      await clearRequestContext(client);
    } finally {
      client.release();
    }
  }
};

const getClientCtx = async (req) => {
  const client = await getPoolByRole(req?.user?.vaiTro).connect();
  await setRequestContext(client, req);
  return wrapRequestClient(client);
};

const bindRequestDb = (req) => ({
  query: (text, params) => queryCtx(req, text, params),
  queryCtx: (text, params) => queryCtx(req, text, params),
  getClient: () => getClientCtx(req),
  pool: getPoolByRole(req?.user?.vaiTro),
});

module.exports = {
  pool: servicePool,
  query,
  getClient,
  queryCtx,
  getClientCtx,
  bindRequestDb,
  getPoolByRole,
};
