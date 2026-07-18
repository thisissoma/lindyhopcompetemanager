// 콘솔에서 특정 계정의 비밀번호를 변경. (운영자 복구용)
// 사용법: npm run set-password <휴대폰번호> <새비밀번호>
//   예) npm run set-password 01011112222 newpass1234
//   배포 환경: DATABASE_PATH=/data/compete.db npm run set-password 010... newpass1234
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const phoneArg = process.argv[2];
const password = process.argv[3];

if (!phoneArg || !password) {
  console.error('사용법: npm run set-password <휴대폰번호> <새비밀번호>');
  process.exit(1);
}
if (password.length < 8) {
  console.error('비밀번호는 8자 이상이어야 합니다.');
  process.exit(1);
}

const phone = phoneArg.replace(/\D/g, ''); // 숫자만(저장 형식과 일치)
const dbPath = process.env.DATABASE_PATH ?? 'data/compete.db';
const db = new Database(dbPath);

const user = db.prepare('select id, nickname from users where phone = ?').get(phone);
if (!user) {
  console.error(`해당 휴대폰번호(${phone})로 가입된 계정이 없습니다.`);
  process.exit(1);
}

db.prepare('update users set password_hash = ? where id = ?').run(bcrypt.hashSync(password, 10), user.id);
console.log(`✅ ${user.nickname} (${phone}) 비밀번호를 변경했습니다.`);
