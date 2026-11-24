const { z } = require('zod');

const workoutSchema = z.object({
    memberId: z.number().int().positive().optional(),
    member_id: z.number().int().positive().optional(),
    trainerId: z.number().int().positive().optional(),
    trainer_id: z.number().int().positive().optional(),
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
    description: z.string().optional(),
    exercises: z.string().optional()
}).refine(
    data => data.memberId !== undefined || data.member_id !== undefined,
    { message: 'Informe o ID do membro', path: ['memberId'] }
);

const workoutUpdateSchema = z.object({
    memberId: z.number().int().positive().optional(),
    member_id: z.number().int().positive().optional(),
    trainerId: z.number().int().positive().optional(),
    trainer_id: z.number().int().positive().optional(),
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').optional(),
    description: z.string().optional(),
    exercises: z.string().optional()
}).refine(
    data => Object.keys(data).length > 0,
    { message: 'Informe pelo menos um campo para atualização' }
);

module.exports = {
    workoutSchema,
    workoutUpdateSchema
};
