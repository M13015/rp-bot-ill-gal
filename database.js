const Database = require("better-sqlite3");
const db = new Database("rp.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS gangs (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT UNIQUE,
type TEXT,
points INTEGER DEFAULT 0,
leader TEXT,
channel TEXT
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS history (
id INTEGER PRIMARY KEY AUTOINCREMENT,
gang TEXT,
action TEXT,
points INTEGER,
reason TEXT,
staff TEXT,
date TEXT
)
`).run();

module.exports = db;