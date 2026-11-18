const { z } = require('zod');

const registerSchema = z.object({
    name: z.string()
        .min(3, 'O nome deve ter pelo menos 3 caracteres'),

    email: z.string()
        .email('Informe um e-mail válido'),

    password: z.string()
        .min(8, 'A senha deve ter pelo menos 8 caracteres'),

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

const loginSchema = z.object({
    email: z.string()
        .email('Informe um e-mail válido'),

    password: z.string()
        .min(1, 'Informe sua senha')
});

module.exports = {
    registerSchema,
    loginSchema
};