/**
 * Bộ sinh mã chứng từ tự động
 * Format: PREFIX + YYYYMMDD + 4 chữ số random
 * Ví dụ: HD20260527_1234, PN20260527_5678
 */

/**
 * @param {string} prefix - Tiền tố mã (HD, PN, PC, TT, KH...)
 * @returns {string} Mã chứng từ duy nhất
 */
const genMa = (prefix) => {
  const now = new Date();
  const ymd = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}${ymd}${rand}`;
};

module.exports = { genMa };
