const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const db = require('./config/database');
const instance = require('./utils/instance');

const instanceMiddleware = require('./middlewares/instanceMiddleware');
const loggerMiddleware = require('./middlewares/loggerMiddleware');
const sanitizeMiddleware = require('./middlewares/sanitizeMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');
const { apiLimiter, authLimiter } = require('./middlewares/rateLimitMiddleware');

const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const checkinRoutes = require('./routes/checkinRoutes');
const workoutRoutes = require('./routes/workoutRoutes');

const app = express();

// Atrás do Nginx (load balancer) o IP real do cliente vem em X-Forwarded-For.
// Só confiar nesse header quando realmente há proxy (TRUST_PROXY=1).
if (process.env.TRUST_PROXY) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
}

// ---------------------------------------------------------------------
// Pipeline de middlewares (a ordem importa — ver docs/ARQUITETURA.md)
// ---------------------------------------------------------------------

// 1. Cabeçalhos de segurança (CSP, nosniff, frame-options etc.)
app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: { 'upgrade-insecure-requests': null }
    }
}));

// 2. Identificação da réplica (X-Instance-Id)
app.use(instanceMiddleware);

// 3. CORS restrito: sem CORS_ORIGIN só aceita o mesmo domínio (frontend servido pela API)
app.use(cors({
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : false
}));

// Frontend estático e health check (antes do logger/limites: não poluem o log)
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => {
    try {
        db.prepare('SELECT 1').get();

        return res.json({
            status: 'ok',
            instance,
            uptime: Math.round(process.uptime())
        });
    } catch (error) {
        return res.status(503).json({ status: 'error', instance });
    }
});

// 4. Logging de requisições
app.use(loggerMiddleware);

// 5. Limite de requisições por IP
app.use('/api', apiLimiter);

// 6. Parser de JSON com limite de tamanho
app.use(express.json({ limit: '10kb' }));

// 7. Sanitização do corpo
app.use(sanitizeMiddleware);

// Rota de teste
app.get('/api', (req, res) => {
    res.json({
        message: 'API da Academia funcionando!',
        instance
    });
});

// 8. Rotas. Em cada rota: autenticação -> autorização -> validação -> controller
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/workouts', workoutRoutes);

// Rota não encontrada
app.use((req, res, next) => {

    const error = new Error('Rota não encontrada');
    error.status = 404;

    next(error);
});

// 9. Tratamento global de erros (sempre por último)
app.use(errorMiddleware);

module.exports = app;
