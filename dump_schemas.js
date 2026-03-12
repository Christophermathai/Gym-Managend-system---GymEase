
const Database = require('better-sqlite3');
const fs = require('fs');

function dumpSchema(dbPath, outputPath) {
    const db = new Database(dbPath);
    const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
    let schema = '';
    for (const table of tables) {
        schema += `-- Table: ${table.name}\n${table.sql};\n\n`;
    }
    fs.writeFileSync(outputPath, schema);
    db.close();
}

try {
    dumpSchema('d:\\Freellace\\Gym-ease\\gym-ease-nextjs\\deployed_gym_ease.db', 'd:\\Freellace\\Gym-ease\\gym-ease-nextjs\\deployed_schema.sql');
    dumpSchema('d:\\Freellace\\Gym-ease\\gym-ease-nextjs\\gym_ease.db', 'd:\\Freellace\\Gym-ease\\gym-ease-nextjs\\current_schema.sql');
    console.log('Schemas dumped successfully');
} catch (error) {
    console.error('Error dumping schemas:', error);
    process.exit(1);
}
