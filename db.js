import Database from 'better-sqlite3'
const db = new Database ('reminders.db');

db.exec (`
CREATE TABLE IF NOT EXISTS reminders(
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id TEXT,
text TEXT,
active INTEGER
)
`);

export default db;
