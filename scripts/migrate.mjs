// 프로덕션 마이그레이션: 런타임 의존성(better-sqlite3, drizzle-orm)만 사용.
// drizzle-kit(devDependency)이 없는 배포 환경에서도 동작한다. Railway 시작 커맨드에서 실행.
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'fs';
import path from 'path';

const dbPath = process.env.DATABASE_PATH ?? 'data/compete.db';
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);
migrate(drizzle(sqlite), { migrationsFolder: './drizzle' });
console.log('migrations applied to', dbPath);
