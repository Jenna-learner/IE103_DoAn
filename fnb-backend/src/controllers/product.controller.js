const db = require('../config/db');
const { success, error, paginated } = require('../utils/response');

// GET /api/v1/products
const getAll = async (req, res, next) => {
  try {
    const { category_id, search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE p.is_available = TRUE';

    if (category_id) { params.push(category_id); where += ` AND p.category_id = $${params.length}`; }
    if (search)      { params.push(`%${search}%`); where += ` AND p.name ILIKE $${params.length}`; }

    params.push(limit, offset);
    const { rows } = await db.query(
      `SELECT p.*, c.name AS category_name
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
       ${where} ORDER BY c.sort_order, p.name
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, -2);
    const { rows: countRows } = await db.query(
      `SELECT COUNT(*) FROM products p ${where}`, countParams
    );

    return paginated(res, rows, parseInt(countRows[0].count), page, limit);
  } catch (err) { next(err); }
};

// GET /api/v1/products/:id
const getById = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, c.name AS category_name,
        json_agg(json_build_object('ingredient_id', r.ingredient_id, 'ingredient_name', i.name, 'qty_used', r.qty_used, 'unit', i.unit)) AS recipe
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN product_recipes r ON r.product_id = p.id
       LEFT JOIN ingredients i ON i.id = r.ingredient_id
       WHERE p.id = $1 GROUP BY p.id, c.name`,
      [req.params.id]
    );
    if (!rows[0]) return error(res, 'Sản phẩm không tồn tại.', 404);
    return success(res, rows[0]);
  } catch (err) { next(err); }
};

// POST /api/v1/products
const create = async (req, res, next) => {
  try {
    const { category_id, name, sku, price, image_url, description } = req.body;
    const { rows } = await db.query(
      `INSERT INTO products (category_id, name, sku, price, image_url, description)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [category_id, name, sku, price, image_url, description]
    );
    return success(res, rows[0], 'Thêm sản phẩm thành công', 201);
  } catch (err) { next(err); }
};

// PUT /api/v1/products/:id
const update = async (req, res, next) => {
  try {
    const { category_id, name, sku, price, image_url, description, is_available } = req.body;
    const { rows } = await db.query(
      `UPDATE products SET category_id=$1, name=$2, sku=$3, price=$4,
       image_url=$5, description=$6, is_available=$7 WHERE id=$8 RETURNING *`,
      [category_id, name, sku, price, image_url, description, is_available, req.params.id]
    );
    if (!rows[0]) return error(res, 'Sản phẩm không tồn tại.', 404);
    return success(res, rows[0], 'Cập nhật thành công');
  } catch (err) { next(err); }
};

// DELETE /api/v1/products/:id
const remove = async (req, res, next) => {
  try {
    await db.query(`UPDATE products SET is_available = FALSE WHERE id = $1`, [req.params.id]);
    return success(res, null, 'Đã ẩn sản phẩm');
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
