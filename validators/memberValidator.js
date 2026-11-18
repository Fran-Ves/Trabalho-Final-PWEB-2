const { z } = require('zod');

const memberSchema = z.object({
    name: z.string()
        .min(3, 'Nome deve ter pelo menos 3 caracteres'),

    email: z.string()
        .email('Informe um e-mail válido'),

    password: z.string()
        .min(8, 'Senha deve ter pelo menos 8 caracteres'),

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