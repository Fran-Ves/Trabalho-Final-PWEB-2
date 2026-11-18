require('dotenv').config();

// Verifica se a chave JWT foi configurada
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não foi configurado no .env');
}

// Inicializa o banco de dados
require('./config/database');

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('================================');
    console.log('API da Academia iniciada!');
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log('================================');
});