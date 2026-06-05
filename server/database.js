const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
})

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id       INTEGER  PRIMARY KEY,
      status   TEXT     NOT NULL DEFAULT 'todo',
      name     TEXT     NOT NULL DEFAULT '',
      biz      TEXT     NOT NULL DEFAULT '',
      horizon  TEXT     NOT NULL DEFAULT 'This Week',
      added    TEXT     NOT NULL DEFAULT '',
      due      TEXT     NOT NULL DEFAULT '',
      overdue  BOOLEAN  NOT NULL DEFAULT false,
      flagged  BOOLEAN  NOT NULL DEFAULT false,
      delegate TEXT     NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS goals (
      id       SERIAL   PRIMARY KEY,
      text     TEXT     NOT NULL,
      position INTEGER  NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );
  `)
  console.log('Database tables ready')
}

module.exports = { pool, initDB }
