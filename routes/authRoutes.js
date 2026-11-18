const express = require('express');

const router = express.Router();

const authController = require('../controllers/authController');

const validationMiddleware = require('../middlewares/validationMiddleware');

const {
    registerSchema,
    loginSchema
} = require('../validators/authValidator');

// Cadastro público
router.post(
    '/register',
    validationMiddleware(registerSchema),
    authController.register
);

// Login público
router.post(
    '/login',
    validationMiddleware(loginSchema),
    authController.login
);

module.exports = router;