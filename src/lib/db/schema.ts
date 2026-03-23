import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "habitar.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initTables(db);
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
      accessory_prompt TEXT,
      bg_image_path   TEXT,
      accessory_image_path TEXT,
      created_at      TEXT DEFAULT (datetime('now'))
    );
  `);
}