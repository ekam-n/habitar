import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "habitar.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initTables(db);
    migrate(db);
  }
  return db;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS habits (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_input     TEXT NOT NULL,
    domain        TEXT NOT NULL,
    tone          TEXT NOT NULL,
    setting       TEXT NOT NULL,
    reward_style  TEXT NOT NULL,
    button_label  TEXT NOT NULL,
    created_at    TEXT DEFAULT (datetime('now'))
  );

    CREATE TABLE IF NOT EXISTS streaks (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id          INTEGER NOT NULL REFERENCES habits(id),
      streak_count      INTEGER DEFAULT 0,
      last_logged_date  TEXT,
      missed_yesterday  INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS generations (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id        INTEGER NOT NULL REFERENCES habits(id),
      streak_at_time  INTEGER NOT NULL,
      title           TEXT NOT NULL,
      bg_prompt       TEXT,
      bg_image_path   TEXT,
      created_at      TEXT DEFAULT (datetime('now'))
    );
  `);
}

/**
 * Columns that must exist, added if missing.
 *
 * CREATE TABLE IF NOT EXISTS silently ignores new columns on a database that
 * already exists, so editing initTables alone does nothing to an installed
 * habitar.db. That is exactly how the old `habits.avatar_image_path` bug
 * happened: the column was referenced in code but never created. Anything
 * added to the schema from here on must be declared BOTH in initTables (for
 * fresh databases) and here (for existing ones).
 */
const EXPECTED_COLUMNS: { table: string; column: string; type: string }[] = [
  // Character appearance is user-chosen and must survive a reload. Nullable
  // with no DB-level default: "not chosen yet" is a real state.
  { table: "habits", column: "character_id",      type: "TEXT" },
  { table: "habits", column: "character_variant", type: "TEXT" },
];

/** Columns from removed features, dropped if still present. */
const REMOVED_COLUMNS: { table: string; column: string }[] = [
  { table: "generations", column: "accessory_prompt" },
  { table: "generations", column: "accessory_image_path" },
];

function columnNames(db: Database.Database, table: string): Set<string> {
  // Table names here are hardcoded literals, never user input; PRAGMA cannot
  // be parameterized.
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return new Set(rows.map((r) => r.name));
}

/**
 * Idempotent. Runs on every getDb(); each step is guarded by a PRAGMA
 * table_info check, so a second run is a no-op.
 */
function migrate(db: Database.Database) {
  for (const { table, column, type } of EXPECTED_COLUMNS) {
    if (!columnNames(db, table).has(column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
  }

  for (const { table, column } of REMOVED_COLUMNS) {
    if (!columnNames(db, table).has(column)) continue;
    try {
      db.exec(`ALTER TABLE ${table} DROP COLUMN ${column}`);
    } catch {
      // DROP COLUMN needs SQLite 3.35+, and refuses on indexed columns. The
      // column is unused either way, so leaving it in place is harmless.
    }
  }
}
