require('dotenv').config();

// Verifica se a chave JWT foi configurada e se tem tamanho mínimo
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não foi configurado no .env');
}

if (process.env.JWT_SECRET.trim().length < 32) {
    throw new Error('JWT_SECRET muito curto: use pelo menos 32 caracteres');
}

// Inicializa o banco de dados (aplica as migrações pendentes)
require('./config/database');

const app = require('./app');
const instance = require('./utils/instance');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('================================');
    console.log('API da Academia iniciada!');
    console.log(`Instância: ${instance}`);
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log('================================');
});
