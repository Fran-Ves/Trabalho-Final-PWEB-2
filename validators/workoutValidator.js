const { z } = require('zod');

const workoutSchema = z.object({
    memberId: z.number().int().positive().optional(),
    member_id: z.number().int().positive().optional(),
    trainerId: z.number().int().positive().optional(),
    trainer_id: z.number().int().positive().optional(),
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
    description: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
    exercises: z.string().max(5000, 'Exercícios devem ter no máximo 5000 caracteres').optional()
}).refine(
    data => data.memberId !== undefined || data.member_id !== undefined,
    { message: 'Informe o ID do membro', path: ['memberId'] }
);

const workoutUpdateSchema = z.object({
    memberId: z.number().int().positive().optional(),
    member_id: z.number().int().positive().optional(),
    trainerId: z.number().int().positive().optional(),
    trainer_id: z.number().int().positive().optional(),
    name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres').optional(),
    description: z.string().max(1000, 'Descrição deve ter no máximo 1000 caracteres').optional(),
    exercises: z.string().max(5000, 'Exercícios devem ter no máximo 5000 caracteres').optional()
}).refine(
    data => Object.keys(data).length > 0,
    { message: 'Informe pelo menos um campo para atualização' }
);

module.exports = {
    workoutSchema,
    workoutUpdateSchema
};
