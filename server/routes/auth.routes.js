const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../middlewares/validate');
const asyncHandler = require('../utils/asyncHandler');

router.post('/register', validateRegister, asyncHandler(authController.register));
router.post('/login',    validateLogin,    asyncHandler(authController.login));
router.post('/admin/login', validateLogin, asyncHandler(authController.adminLogin));

module.exports = router;
