/**
 * Bộ sinh mã chứng từ tự động
 * Format: PREFIX + YYYYMMDD + HHmmss + 4 hex chars
 * Ví dụ: HD20260527_143022_a3f1
 *
 * Cải tiến so với phiên bản cũ (ngày + 4 số random):
 * - Thêm timestamp giờ/phút/giây → giảm entropy collision trong cùng ngày
 * - Thêm 4 ký tự hex từ crypto.randomBytes → entropy tốt hơn Math.random()
 * - Tổng số kết hợp trong cùng giây: 16^4 = 65536 (đủ cho production nhỏ/vừa)
 *
 * Lưu ý: với concurrent rất cao (>1000 req/giây cùng prefix),
 * nên chuyển sang sequence DB hoặc UUID. Trong phạm vi dự án FnB chuỗi vừa,
 * cách này là đủ an toàn.
 */
const crypto = require('crypto');

/**
 * @param {string} prefix - Tiền tố mã (HD, PN, PC, TT, KH...)
 * @returns {string} Mã chứng từ với entropy cao hơn
 */
const genMa = (prefix) => {
  const now = new Date();

  // YYYYMMDD
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');

  // HHmmss (UTC) – thêm chiều thời gian trong ngày
  const hms = now.toISOString().slice(11, 19).replace(/:/g, '');

  // 4 hex chars từ crypto (entropy tốt hơn Math.random)
  const hex = crypto.randomBytes(2).toString('hex'); // 2 bytes = 4 hex chars

  return `${prefix}${ymd}${hms}${hex}`;
};

module.exports = { genMa };
