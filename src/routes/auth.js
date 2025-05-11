const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { login, changePassword, getCurrentUser } = require('../controllers/authController');

router.post('/login', login);
router.post('/change-password', authenticate, changePassword);
router.get('/me', authenticate, getCurrentUser);

module.exports = router; 