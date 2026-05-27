const express = require('express');
const router  = express.Router();
const { login, getMe, doiMatKhau } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

router.post('/login',        login);
router.get('/me',            authenticate, getMe);
router.put('/doi-mat-khau',  authenticate, doiMatKhau);

module.exports = router;
