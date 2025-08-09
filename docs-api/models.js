const db = require('./db');
const bcrypt = require('bcryptjs');

function createUsersTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);
}

function insertInitialUsers() {
  const users = [
    { username: 'admin', password: 'admin123', role: 'administrator' },
    { username: 'manager', password: 'manager123', role: 'manager' },
  ];

  users.forEach(user => {
    const hashedPassword = bcrypt.hashSync(user.password, 8);
    db.run(
      `INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)`,
      [user.username, hashedPassword, user.role]
    );
  });
}

module.exports = {
  createUsersTable,
  insertInitialUsers,
};
