const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbDir = path.join(__dirname, '../assets/database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

const dbPath = path.join(dbDir, 'matches.db');
const db = new Database(dbPath);

// Load schema automatically
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

// // Migrate existing database: Add new columns if they don't exist
// function migrateDatabase() {
//     const columnsToAdd = [
//         { name: 'odds', type: 'TEXT', defaultValue: "'[]'" },
//         { name: 'set1_odds', type: 'TEXT', defaultValue: "'[]'" },
//         { name: 'handicap', type: 'TEXT', defaultValue: "'{}'" },
//         { name: 'total_rounds', type: 'TEXT', defaultValue: "'{}'" },
//         { name: 'set1_game_count', type: 'TEXT', defaultValue: "'{}'" }
//     ];

//     // Check if matches table exists
//     const tableExists = db.prepare(`
//         SELECT name FROM sqlite_master 
//         WHERE type='table' AND name='matches'
//     `).get();

//     if (tableExists) {
//         // Get existing columns
//         const tableInfo = db.prepare(`PRAGMA table_info(matches)`).all();
//         const existingColumns = tableInfo.map(col => col.name);

//         // Add missing columns
//         for (const column of columnsToAdd) {
//             if (!existingColumns.includes(column.name)) {
//                 try {
//                     db.exec(`
//                         ALTER TABLE matches 
//                         ADD COLUMN ${column.name} ${column.type} DEFAULT ${column.defaultValue}
//                     `);
//                     console.log(`Added column: ${column.name}`);
//                 } catch (error) {
//                     console.error(`Error adding column ${column.name}:`, error);
//                 }
//             }
//         }
//     }
// }

// migrateDatabase();

module.exports = db;