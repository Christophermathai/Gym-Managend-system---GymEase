import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'gym_ease.db');

export async function initializeDatabase() {
  return new Promise<sqlite3.Database>((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
        return;
      }

      // Enable foreign keys
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Create tables
        createTables(db)
          .then(() => resolve(db))
          .catch(reject);
      });
    });
  });
}

async function createTables(db: sqlite3.Database) {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // User profiles table
      db.run(`
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
      db.run(`
        CREATE TABLE IF NOT EXISTS fee_plans (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          duration INTEGER NOT NULL CHECK(duration IN (1, 3, 6, 12)),
          monthly_fee REAL NOT NULL,
          admission_fee REAL,
          registration_fee REAL,
          security_deposit REAL,
          is_active BOOLEAN DEFAULT TRUE,
          created_by TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
        )
      `);

      // Members table
      db.run(`
        CREATE TABLE IF NOT EXISTS members (
          id TEXT PRIMARY KEY,
          member_id TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT NOT NULL UNIQUE,
          secondary_phone TEXT,
          date_of_birth INTEGER,
          gender TEXT CHECK(gender IN ('male', 'female', 'other')),
          address TEXT,
          blood_group TEXT,
          medical_notes TEXT,
          admission_date INTEGER NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_by TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
        )
      `);

      // Subscriptions table
      db.run(`
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
      db.run(`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY,
          member_id TEXT NOT NULL,
          subscription_id TEXT,
          amount REAL NOT NULL,
          payment_type TEXT NOT NULL CHECK(payment_type IN ('membership', 'admission', 'registration', 'personal_training', 'other')),
          payment_mode TEXT NOT NULL CHECK(payment_mode IN ('cash', 'card', 'upi', 'bank_transfer', 'cheque')),
          transaction_id TEXT,
          payment_date INTEGER NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('completed', 'pending', 'failed')),
          notes TEXT,
          recorded_by TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
          FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
          FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT
        )
      `);

      // Expenses table
      db.run(`
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
      db.run(`
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
      db.run(`
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
      db.run(`
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
      db.run(`
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
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

let dbInstance: sqlite3.Database | null = null;

export async function getDatabase(): Promise<sqlite3.Database> {
  if (!dbInstance) {
    dbInstance = await initializeDatabase();
  }
  return dbInstance;
}

export function runAsync(db: sqlite3.Database, sql: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function getAsync(db: sqlite3.Database, sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function allAsync(db: sqlite3.Database, sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}
