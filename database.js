const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./rp.db");

db.serialize(() => {

db.run(`
CREATE TABLE IF NOT EXISTS gangs (
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT UNIQUE,
type TEXT,
points INTEGER DEFAULT 0,
leader TEXT,
channel TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS history (
id INTEGER PRIMARY KEY AUTOINCREMENT,
gang TEXT,
action TEXT,
points INTEGER,
reason TEXT,
staff TEXT,
date TEXT
)
`);

});

module.exports = db;