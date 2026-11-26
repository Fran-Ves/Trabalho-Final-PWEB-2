const express = require('express');

const router = express.Router();

const checkinController = require('../controllers/checkinController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { checkinSchema } = require('../validators/checkinValidator');

router.post(
    '/',
    authMiddleware,
    roleMiddleware('member'),
    validationMiddleware(checkinSchema),
    checkinController.create
);

router.get(
    '/',
    authMiddleware,
    roleMiddleware('admin', 'trainer'),
    checkinController.list
);

router.get(
    '/:memberId',
    authMiddleware,
    roleMiddleware('admin', 'trainer', 'member'),
    checkinController.findByMemberId
);

module.exports = router;
