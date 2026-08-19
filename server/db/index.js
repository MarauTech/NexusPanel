import fs from 'fs';
import path from 'path';
import initSqlJs from 'sql.js';
import config from '../config/index.js';
import { initializeDatabase, initializeDefaultSettings } from './schema.js';

// Ensure data directory exists
const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// ============================================
// better-sqlite3-compatible wrapper for sql.js
// ============================================
class DatabaseWrapper {
  constructor(sqlDb, dbPath) {
    this._db = sqlDb;
    this._dbPath = dbPath;
    this._saveTimer = null;
  }

  // Schedule a debounced save to disk (200ms)
  _scheduleSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this._saveToDisk();
    }, 200);
  }

  _saveToDisk() {
    try {
      const data = this._db.export();
      const buffer = Buffer.from(data);
      // Atomic write: write to temp file then rename to prevent corruption
      const tempPath = `${this._dbPath}.tmp`;
      fs.writeFileSync(tempPath, buffer);
      fs.renameSync(tempPath, this._dbPath);
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  // Save immediately to disk (guaranteed persistence)
  saveSync() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveToDisk();
  }

  exec(sql) {
    this._db.run(sql);
    this._scheduleSave();
  }

  prepare(sql) {
    return new StatementWrapper(this, sql);
  }

  transaction(fn) {
    return (...args) => {
      let inTx = false;
      try {
        this._db.run('BEGIN TRANSACTION');
        inTx = true;
      } catch (e) {
        // Already in transaction
      }
      try {
        const result = fn(...args);
        if (inTx) {
          try {
            this._db.run('COMMIT');
          } catch (e) {
            // ignore commit error
          }
          this.saveSync();
        }
        return result;
      } catch (err) {
        if (inTx) {
          try {
            this._db.run('ROLLBACK');
          } catch (e) {
            // ignore rollback error
          }
        }
        throw err;
      }
    };
  }
}

class StatementWrapper {
  constructor(dbWrapper, sql) {
    this._dbWrapper = dbWrapper;
    this._sql = sql;
  }

  get(...params) {
    try {
      const stmt = this._dbWrapper._db.prepare(this._sql);
      stmt.bind(params.length > 0 ? params : undefined);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row;
      }
      stmt.free();
      return undefined;
    } catch (err) {
      if (err.message && err.message.includes('no results')) return undefined;
      throw err;
    }
  }

  all(...params) {
    const results = [];
    try {
      const stmt = this._dbWrapper._db.prepare(this._sql);
      stmt.bind(params.length > 0 ? params : undefined);
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
    } catch (err) {
      if (err.message && err.message.includes('no results')) return results;
      throw err;
    }
    return results;
  }

  run(...params) {
    try {
      this._dbWrapper._db.run(this._sql, params.length > 0 ? params : undefined);
      this._dbWrapper._scheduleSave();
      
      const changes = this._dbWrapper._db.getRowsModified();
      let lastInsertRowid = 0;
      try {
        const stmt = this._dbWrapper._db.prepare('SELECT last_insert_rowid() as id');
        if (stmt.step()) {
          const row = stmt.getAsObject();
          lastInsertRowid = row.id;
        }
        stmt.free();
      } catch (e) {
        lastInsertRowid = 0;
      }

      return { changes, lastInsertRowid };
    } catch (err) {
      throw err;
    }
  }
}

// Initialize database synchronously using top-level await
const SQL = await initSqlJs();

let sqlDb;
if (fs.existsSync(config.DB_PATH)) {
  try {
    const fileBuffer = fs.readFileSync(config.DB_PATH);
    sqlDb = new SQL.Database(fileBuffer);
  } catch (e) {
    console.error('Error reading existing database file, creating fresh DB:', e.message);
    sqlDb = new SQL.Database();
  }
} else {
  sqlDb = new SQL.Database();
}

const db = new DatabaseWrapper(sqlDb, config.DB_PATH);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON');

// Initialize schema and default settings
initializeDatabase(db);
initializeDefaultSettings(db);

// Save initial state immediately
db.saveSync();

// Save on process exit / signals
process.on('exit', () => db.saveSync());
process.on('SIGINT', () => { db.saveSync(); process.exit(0); });
process.on('SIGTERM', () => { db.saveSync(); process.exit(0); });

export default db;
