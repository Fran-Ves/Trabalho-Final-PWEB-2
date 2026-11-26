const express = require('express');

const router = express.Router();

const authController = require('../controllers/authController');

const validationMiddleware = require('../middlewares/validationMiddleware');

const {
    registerSchema,
    loginSchema
} = require('../validators/authValidator');

router.post(
    '/register',
    validationMiddleware(registerSchema),
    authController.register
);

router.post(
    '/login',
    validationMiddleware(loginSchema),
    authController.login
);

module.exports = router;