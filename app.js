const express = require('express');
const cors = require('cors');

const loggerMiddleware = require('./middlewares/loggerMiddleware');
const errorMiddleware = require('./middlewares/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const memberRoutes = require('./routes/memberRoutes');
const checkinRoutes = require('./routes/checkinRoutes');
const workoutRoutes = require('./routes/workoutRoutes');

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());

app.use(loggerMiddleware);

// Rota de teste
app.get('/', (req, res) => {
    res.json({
        message: 'API da Academia funcionando!'
    });
});

// Rotas principais
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/workouts', workoutRoutes);

// Rota não encontrada
app.use((req, res, next) => {

    const error = new Error('Rota não encontrada');
    error.status = 404;

    next(error);
});

// Tratamento global de erros
app.use(errorMiddleware);

module.exports = app;