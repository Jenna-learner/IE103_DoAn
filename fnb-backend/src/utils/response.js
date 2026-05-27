/**
 * Chuẩn hóa response trả về cho frontend
 */

const success = (res, data, message = 'Thành công', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const error = (res, message = 'Lỗi hệ thống', statusCode = 500) => {
  return res.status(statusCode).json({ success: false, message });
};

const paginated = (res, data, total, page, limit) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = { success, error, paginated };
