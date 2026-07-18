# 배포 안내 (Railway)

로컬 개발/테스트는 `npm run dev` / `npm test`. 아래는 실서비스 배포 절차.

## 1. GitHub 저장소 (사용자가 직접 — 이 환경엔 gh CLI 미설치)

```bash
# 옵션 A) gh CLI 설치되어 있으면
gh repo create competemanager --private --source=. --push

# 옵션 B) 웹에서 빈 저장소 만든 뒤
git remote add origin https://github.com/<사용자>/competemanager.git
git push -u origin main
```

푸시하면 GitHub Actions(`.github/workflows/test.yml`)가 `npm test` + `npm run build`를 실행한다(배포 전 안전망).

## 2. Railway 프로젝트

1. Railway → **New Project → Deploy from GitHub repo** → 위 저장소 선택. 이후 푸시마다 자동 배포.
2. 서비스에 **Volume 추가**, 마운트 경로 `/data`.
   - ⚠️ 볼륨이 없으면 재배포 때마다 SQLite DB(참가자 데이터)가 초기화된다. 반드시 추가.
3. 서비스 **Variables**에 `DATABASE_PATH=/data/compete.db` 설정.
4. 시작 커맨드는 `railway.json`에 정의됨: `npm run migrate && npm start`
   - `npm run migrate`는 런타임 의존성만 쓰는 `scripts/migrate.mjs`로 `drizzle/`의 마이그레이션을 적용(배포마다 안전하게 최신 스키마 반영).

## 3. 확인

- Railway가 제공하는 URL(도메인 아직 없음)로 접속해 가입/로그인 동작 확인.
- 재배포 후에도 데이터가 남아있는지(=볼륨이 제대로 붙었는지) 확인.

## 최초 운영진 계정 만들기

가입은 전부 `participant`로 생성된다. **먼저 `/signup`으로 가입한 뒤**, 그 휴대폰번호를 최초 오거나이저로 지정한다.
(이후 오거나이저는 앱 내 `/admin/users` "운영진 계정 생성"·역할 변경으로 만들 수 있다.)

권장 — 스크립트 사용:

```bash
# 로컬
npm run make-organizer 01011112222
# Railway (서비스 셸, 볼륨 DB)
DATABASE_PATH=/data/compete.db npm run make-organizer 01011112222
# staff로 지정하려면 두 번째 인자: npm run make-organizer 010... staff
```

또는 직접 SQL: `UPDATE users SET role='organizer' WHERE phone='01011112222';`

참고: **마지막 오거나이저는 앱에서 강등 불가**(오거나이저 0명 잠김 방지). 잠기면 위 스크립트로 복구한다.

## 비밀번호 콘솔 변경 (복구용)

```bash
npm run set-password 01011112222 새비밀번호        # 로컬
DATABASE_PATH=/data/compete.db npm run set-password 01011112222 새비밀번호   # Railway
```
