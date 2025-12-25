# 관리자 관리 페이지 설계 문서

## 1. 개요

관리자 계정을 관리하고 접속 기록을 추적하는 기능을 제공합니다. 권한 관리 기능은 포함하지 않으며, 기본적인 관리자 정보(아이디, 비밀번호, 이름)와 접속 기록 관리에 중점을 둡니다.

## 2. 데이터 모델 (Firestore)

### 2.1 Admin 컬렉션 (`admins`)

관리자 계정 정보를 저장합니다.

```typescript
interface Admin {
  id?: string; // Firestore 문서 ID
  username: string; // 로그인 아이디 (고유, 소문자)
  password: string; // 해시된 비밀번호 (bcrypt)
  name: string; // 관리자 이름
  enabled: boolean; // 활성화 여부 (기본값: true)
  createdAt: Date; // 생성일시
  updatedAt: Date; // 수정일시
  lastLoginAt?: Date; // 마지막 로그인 일시
  createdBy?: string; // 생성한 관리자 ID (최초 관리자는 null)
}
```

**인덱스:**

- `username` (고유 인덱스)
- `enabled` (복합 인덱스: enabled + createdAt)

### 2.2 AdminLoginLog 컬렉션 (`adminLoginLogs`)

관리자 접속 기록을 저장합니다.

```typescript
interface AdminLoginLog {
  id?: string; // Firestore 문서 ID
  adminId: string; // 관리자 ID (admins 컬렉션 참조)
  username: string; // 로그인 시도한 아이디 (인덱싱용)
  ipAddress?: string; // 접속 IP 주소
  userAgent?: string; // 브라우저 정보
  success: boolean; // 로그인 성공 여부
  failureReason?: string; // 실패 사유 (success=false일 때)
  createdAt: Date; // 접속 시도 일시
}
```

**인덱스:**

- `adminId` + `createdAt` (복합 인덱스, 내림차순)
- `username` + `createdAt` (복합 인덱스, 내림차순)
- `success` + `createdAt` (복합 인덱스, 내림차순)

## 3. 기능 요구사항

### 3.1 관리자 목록 페이지 (`/admins`)

**기능:**

- 관리자 목록을 테이블 형태로 표시
- 검색 기능 (이름, 아이디)
- 정렬 기능 (생성일, 마지막 로그인)
- 관리자 추가 버튼
- 각 관리자별 액션 버튼 (수정, 삭제(비활성화), 접속 기록 보기)

**표시 컬럼:**

- 이름 (name)
- 아이디 (username)
- 활성화 여부 (enabled) - 배지 형태로 표시
- 마지막 로그인 (lastLoginAt) - "YYYY-MM-DD HH:mm" 형식
- 생성일 (createdAt) - "YYYY-MM-DD HH:mm" 형식
- 액션 (수정, 삭제, 접속 기록)

**UI 구성:**

```
[검색 입력] [검색 버튼] [초기화 버튼]                    [관리자 추가 버튼]

┌─────────────────────────────────────────────────────────────────┐
│ 이름    │ 아이디 │ 활성화 │ 마지막 로그인 │ 생성일 │ 액션      │
├─────────────────────────────────────────────────────────────────┤
│ 홍길동  │ admin  │ 활성   │ 2025-01-15   │ ...    │ [수정][삭제][기록] │
│ 김철수  │ user1  │ 비활성 │ -            │ ...    │ [수정][삭제][기록] │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 관리자 추가 페이지 (`/admins/new`)

**기능:**

- 새로운 관리자 계정 생성
- 아이디 중복 체크
- 비밀번호 강도 검사
- 비밀번호 해시화 후 저장

**폼 필드:**

- 아이디 (username)
  - 필수 입력
  - 영문, 숫자, 언더스코어(\_)만 허용
  - 3-20자
  - 중복 체크 (실시간 또는 저장 시)
  - 소문자로 자동 변환
- 비밀번호 (password)
  - 필수 입력
  - 최소 8자
  - 영문, 숫자, 특수문자 조합 권장
- 비밀번호 확인 (passwordConfirm)
  - 필수 입력
  - 비밀번호와 일치 여부 확인
- 이름 (name)
  - 필수 입력
  - 1-50자
- 활성화 여부 (enabled)
  - 체크박스
  - 기본값: true

**유효성 검사:**

- 아이디: 중복 체크 (Firestore 쿼리)
- 비밀번호: 최소 8자, 강도 검사 (필수사항)
- 비밀번호 확인: 일치 여부

### 3.3 관리자 수정 페이지 (`/admins/[id]`)

**기능:**

- 기존 관리자 정보 수정
- 아이디는 수정 불가 (읽기 전용)
- 비밀번호는 선택적 수정 (변경하지 않으면 기존 비밀번호 유지)
- 활성화/비활성화 토글

**폼 필드:**

- 아이디 (username) - 읽기 전용
- 비밀번호 (password) - 선택 입력
  - 비워두면 기존 비밀번호 유지
  - 입력 시 비밀번호 변경
- 비밀번호 확인 (passwordConfirm) - 비밀번호 입력 시에만 필수
- 이름 (name) - 수정 가능
- 활성화 여부 (enabled) - 수정 가능

**유효성 검사:**

- 비밀번호 입력 시: 최소 8자, 비밀번호 확인 일치

### 3.4 접속 기록 페이지 (`/admins/[id]/logs`)

**기능:**

- 특정 관리자의 접속 기록 목록 표시
- 필터링 (성공/실패, 기간)
- 페이지네이션

**표시 컬럼:**

- 일시 (createdAt) - "YYYY-MM-DD HH:mm:ss" 형식
- IP 주소 (ipAddress)
- 브라우저 정보 (userAgent) - 간략화된 형태
- 성공 여부 (success) - 배지 형태
- 실패 사유 (failureReason) - 실패 시에만 표시

**필터 옵션:**

- 성공/실패 여부 (전체, 성공, 실패)
- 기간 선택 (오늘, 최근 7일, 최근 30일, 전체)

**UI 구성:**

```
[← 목록으로]                    관리자 접속 기록: 홍길동 (admin)

[성공/실패 필터] [기간 필터] [검색]

┌─────────────────────────────────────────────────────────────────┐
│ 일시              │ IP 주소      │ 브라우저    │ 성공 │ 실패 사유 │
├─────────────────────────────────────────────────────────────────┤
│ 2025-01-15 14:30 │ 192.168.0.1  │ Chrome 120  │ 성공 │ -         │
│ 2025-01-15 10:15 │ 192.168.0.1  │ Chrome 120  │ 실패 │ 비밀번호 오류 │
└─────────────────────────────────────────────────────────────────┘

[이전] [1] [2] [3] [다음]
```

### 3.5 로그인 API 수정 (`/api/login`)

**기존 동작:**

- 환경변수 기반 Basic Auth
- 쿠키에 username:password base64 저장

**수정 후 동작:**

1. Firestore에서 `username`으로 관리자 조회
2. 관리자가 존재하고 `enabled === true`인지 확인
3. 비밀번호 검증 (bcrypt.compare)
4. 로그인 성공 시:
   - `lastLoginAt` 업데이트
   - 접속 기록 생성 (`adminLoginLogs` 컬렉션)
   - 쿠키에 관리자 ID 저장 (기존 방식 유지 또는 JWT 토큰)
5. 로그인 실패 시:
   - 접속 기록 생성 (success: false, failureReason 포함)
   - 에러 응답 반환

**요청 형식:**

```json
{
  "username": "admin",
  "password": "password123"
}
```

**성공 응답:**

```json
{
  "success": true,
  "admin": {
    "id": "admin-id",
    "username": "admin",
    "name": "홍길동"
  }
}
```

**실패 응답:**

```json
{
  "success": false,
  "error": "사용자명 또는 비밀번호가 올바르지 않습니다."
}
```

### 3.6 Middleware 수정 (`middleware.ts`)

**기존 동작:**

- 환경변수 기반 Basic Auth 검증

**수정 후 동작:**

1. 쿠키에서 관리자 ID 또는 토큰 확인
2. Firestore에서 관리자 조회
3. 관리자가 존재하고 `enabled === true`인지 확인
4. 인증 성공 시 요청 진행
5. 인증 실패 시 `/login`으로 리다이렉트

## 4. 파일 구조

```
apps/admin/
├── app/
│   ├── admins/
│   │   ├── page.tsx                    # 관리자 목록
│   │   ├── new/
│   │   │   └── page.tsx                # 관리자 추가
│   │   └── [id]/
│   │       ├── page.tsx                # 관리자 수정
│   │       └── logs/
│   │           └── page.tsx            # 접속 기록
│   └── api/
│       ├── login/
│       │   └── route.ts                 # 로그인 API (수정)
│       └── admins/
│           ├── route.ts                # 관리자 목록 조회, 추가 API
│           └── [id]/
│               ├── route.ts            # 관리자 단일 조회, 수정, 삭제 API
│               └── logs/
│                   └── route.ts        # 접속 기록 조회 API
├── lib/
│   ├── admin/
│   │   ├── adminService.ts             # 관리자 CRUD 서비스
│   │   ├── adminLoginLogService.ts     # 접속 기록 서비스
│   │   └── types.ts                    # 타입 정의 추가
│   └── utils/
│       └── password.ts                 # 비밀번호 해싱 유틸리티
└── components/
    └── admins/
        ├── AdminList.tsx                # 관리자 목록 컴포넌트
        ├── AdminForm.tsx                # 관리자 추가/수정 폼
        └── AdminLoginLogList.tsx        # 접속 기록 목록
```

## 5. 보안 고려사항

### 5.1 비밀번호 관리

- **해싱 알고리즘**: bcrypt 사용 (비용 10)
- **평문 저장 금지**: 절대 평문 비밀번호를 Firestore에 저장하지 않음
- **비밀번호 변경**: 수정 페이지에서만 변경 가능, 변경 시 해시화 후 저장

### 5.2 로그인 보안

- **로그인 실패 기록**: 무차별 대입 공격 방지를 위해 실패 기록 저장
- **IP 주소 기록**: 보안 이슈 발생 시 추적 가능하도록 IP 주소 기록
- **세션 관리**: 쿠키 기반 인증 유지 (향후 JWT 토큰으로 전환 고려)

### 5.3 관리자 관리

- **삭제 대신 비활성화**: 관리자 삭제 시 물리적 삭제 대신 `enabled: false`로 비활성화
- **최소 1명 유지**: 마지막 활성 관리자는 비활성화 불가 (선택사항)
- **생성자 추적**: `createdBy` 필드로 관리자 생성 이력 추적

### 5.4 접근 제어

- **인증된 사용자만 접근**: 모든 관리자 관리 페이지는 인증 필요
- **API 보안**: 모든 API 엔드포인트는 인증 검증

## 6. 구현 순서

### Phase 1: 기본 인프라 구축

1. 타입 정의 추가 (`lib/admin/types.ts`)
   - `Admin` 인터페이스
   - `AdminLoginLog` 인터페이스
2. 비밀번호 해싱 유틸리티 (`lib/utils/password.ts`)
   - `hashPassword(password: string): Promise<string>`
   - `comparePassword(password: string, hash: string): Promise<boolean>`
3. Admin 서비스 (`lib/admin/adminService.ts`)
   - `getAdmins()`: 관리자 목록 조회
   - `getAdminById(id: string)`: 관리자 단일 조회
   - `getAdminByUsername(username: string)`: 아이디로 조회
   - `createAdmin(data: CreateAdminData)`: 관리자 생성
   - `updateAdmin(id: string, data: UpdateAdminData)`: 관리자 수정
   - `deleteAdmin(id: string)`: 관리자 비활성화 (enabled: false)
   - `checkUsernameExists(username: string)`: 아이디 중복 체크

### Phase 2: 접속 기록 서비스

4. AdminLoginLog 서비스 (`lib/admin/adminLoginLogService.ts`)
   - `createLoginLog(data: CreateLoginLogData)`: 접속 기록 생성
   - `getLoginLogsByAdminId(adminId: string, filters?: LoginLogFilters)`: 관리자별 접속 기록 조회
   - `getLoginLogsByUsername(username: string, filters?: LoginLogFilters)`: 아이디별 접속 기록 조회

### Phase 3: API 엔드포인트

5. 관리자 API (`app/api/admins/route.ts`)
   - `GET`: 관리자 목록 조회
   - `POST`: 관리자 생성
6. 관리자 단일 API (`app/api/admins/[id]/route.ts`)
   - `GET`: 관리자 단일 조회
   - `PUT`: 관리자 수정
   - `DELETE`: 관리자 비활성화
7. 접속 기록 API (`app/api/admins/[id]/logs/route.ts`)
   - `GET`: 접속 기록 조회 (필터링, 페이지네이션)
8. 로그인 API 수정 (`app/api/login/route.ts`)
   - Firestore 기반 인증으로 변경
   - 접속 기록 생성 로직 추가

### Phase 4: UI 컴포넌트

9. 관리자 목록 컴포넌트 (`components/admins/AdminList.tsx`)
   - 테이블 형태 목록 표시
   - 검색, 정렬 기능
   - 액션 버튼 (수정, 삭제, 접속 기록)
10. 관리자 폼 컴포넌트 (`components/admins/AdminForm.tsx`)
    - 추가/수정 공통 폼
    - 유효성 검사
    - 아이디 중복 체크
11. 접속 기록 목록 컴포넌트 (`components/admins/AdminLoginLogList.tsx`)
    - 접속 기록 테이블
    - 필터링 UI
    - 페이지네이션

### Phase 5: 페이지 구현

12. 관리자 목록 페이지 (`app/admins/page.tsx`)
13. 관리자 추가 페이지 (`app/admins/new/page.tsx`)
14. 관리자 수정 페이지 (`app/admins/[id]/page.tsx`)
15. 접속 기록 페이지 (`app/admins/[id]/logs/page.tsx`)

### Phase 6: 인증 시스템 통합

16. Middleware 수정 (`middleware.ts`)
    - Firestore 기반 인증으로 변경
17. Sidebar 메뉴 추가 (`components/Sidebar.tsx`)
    - "관리자 관리" 메뉴 추가

### Phase 7: 초기 관리자 생성

18. 초기 관리자 생성 스크립트 또는 수동 생성 가이드
    - 최초 1명의 관리자는 수동으로 Firestore에 추가

## 7. 추가 고려사항

### 7.1 초기 관리자 생성

- **방법 1**: 수동으로 Firestore에 추가
  - 콘솔에서 직접 문서 생성
  - 비밀번호는 bcrypt로 해시화하여 저장
- **방법 2**: 초기화 스크립트 제공
  - `scripts/createInitialAdmin.ts` 생성
  - 환경변수로 초기 관리자 정보 설정
  - `pnpm run create-admin` 명령어로 실행

### 7.2 비밀번호 변경 기능 (선택사항)

- 관리자가 자신의 비밀번호를 변경할 수 있는 기능
- `/profile` 또는 `/admins/[id]/change-password` 페이지
- 현재 비밀번호 확인 후 새 비밀번호 설정

### 7.3 세션 관리 개선 (향후)

- 현재: 쿠키 기반 인증 (username:password base64)
- 향후: JWT 토큰 기반 인증으로 전환 고려
  - 토큰에 관리자 ID 포함
  - 만료 시간 설정
  - 리프레시 토큰 지원

### 7.4 로그인 실패 제한 (향후)

- 일정 횟수 이상 실패 시 일시적 계정 잠금
- IP 기반 차단 기능
- 관리자에게 알림 기능

### 7.5 감사 로그 (향후)

- 관리자 생성/수정/삭제 기록
- 중요한 작업(페이지 게시, 메뉴 변경 등) 기록
- 별도 `adminAuditLogs` 컬렉션으로 관리

## 8. 의존성 패키지

```json
{
  "dependencies": {
    "bcrypt": "^5.1.1",
    "@types/bcrypt": "^5.0.2"
  }
}
```

## 9. Firestore 보안 규칙 (참고)

```javascript
match /admins/{adminId} {
  // 인증된 관리자만 읽기 가능
  allow read: if request.auth != null;
  // 생성: 인증된 관리자만 가능
  allow create: if request.auth != null;
  // 수정: 본인 또는 인증된 관리자만 가능
  allow update: if request.auth != null &&
    (request.auth.uid == adminId ||
     get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.enabled == true);
  // 삭제: 비활성화만 가능 (물리적 삭제 불가)
  allow delete: if false;
}

match /adminLoginLogs/{logId} {
  // 읽기: 인증된 관리자만 가능
  allow read: if request.auth != null;
  // 생성: 서버에서만 가능 (API 라우트)
  allow create: if request.auth != null;
  // 수정/삭제: 불가
  allow update, delete: if false;
}
```

## 10. 테스트 시나리오

### 10.1 관리자 생성

1. 관리자 추가 페이지 접속
2. 아이디, 비밀번호, 이름 입력
3. 중복 아이디 입력 시 에러 표시 확인
4. 관리자 생성 성공 확인
5. 목록에서 새 관리자 확인

### 10.2 로그인

1. 로그인 페이지에서 새 관리자로 로그인
2. 로그인 성공 확인
3. 접속 기록에 성공 로그 확인
4. 관리자 정보에서 `lastLoginAt` 업데이트 확인

### 10.3 관리자 수정

1. 관리자 수정 페이지 접속
2. 이름 변경
3. 비밀번호 변경 (선택)
4. 저장 후 변경사항 확인

### 10.4 관리자 비활성화

1. 관리자 목록에서 비활성화 버튼 클릭
2. 확인 후 비활성화
3. 비활성화된 관리자로 로그인 시도 → 실패 확인
4. 접속 기록에 실패 로그 확인

### 10.5 접속 기록 조회

1. 관리자 접속 기록 페이지 접속
2. 성공/실패 필터 확인
3. 기간 필터 확인
4. 페이지네이션 확인

---

**문서 버전**: 1.0  
**작성일**: 2025-01-15  
**최종 수정일**: 2025-01-15
