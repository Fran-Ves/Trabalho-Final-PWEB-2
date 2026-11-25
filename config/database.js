const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const migrations = require('../migrations');

// Caminho do banco: configurável (Docker usa um volume compartilhado entre as réplicas)
const databasePath = process.env.DB_PATH
    || path.join(__dirname, '..', 'database', 'gym.sqlite');

// Cria a pasta caso ela não exista (primeira execução)
fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
// Com várias réplicas escrevendo no mesmo arquivo, espera até 5 s em vez de falhar
db.pragma('busy_timeout = 5000');

// O esquema é criado/atualizado por migrações versionadas (ver /migrations)
migrations.run(db);

console.log('Banco de dados SQLite conectado!');

module.exports = db;
