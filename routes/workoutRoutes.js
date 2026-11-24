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

// Cadastro de treino: admin e trainer
router.post(
    '/',
    authMiddleware,
    roleMiddleware('admin', 'trainer'),
    validationMiddleware(workoutSchema),
    workoutController.create
);

// Listagem de treinos: admin e trainer
router.get(
    '/',
    authMiddleware,
    roleMiddleware('admin', 'trainer'),
    workoutController.list
);

// Consulta de um treino: admin, trainer e o próprio membro do treino
// (a verificação de "membro autorizado" é feita no service)
router.get(
    '/:id',
    authMiddleware,
    roleMiddleware('admin', 'trainer', 'member'),
    workoutController.findById
);

// Atualização: admin e o trainer responsável pelo treino
// (a verificação de "trainer autorizado" é feita no service)
router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('admin', 'trainer'),
    validationMiddleware(workoutUpdateSchema),
    workoutController.update
);

// Exclusão: somente admin
router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('admin'),
    workoutController.remove
);

module.exports = router;
