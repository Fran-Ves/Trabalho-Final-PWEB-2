const { z } = require('zod');

// ASVS 6.2.1: mínimo de 8 caracteres.
// Limite superior de 72 bytes porque o bcrypt ignora o que passa disso.
const passwordRule = z.string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres')
    .refine(
        value => Buffer.byteLength(value, 'utf8') <= 72,
        'A senha deve ter no máximo 72 bytes'
    );

module.exports = passwordRule;
