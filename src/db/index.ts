import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';

// Railway에서는 볼륨 경로를 DATABASE_PATH로 주입. 로컬 기본값은 data/compete.db
const dbPath = process.env.DATABASE_PATH ?? 'data/compete.db';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);
sqlite.pragma('foreign_keys = ON');
export const db = drizzle(sqlite, { schema });
