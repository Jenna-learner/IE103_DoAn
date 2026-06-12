const { bindRequestDb } = require('../config/db');

const setDbContext = async (req, res, next) => {
  req.db = bindRequestDb(req);
  next();
};

module.exports = { setDbContext };
