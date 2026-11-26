const express = require('express');

const router = express.Router();

const memberController = require('../controllers/memberController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const validationMiddleware = require('../middlewares/validationMiddleware');

const { memberSchema } = require('../validators/memberValidator');

router.post(
    '/',
    authMiddleware,
    roleMiddleware('admin'),
    validationMiddleware(memberSchema),
    memberController.create
);

router.get(
    '/',
    authMiddleware,
    roleMiddleware('admin', 'trainer'),
    memberController.list
);

router.get(
    '/me',
    authMiddleware,
    roleMiddleware('member'),
    memberController.me
);

router.get(
    '/:id',
    authMiddleware,
    roleMiddleware('admin', 'trainer'),
    memberController.findById
);

module.exports = router;