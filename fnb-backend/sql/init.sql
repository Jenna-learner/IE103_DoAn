-- ============================================
--   FnB Chain Management System
--   PostgreSQL Schema - init.sql
--   Chạy lệnh: psql -U postgres -d fnb_chain_db -f init.sql
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────────
-- 1. BRANCHES (Chi nhánh)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  address     TEXT,
  phone       VARCHAR(20),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 2. USERS (Nhân viên & Quản lý)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  branch_id   INTEGER REFERENCES branches(id) ON DELETE SET NULL,
  username    VARCHAR(100) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,         -- bcrypt hash
  full_name   VARCHAR(150),
  phone       VARCHAR(20),
  role        VARCHAR(50) NOT NULL
              CHECK (role IN ('admin','branch_manager','cashier','warehouse')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 3. CUSTOMERS (Khách hàng CRM)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id            SERIAL PRIMARY KEY,
  phone         VARCHAR(20) UNIQUE NOT NULL,
  full_name     VARCHAR(150),
  email         VARCHAR(150),
  points        INTEGER DEFAULT 0,
  membership    VARCHAR(30) DEFAULT 'bronze'
                CHECK (membership IN ('bronze','silver','gold','platinum')),
  total_spent   NUMERIC(15,2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 4. CATEGORIES (Danh mục sản phẩm)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  sort_order  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE
);

-- ──────────────────────────────────────────────────────────
-- 5. PRODUCTS (Sản phẩm / Menu)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  category_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name          VARCHAR(150) NOT NULL,
  sku           VARCHAR(50) UNIQUE,
  price         NUMERIC(12,2) NOT NULL,
  image_url     TEXT,
  description   TEXT,
  is_available  BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 6. INGREDIENTS (Nguyên liệu thô)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ingredients (
  id              SERIAL PRIMARY KEY,
  branch_id       INTEGER REFERENCES branches(id) ON DELETE CASCADE,
  name            VARCHAR(150) NOT NULL,
  unit            VARCHAR(30) NOT NULL,    -- kg, lít, cái, gói...
  stock_qty       NUMERIC(12,3) DEFAULT 0,
  min_stock_qty   NUMERIC(12,3) DEFAULT 0, -- Mức cảnh báo tối thiểu
  cost_per_unit   NUMERIC(12,2) DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 7. PRODUCT_RECIPES (Công thức sản xuất: sản phẩm → nguyên liệu)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_recipes (
  id              SERIAL PRIMARY KEY,
  product_id      INTEGER REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id   INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  qty_used        NUMERIC(10,4) NOT NULL,   -- Lượng nguyên liệu dùng mỗi đơn vị sản phẩm
  UNIQUE(product_id, ingredient_id)
);

-- ──────────────────────────────────────────────────────────
-- 8. ORDERS (Đơn hàng)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              SERIAL PRIMARY KEY,
  branch_id       INTEGER REFERENCES branches(id),
  cashier_id      INTEGER REFERENCES users(id),
  customer_id     INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  order_type      VARCHAR(20) DEFAULT 'dine_in'
                  CHECK (order_type IN ('dine_in','take_away','delivery')),
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending','completed','cancelled')),
  subtotal        NUMERIC(15,2) DEFAULT 0,
  discount_amount NUMERIC(15,2) DEFAULT 0,
  total_amount    NUMERIC(15,2) DEFAULT 0,
  payment_method  VARCHAR(30) CHECK (payment_method IN ('cash','card','e_wallet')),
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 9. ORDER_ITEMS (Chi tiết đơn hàng)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL PRIMARY KEY,
  order_id    INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER REFERENCES products(id),
  product_name VARCHAR(150),               -- Snapshot tên lúc bán
  unit_price  NUMERIC(12,2) NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  subtotal    NUMERIC(15,2) NOT NULL
);

-- ──────────────────────────────────────────────────────────
-- 10. INVENTORY_LOGS (Nhật ký biến động kho)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_logs (
  id              SERIAL PRIMARY KEY,
  branch_id       INTEGER REFERENCES branches(id),
  ingredient_id   INTEGER REFERENCES ingredients(id),
  change_type     VARCHAR(30) NOT NULL
                  CHECK (change_type IN ('sale','purchase','adjustment','return','waste')),
  qty_change      NUMERIC(12,3) NOT NULL,   -- Dương: nhập | Âm: xuất
  qty_before      NUMERIC(12,3),
  qty_after       NUMERIC(12,3),
  ref_id          INTEGER,                  -- order_id hoặc purchase_order_id
  ref_type        VARCHAR(30),
  note            TEXT,
  created_by      INTEGER REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- 11. STOCK_CHECKS (Phiếu kiểm kho)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stock_checks (
  id          SERIAL PRIMARY KEY,
  branch_id   INTEGER REFERENCES branches(id),
  checked_by  INTEGER REFERENCES users(id),
  status      VARCHAR(20) DEFAULT 'draft'
              CHECK (status IN ('draft','confirmed')),
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_check_items (
  id              SERIAL PRIMARY KEY,
  stock_check_id  INTEGER REFERENCES stock_checks(id) ON DELETE CASCADE,
  ingredient_id   INTEGER REFERENCES ingredients(id),
  system_qty      NUMERIC(12,3),
  actual_qty      NUMERIC(12,3),
  diff_qty        NUMERIC(12,3) GENERATED ALWAYS AS (actual_qty - system_qty) STORED,
  reason          TEXT
);

-- ──────────────────────────────────────────────────────────
-- 12. SUPPLIERS (Nhà cung cấp)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  phone       VARCHAR(20),
  address     TEXT,
  is_active   BOOLEAN DEFAULT TRUE
);

-- ──────────────────────────────────────────────────────────
-- 13. PURCHASE_ORDERS (Phiếu nhập hàng)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id              SERIAL PRIMARY KEY,
  branch_id       INTEGER REFERENCES branches(id),
  supplier_id     INTEGER REFERENCES suppliers(id),
  created_by      INTEGER REFERENCES users(id),
  status          VARCHAR(20) DEFAULT 'draft'
                  CHECK (status IN ('draft','received','cancelled')),
  total_amount    NUMERIC(15,2) DEFAULT 0,
  received_at     TIMESTAMPTZ,
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
  id                  SERIAL PRIMARY KEY,
  purchase_order_id   INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  ingredient_id       INTEGER REFERENCES ingredients(id),
  ingredient_name     VARCHAR(150),
  quantity            NUMERIC(12,3) NOT NULL,
  unit_price          NUMERIC(12,2) NOT NULL,
  subtotal            NUMERIC(15,2) NOT NULL
);

-- ──────────────────────────────────────────────────────────
-- 14. SHIFTS (Ca làm việc)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shift_templates (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,     -- 'Ca Sáng', 'Ca Chiều', 'Ca Tối'
  start_time  TIME NOT NULL,
  end_time    TIME NOT NULL
);

CREATE TABLE IF NOT EXISTS shift_assignments (
  id                  SERIAL PRIMARY KEY,
  branch_id           INTEGER REFERENCES branches(id),
  user_id             INTEGER REFERENCES users(id),
  shift_template_id   INTEGER REFERENCES shift_templates(id),
  work_date           DATE NOT NULL,
  status              VARCHAR(20) DEFAULT 'scheduled'
                      CHECK (status IN ('scheduled','checked_in','completed','absent')),
  note                TEXT,
  UNIQUE (user_id, work_date, shift_template_id) -- Chống trùng ca
);

-- ──────────────────────────────────────────────────────────
-- 15. EXPENSES (Phiếu chi vận hành)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_categories (
  id    SERIAL PRIMARY KEY,
  name  VARCHAR(100) NOT NULL  -- 'Tiền điện', 'Tiền nước', 'Lương thời vụ'...
);

CREATE TABLE IF NOT EXISTS expenses (
  id              SERIAL PRIMARY KEY,
  branch_id       INTEGER REFERENCES branches(id),
  category_id     INTEGER REFERENCES expense_categories(id),
  created_by      INTEGER REFERENCES users(id),
  amount          NUMERIC(15,2) NOT NULL,
  description     TEXT,
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- INDEXES (Tăng tốc query)
-- ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_branch_id    ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at   ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status       ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_branch    ON ingredients(branch_id);
CREATE INDEX IF NOT EXISTS idx_inv_logs_branch     ON inventory_logs(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_shift_work_date     ON shift_assignments(branch_id, work_date);

-- ──────────────────────────────────────────────────────────
-- SEED DATA CƠ BẢN
-- ──────────────────────────────────────────────────────────
INSERT INTO branches (name, address, phone) VALUES
  ('Chi nhánh Quận 1', '123 Nguyễn Huệ, Q1, TP.HCM', '028-1234-5678'),
  ('Chi nhánh Quận 7', '456 Nguyễn Thị Thập, Q7, TP.HCM', '028-9876-5432')
ON CONFLICT DO NOTHING;

INSERT INTO categories (name, sort_order) VALUES
  ('Cà phê', 1), ('Trà', 2), ('Sinh tố', 3), ('Bánh', 4), ('Đồ ăn nhẹ', 5)
ON CONFLICT DO NOTHING;

INSERT INTO shift_templates (name, start_time, end_time) VALUES
  ('Ca Sáng', '06:00', '12:00'),
  ('Ca Chiều', '12:00', '18:00'),
  ('Ca Tối',  '18:00', '22:00')
ON CONFLICT DO NOTHING;

INSERT INTO expense_categories (name) VALUES
  ('Điện'), ('Nước'), ('Lương thời vụ'), ('Vệ sinh'), ('Marketing'), ('Khác')
ON CONFLICT DO NOTHING;

-- Admin user mặc định (password: Admin@123 → bcrypt)
-- Tạo thực tế bằng API /auth/register hoặc script riêng
