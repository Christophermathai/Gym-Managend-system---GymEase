
const Database = require('better-sqlite3');

const DEPLOYED_DB_PATH = 'd:\\Freellace\\Gym-ease\\gym-ease-nextjs\\deployed_gym_ease.db';
const CURRENT_DB_PATH = 'd:\\Freellace\\Gym-ease\\gym-ease-nextjs\\gym_ease.db';

async function migrate() {
    console.log('--- STARTING MIGRATION ---');

    let deployedDb, currentDb;
    try {
        deployedDb = new Database(DEPLOYED_DB_PATH);
        currentDb = new Database(CURRENT_DB_PATH);
    } catch (e) {
        console.error('Failed to open databases:', e.message);
        return;
    }

    // Process all tables
    const tables = currentDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();

    for (const { name: tableName } of tables) {
        console.log(`\nMigrating table: ${tableName}`);

        // Check if table exists in deployed DB
        const deployedTableExists = deployedDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(tableName);
        if (!deployedTableExists) {
            console.log(`  Skipping: Table ${tableName} does not exist in deployed DB.`);
            continue;
        }

        // Get column info for mapping
        const deployedCols = deployedDb.prepare(`PRAGMA table_info(${tableName})`).all().map(c => c.name);
        const currentCols = currentDb.prepare(`PRAGMA table_info(${tableName})`).all().map(c => c.name);

        // Find common columns
        const commonCols = deployedCols.filter(col => currentCols.includes(col));

        if (commonCols.length === 0) {
            console.log(`  Skipping: No common columns found for ${tableName}.`);
            continue;
        }

        console.log(`  Mapping columns: ${commonCols.join(', ')}`);

        // Read data from deployed
        const rows = deployedDb.prepare(`SELECT ${commonCols.join(', ')} FROM ${tableName}`).all();
        console.log(`  Found ${rows.length} rows to migrate.`);

        if (rows.length === 0) continue;

        // Insert/UPSERT into current
        // We use INSERT OR IGNORE to avoid primary key collisions if some data is already there
        const placeholders = commonCols.map(() => '?').join(', ');
        const insertStmt = currentDb.prepare(`INSERT OR IGNORE INTO ${tableName} (${commonCols.join(', ')}) VALUES (${placeholders})`);

        let insertedCount = 0;
        const transaction = currentDb.transaction((data) => {
            for (const row of data) {
                const values = commonCols.map(col => row[col]);
                const info = insertStmt.run(...values);
                if (info.changes > 0) insertedCount++;
            }
        });

        try {
            transaction(rows);
            console.log(`  Successfully migrated ${insertedCount} new rows to ${tableName}.`);
        } catch (err) {
            console.error(`  Error migrating ${tableName}:`, err.message);
        }
    }

    deployedDb.close();
    currentDb.close();
    console.log('\n--- MIGRATION COMPLETED ---');
}

migrate();
