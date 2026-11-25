const express = require('express');

const router = express.Router();

const checkinController = require('../controllers/checkinController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const validationMiddleware = require('../middlewares/validationMiddleware');
const { checkinSchema } = require('../validators/checkinValidator');

// Membro autenticado registra seu próprio check-in
router.post(
    '/',
    authMiddleware,
    roleMiddleware('member'),
    validationMiddleware(checkinSchema),
    checkinController.create
);

// Administradores e treinadores consultam todos os check-ins
router.get(
    '/',
    authMiddleware,
    roleMiddleware('admin', 'trainer'),
    checkinController.list
);

// Administradores e treinadores podem consultar qualquer membro;
// um membro só pode consultar o próprio histórico.
router.get(
    '/:memberId',
    authMiddleware,
    roleMiddleware('admin', 'trainer', 'member'),
    checkinController.findByMemberId
);

module.exports = router;
