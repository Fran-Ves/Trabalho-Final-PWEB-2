const { z } = require('zod');

const dateRule = z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato AAAA-MM-DD');

const timeRule = z.string()
    .regex(
        /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/,
        'Hora deve estar no formato HH:MM ou HH:MM:SS'
    );

// Tudo opcional: sem corpo, o check-in usa a data/hora atuais do servidor
const checkinSchema = z.object({
    checkin_date: dateRule.optional(),
    date: dateRule.optional(),
    checkin_time: timeRule.optional(),
    time: timeRule.optional()
});

module.exports = { checkinSchema };
