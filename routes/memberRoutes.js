const express = require('express');

const router = express.Router();

const memberController = require('../controllers/memberController');

const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

const validationMiddleware = require('../middlewares/validationMiddleware');

const { memberSchema } = require('../validators/memberValidator');

// Cadastro de membros pra ver se precisa de mais algo
router.post(
    '/',
    authMiddleware,
    roleMiddleware('admin'),
    validationMiddleware(memberSchema),
    memberController.create
);

// Consulta de membros acho que isso já dá não acho que ele vai pegar otimização como topico
router.get(
    '/',
    authMiddleware,
    roleMiddleware('admin', 'trainer'),
    memberController.list
);

// Perfil do próprio membro autenticado. Precisa vir antes de '/:id'.
router.get(
    '/me',
    authMiddleware,
    roleMiddleware('member'),
    memberController.me
);

// Consulta de um membro específico talvez depois mudar
router.get(
    '/:id',
    authMiddleware,
    roleMiddleware('admin', 'trainer'),
    memberController.findById
);

module.exports = router;