// import { db } from "./db";

// export async function initDatabase() {
//   const database = await db;

//   await database.executeAsync('PRAGMA foreign_keys = ON;');

//   await database.executeAsync(`
//     CREATE TABLE IF NOT EXISTS bills (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       total REAL,
//       created_at TEXT
//     );
//   `);

//   await database.executeAsync(`
//     CREATE TABLE IF NOT EXISTS bill_items (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       bill_id INTEGER,
//       name TEXT,
//       rate REAL,
//       qty REAL,
//       mode TEXT,
//       amount REAL,
//       FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
//     );
//   `);
// }
