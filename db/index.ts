import path from 'path';
import 'better-sqlite3';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'gym_ease.db');

let dbInstance: any | null = null;

export async function initializeDatabase(): Promise<any> {
  let BetterSqlite3;
  try {
    BetterSqlite3 = require('better-sqlite3');
  } catch (e: any) {
    console.error('FAILED TO LOAD better-sqlite3:', e?.message);
    throw new Error('Database dependency missing: ' + e?.message);
  }

  console.log('Initializing Database at:', DB_PATH);
  const db = new BetterSqlite3(DB_PATH);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create tables
  createTables(db);

  // Create indexes
  createIndexes(db);

  return db;
}

function createIndexes(db: any) {
  // Members indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_members_active_created ON members(is_active, created_at)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone)`);

  // Subscriptions indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_subscriptions_member_id ON subscriptions(member_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_subscriptions_status_expiry ON subscriptions(status, end_date)`);

  // Payments indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_payments_status_date ON payments(status, payment_date)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_no)`);

  // Leads indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_leads_assigned_status ON leads(assigned_to, status)`);

  // Expenses indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_expenses_category_date ON expenses(category, expense_date)`);

  // Audit Log indexes
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id)`);
}

function createTables(db: any) {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('owner', 'trainer')),
      name TEXT NOT NULL,
      phone TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Fee plans table
  db.exec(`
    CREATE TABLE IF NOT EXISTS fee_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL CHECK(duration IN (1, 3, 6, 12)),
      monthly_fee REAL NOT NULL,
      admission_fee REAL,
      registration_fee REAL,
      security_deposit REAL,
      is_personal_training BOOLEAN DEFAULT FALSE,
      is_couple_package BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
    )
  `);

  // Members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      member_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL UNIQUE,
      gender TEXT CHECK(gender IN ('male', 'female', 'other')),
      blood_group TEXT,
      admission_date INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
    )
  `);

  // Subscriptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      fee_plan_id TEXT NOT NULL,
      start_date INTEGER NOT NULL,
      end_date INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active', 'expired', 'cancelled')),
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (fee_plan_id) REFERENCES fee_plans(id) ON DELETE RESTRICT,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
    )
  `);

  // Payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL,
      subscription_id TEXT,
      amount REAL NOT NULL,
      amount_due REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      payment_type TEXT NOT NULL CHECK(payment_type IN ('membership', 'admission', 'registration', 'personal_training', 'other')),
      payment_mode TEXT NOT NULL CHECK(payment_mode IN ('cash', 'card', 'upi', 'bank_transfer', 'cheque')),
      transaction_id TEXT,
      receipt_no TEXT,
      payment_date INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('completed', 'pending', 'partial', 'failed')),
      notes TEXT,
      recorded_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
      FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT
    )
  `);

  // Expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL CHECK(category IN ('rent', 'utilities', 'equipment', 'salaries', 'marketing', 'miscellaneous')),
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      expense_date INTEGER NOT NULL,
      payment_mode TEXT NOT NULL CHECK(payment_mode IN ('cash', 'card', 'bank_transfer', 'cheque')),
      receipt_number TEXT,
      notes TEXT,
      recorded_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT
    )
  `);

  // Utilities table
  db.exec(`
    CREATE TABLE IF NOT EXISTS utilities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('electricity', 'water', 'gas', 'internet')),
      bill_date INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('paid', 'pending', 'overdue')),
      notes TEXT,
      recorded_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT
    )
  `);

  // Staff table
  db.exec(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('trainer', 'receptionist', 'maintenance', 'cleaning')),
      email TEXT,
      phone TEXT NOT NULL,
      salary REAL NOT NULL,
      joining_date INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
    )
  `);

  // Leads table
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      source TEXT NOT NULL CHECK(source IN ('walk_in', 'referral', 'online', 'phone')),
      interest_level TEXT NOT NULL CHECK(interest_level IN ('hot', 'warm', 'cold')),
      preferred_plan_id TEXT,
      status TEXT NOT NULL CHECK(status IN ('new', 'contacted', 'interested', 'converted', 'lost')),
      notes TEXT,
      follow_up_date INTEGER,
      converted_to_member_id TEXT,
      assigned_to TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (preferred_plan_id) REFERENCES fee_plans(id) ON DELETE SET NULL,
      FOREIGN KEY (converted_to_member_id) REFERENCES members(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
    )
  `);

  // Audit log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    )
  `);

  // Gym settings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS gym_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      gym_name TEXT NOT NULL DEFAULT 'Gym Ease',
      gym_address TEXT,
      gym_phone TEXT,
      gym_email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default settings if not exists
  db.exec(`
    INSERT OR IGNORE INTO gym_settings (id, gym_name) VALUES (1, 'Gym Ease')
  `);

  // Migration: Add is_personal_training and is_couple_package columns to fee_plans if they don't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(fee_plans)").all() as Array<{ name: string }>;
    const hasPTColumn = tableInfo.some(col => col.name === 'is_personal_training');
    const hasCoupleColumn = tableInfo.some(col => col.name === 'is_couple_package');

    if (!hasPTColumn) {
      console.log('Adding is_personal_training column to fee_plans table...');
      db.exec(`ALTER TABLE fee_plans ADD COLUMN is_personal_training BOOLEAN DEFAULT FALSE`);
      console.log('Migration completed: is_personal_training column added');
    }

    if (!hasCoupleColumn) {
      console.log('Adding is_couple_package column to fee_plans table...');
      db.exec(`ALTER TABLE fee_plans ADD COLUMN is_couple_package BOOLEAN DEFAULT FALSE`);
      console.log('Migration completed: is_couple_package column added');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }

  // Migration: Add amount_due, balance, and receipt_no columns to payments if they don't exist
  try {
    const paymentCols = db.prepare("PRAGMA table_info(payments)").all() as Array<{ name: string }>;
    const hasAmountDue = paymentCols.some(col => col.name === 'amount_due');
    const hasBalance = paymentCols.some(col => col.name === 'balance');
    const hasReceiptNo = paymentCols.some(col => col.name === 'receipt_no');

    if (!hasAmountDue) {
      db.exec(`ALTER TABLE payments ADD COLUMN amount_due REAL DEFAULT 0`);
      console.log('Migration: amount_due column added to payments');
    }
    if (!hasBalance) {
      db.exec(`ALTER TABLE payments ADD COLUMN balance REAL DEFAULT 0`);
      console.log('Migration: balance column added to payments');
    }
    if (!hasReceiptNo) {
      db.exec(`ALTER TABLE payments ADD COLUMN receipt_no TEXT`);
      console.log('Migration: receipt_no column added to payments');
    }
  } catch (error) {
    console.error('Migration error (payments balance/receipt):', error);
  }

  // Migration: Recreate payments table to allow 'partial' in status CHECK constraint
  try {
    const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='payments'").get() as any;
    const needsMigration = tableInfo?.sql && !tableInfo.sql.includes("'partial'");

    if (needsMigration) {
      console.log('Migration: recreating payments table with partial status support...');
      db.pragma('foreign_keys = OFF');
      db.exec(`
        CREATE TABLE payments_v2 (
          id TEXT PRIMARY KEY,
          member_id TEXT NOT NULL,
          subscription_id TEXT,
          amount REAL NOT NULL,
          amount_due REAL DEFAULT 0,
          balance REAL DEFAULT 0,
          payment_type TEXT NOT NULL,
          payment_mode TEXT NOT NULL,
          transaction_id TEXT,
          receipt_no TEXT,
          payment_date INTEGER NOT NULL,
          status TEXT NOT NULL,
          notes TEXT,
          recorded_by TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
          FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
          FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT
        );
        INSERT INTO payments_v2
          SELECT id, member_id, subscription_id, amount,
                 COALESCE(amount_due, amount, 0),
                 COALESCE(balance, 0),
                 payment_type, payment_mode, transaction_id, receipt_no, payment_date,
                 status, notes, recorded_by, created_at
          FROM payments;
        DROP TABLE payments;
        ALTER TABLE payments_v2 RENAME TO payments;
      `);
      db.pragma('foreign_keys = ON');
      console.log('Migration: payments table recreated successfully');
    }
  } catch (error) {
    console.error('Migration error (payments status partial):', error);
    try { db.pragma('foreign_keys = ON'); } catch (_) { }
  }
}

export async function getDatabase(): Promise<any> {
  if (!dbInstance) {
    dbInstance = await initializeDatabase();
  }
  return dbInstance;
}

export function runAsync(db: any, sql: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
  return Promise.resolve().then(() => {
    const stmt = db.prepare(sql);
    const info = stmt.run(...params);
    return { lastID: info.lastInsertRowid as number, changes: info.changes };
  });
}

export function getAsync(db: any, sql: string, params: any[] = []): Promise<any> {
  return Promise.resolve().then(() => {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  });
}

export function allAsync(db: any, sql: string, params: any[] = []): Promise<any[]> {
  return Promise.resolve().then(() => {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  });
}
