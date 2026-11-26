const express = require('express');

const router = express.Router();

const workoutController = require('../controllers/workoutControllers');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');

const {
    workoutSchema,
    workoutUpdateSchema
} = require('../validators/workoutValidator');

router.post(
    '/',
    authMiddleware,
    roleMiddleware('admin', 'trainer'),
    validationMiddleware(workoutSchema),
    workoutController.create
);

router.get(
    '/',
    authMiddleware,
    roleMiddleware('admin', 'trainer'),
    workoutController.list
);

router.get(
    '/mine',
    authMiddleware,
    roleMiddleware('member'),
    workoutController.listMine
);

router.get(
    '/:id',
    authMiddleware,
    roleMiddleware('admin', 'trainer', 'member'),
    workoutController.findById
);

router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('admin', 'trainer'),
    validationMiddleware(workoutUpdateSchema),
    workoutController.update
);

router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('admin'),
    workoutController.remove
);

module.exports = router;
