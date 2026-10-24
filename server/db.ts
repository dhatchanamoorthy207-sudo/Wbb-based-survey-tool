import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: SqlJsDatabase | null = null;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'survey_tool.sqlite');

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const SQL = await initSqlJs();

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  let db: SqlJsDatabase;
  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Could not read existing database file, creating fresh database:', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON;');

  // Initialize schema
  initSchema(db);

  dbInstance = db;
  return dbInstance;
}

export function saveDatabase(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

function initSchema(db: SqlJsDatabase) {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Surveys table
  db.run(`
    CREATE TABLE IF NOT EXISTS surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'General',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Questions table
  db.run(`
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      is_required INTEGER DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      help_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
    );
  `);

  // Options table (for multiple_choice, single_choice, dropdown)
  db.run(`
    CREATE TABLE IF NOT EXISTS options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      option_text TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );
  `);

  // Responses table (one per respondent submission)
  db.run(`
    CREATE TABLE IF NOT EXISTS responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_id INTEGER NOT NULL,
      respondent_identifier TEXT,
      submission_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      completion_seconds INTEGER DEFAULT 0,
      FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE CASCADE
    );
  `);

  // Answers table
  db.run(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      response_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      answer_value TEXT NOT NULL,
      FOREIGN KEY (response_id) REFERENCES responses(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );
  `);

  // Indexes for performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_surveys_user ON surveys(user_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_questions_survey ON questions(survey_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_options_question ON options(question_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_responses_survey ON responses(survey_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_answers_response ON answers(response_id);`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);`);

  saveDatabase();
}

/**
 * Execute parameterized query returning array of plain objects
 */
export async function queryAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const db = await getDatabase();
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    return results;
  } finally {
    stmt.free();
  }
}

/**
 * Execute parameterized query returning first row or null
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const results = await queryAll<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute parameterized insert/update/delete query and persist to disk
 */
export async function runQuery(sql: string, params: any[] = []): Promise<{ lastInsertRowid: number; changes: number }> {
  const db = await getDatabase();
  const stmt = db.prepare(sql);
  try {
    stmt.bind(params);
    stmt.step();
  } finally {
    stmt.free();
  }

  // Get last insert row id
  const rowIdResult = db.exec('SELECT last_insert_rowid() as id;');
  const lastInsertRowid = rowIdResult[0]?.values[0]?.[0] as number || 0;
  
  // Get changes count
  const changesResult = db.exec('SELECT changes() as cnt;');
  const changes = changesResult[0]?.values[0]?.[0] as number || 0;

  saveDatabase();
  return { lastInsertRowid, changes };
}
