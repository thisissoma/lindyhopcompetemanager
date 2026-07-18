// 최초 오거나이저 지정 / 잠김 복구용. 휴대폰번호로 계정의 역할을 바꾼다.
// 사용법: npm run make-organizer <휴대폰번호> [organizer|staff|participant]
//   예) npm run make-organizer 01011112222
//   배포 환경: DATABASE_PATH=/data/compete.db npm run make-organizer 010...
import Database from 'better-sqlite3';

const phoneArg = process.argv[2];
const role = process.argv[3] ?? 'organizer';

if (!phoneArg) {
  console.error('사용법: npm run make-organizer <휴대폰번호> [organizer|staff|participant]');
  process.exit(1);
}
if (!['organizer', 'staff', 'participant'].includes(role)) {
  console.error('role은 organizer | staff | participant 중 하나여야 합니다.');
  process.exit(1);
}

const phone = phoneArg.replace(/\D/g, ''); // 숫자만(저장 형식과 일치)
const dbPath = process.env.DATABASE_PATH ?? 'data/compete.db';
const db = new Database(dbPath);

const user = db.prepare('select id, nickname, role from users where phone = ?').get(phone);
if (!user) {
  console.error(`해당 휴대폰번호(${phone})로 가입된 계정이 없습니다. 먼저 /signup 으로 가입한 뒤 실행하세요.`);
  process.exit(1);
}

db.prepare('update users set role = ? where id = ?').run(role, user.id);
console.log(`✅ ${user.nickname} (${phone}) 역할 변경: ${user.role} → ${role}`);
