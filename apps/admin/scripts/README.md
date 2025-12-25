# 관리 스크립트

이 폴더에는 Firestore 데이터 관리를 위한 유틸리티 스크립트가 포함되어 있습니다.

## 스크립트 목록

1. **createInitialAdmin.ts** - 초기 관리자 계정 생성
2. **migrateCreatedBy.ts** - 기존 데이터에 createdBy, updatedBy 필드 추가

---

# 1. 초기 관리자 생성 스크립트

## 사용 방법

### 방법 1: 환경 변수 사용

`.env.local` 파일을 생성하거나 환경 변수를 설정:

```bash
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=yourpassword
INITIAL_ADMIN_NAME=홍길동
```

그리고 실행:

```bash
cd apps/admin
pnpm create-admin
```

### 방법 2: 명령줄 인자 사용

```bash
cd apps/admin
pnpm create-admin <아이디> <비밀번호> <이름>
```

예시:

```bash
pnpm create-admin admin admin1234 "홍길동"
```

### 방법 3: 환경 변수와 명령줄 인자 조합

환경 변수로 기본값 설정 후, 명령줄 인자로 오버라이드:

```bash
INITIAL_ADMIN_USERNAME=admin pnpm create-admin admin mypassword "관리자"
```

## 기본값

- 아이디: `admin`
- 비밀번호: `admin1234`
- 이름: `관리자`

## 주의사항

1. **보안**: 생성된 비밀번호를 안전하게 보관하세요.
2. **중복 체크**: 이미 존재하는 아이디로는 생성할 수 없습니다.
3. **비밀번호 해싱**: 비밀번호는 bcrypt로 해시화되어 저장됩니다.
4. **최초 관리자**: `createdBy` 필드는 `null`로 설정됩니다.

## 에러 처리

- 아이디가 이미 존재하는 경우: 에러 메시지 출력 후 종료
- Firebase 연결 실패: 에러 메시지 출력 후 종료
- 필수 환경 변수 누락: 에러 메시지 출력 후 종료

## 예시 출력

```
[Firebase] 앱 초기화 완료
[Firebase] Firestore 초기화 완료
비밀번호 해시화 중...
관리자 계정 생성 중...

✅ 초기 관리자 계정이 성공적으로 생성되었습니다!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
관리자 ID: abc123def456
아이디: admin
이름: 홍길동
비밀번호: admin1234
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  보안을 위해 비밀번호를 안전한 곳에 보관하세요.
   환경 변수나 명령줄에서 제공한 경우 즉시 변경하는 것을 권장합니다.
```

---

# 2. createdBy/updatedBy 마이그레이션 스크립트

이 스크립트는 기존 페이지, 메뉴, FAQ 카테고리 데이터에 `createdBy`와 `updatedBy` 필드를 추가합니다.

## 사용 방법

### 방법 1: 환경 변수 사용

`.env.local` 파일에 기본 관리자 ID 설정:

```bash
DEFAULT_ADMIN_ID=your-admin-id-here
```

그리고 실행:

```bash
cd apps/admin
npx tsx scripts/migrateCreatedBy.ts
```

### 방법 2: 명령줄 인자 사용

```bash
cd apps/admin
npx tsx scripts/migrateCreatedBy.ts <관리자 문서ID>
```

예시:

```bash
npx tsx scripts/migrateCreatedBy.ts BPPXQZWZ0bmv2gE5xEIs
```

## 관리자 ID 확인 방법

관리자 ID는 다음 방법으로 확인할 수 있습니다:

1. **관리자 관리 페이지**: `/admins`에서 관리자 목록 확인
2. **API**: `GET /api/admins` 호출하여 관리자 목록 확인
3. **Firebase Console**: Firestore의 `admins` 컬렉션에서 문서 ID 확인

## 마이그레이션 대상

- **pages** 컬렉션: 모든 페이지 문서
- **menus** 컬렉션: 모든 메뉴 문서
- **faqCategories** 컬렉션: 모든 FAQ 카테고리 문서

## 동작 방식

1. 각 컬렉션의 모든 문서를 순회
2. `createdBy` 필드가 없으면 기본 관리자 ID 설정
3. `updatedBy` 필드가 없으면 `createdBy` 값으로 설정 (또는 기본 관리자 ID)

## 주의사항

1. **백업**: 마이그레이션 실행 전 Firestore 데이터 백업을 권장합니다.
2. **기본 관리자**: 마이그레이션에 사용할 기본 관리자 ID는 실제 존재하는 관리자여야 합니다.
3. **기존 데이터**: 이미 `createdBy`와 `updatedBy` 필드가 있는 문서는 스킵됩니다.
4. **원자성**: 각 문서는 개별적으로 업데이트되므로, 일부만 실패해도 나머지는 업데이트됩니다.

## 예시 출력

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Firestore 마이그레이션 시작
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
기본 관리자 ID: BPPXQZWZ0bmv2gE5xEIs
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Firebase] 앱 초기화 완료
[Firebase] Firestore 초기화 완료

📋 페이지 마이그레이션 시작...
  ✅ [1] 페이지 업데이트: slug: administrator... ID: abc123
     업데이트 필드: createdBy, updatedBy
  ✅ [2] 페이지 업데이트: slug: home... ID: def456
     업데이트 필드: createdBy, updatedBy

📊 페이지 마이그레이션 완료
   ✅ 업데이트된 항목: 15개
   ⏭️  스킵된 항목: 0개
   ❌ 실패한 항목: 0개
   📋 전체 항목: 15개

📋 메뉴 마이그레이션 시작...
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 전체 마이그레이션 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 업데이트된 항목: 65개
⏭️  스킵된 항목: 0개
❌ 실패한 항목: 0개
📋 전체 항목: 65개
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ 모든 마이그레이션이 성공적으로 완료되었습니다!
```

## 에러 처리

- 관리자 ID가 없는 경우: 에러 메시지 출력 후 종료
- Firebase 연결 실패: 에러 메시지 출력 후 종료
- 개별 문서 업데이트 실패: 에러 로그 출력 후 계속 진행
