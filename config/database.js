const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const migrations = require('../migrations');

const databasePath = process.env.DB_PATH
    || path.join(__dirname, '..', 'database', 'gym.sqlite');

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new Database(databasePath);

db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');

migrations.run(db);

console.log('Banco de dados SQLite conectado!');

module.exports = db;
