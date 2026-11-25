const { z } = require('zod');
const passwordRule = require('./passwordRule');

const memberSchema = z.object({
    name: z.string()
        .min(3, 'Nome deve ter pelo menos 3 caracteres')
        .max(100, 'Nome deve ter no máximo 100 caracteres'),

    email: z.string()
        .email('Informe um e-mail válido')
        .max(254, 'E-mail muito longo'),

    password: passwordRule,

    phone: z.string()
        .max(20, 'Telefone muito longo')
        .optional(),

    birthDate: z.string()
        .regex(
            /^\d{4}-\d{2}-\d{2}$/,
            'Data deve estar no formato AAAA-MM-DD'
        )
        .optional()
});

module.exports = {
    memberSchema
};