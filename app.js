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

if (process.env.TRUST_PROXY) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
}

app.use(helmet({
    contentSecurityPolicy: {
        useDefaults: true,
        directives: { 'upgrade-insecure-requests': null }
    }
}));

app.use(instanceMiddleware);

app.use(cors({
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
        : false
}));

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

app.use(loggerMiddleware);

app.use('/api', apiLimiter);

app.use(express.json({ limit: '10kb' }));

app.use(sanitizeMiddleware);

app.get('/api', (req, res) => {
    res.json({
        message: 'API da Academia funcionando!',
        instance
    });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/workouts', workoutRoutes);

app.use((req, res, next) => {

    const error = new Error('Rota não encontrada');
    error.status = 404;

    next(error);
});

app.use(errorMiddleware);

module.exports = app;
