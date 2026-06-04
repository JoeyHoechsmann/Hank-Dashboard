const Database = require('better-sqlite3')
const path = require('path')

const db = new Database(path.join(__dirname, 'hank.db'))

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id       INTEGER PRIMARY KEY,
    status   TEXT    DEFAULT 'todo',
    name     TEXT    NOT NULL,
    biz      TEXT    DEFAULT '',
    horizon  TEXT    DEFAULT 'This Week',
    added    TEXT    DEFAULT '',
    due      TEXT    DEFAULT '',
    overdue  INTEGER DEFAULT 0,
    flagged  INTEGER DEFAULT 0,
    delegate TEXT    DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS goals (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    text     TEXT    NOT NULL,
    position INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT
  );
`)

console.log('Database ready: hank.db')
module.exports = db
