const express = require('express');
const router = express.Router();
const { login, refresh, logout } = require('../controllers/authController');
const { loginRateLimiter } = require('../middlewares/rateLimiter');

router.post('/login', loginRateLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
