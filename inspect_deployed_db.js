
const Database = require('better-sqlite3');

const db = new Database('d:\\Freellace\\Gym-ease\\gym-ease-nextjs\\deployed_gym_ease.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

console.log('--- TABLES IN DEPLOYED DB ---');
for (const table of tables) {
    console.log(`\nTable: ${table.name}`);
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
    for (const col of columns) {
        console.log(`  - ${col.name} (${col.type})`);
    }
}
db.close();
