# Stibee API 연동 설계서 (atSignal — Firestore 기반 구독자 동기화)

**목적:** atSignal 웹사이트에서 수집한 구독자 정보를 Firestore에 저장하고, Stibee의 스탠다드 요금제(Subscriber API 활용)를 통해 구독자를 등록·수정·조회하도록 안전하고 확장 가능한 연동 설계

---

# 1. 목표 요약

- atSignal 사이트에서 뉴스레터 구독 폼(또는 회원가입)으로 모은 구독자 정보를 Firestore에 저장.
- Firestore에 저장된 데이터를 기반으로 Stibee Subscriber API를 호출해 Stibee 주소록(list)에 구독자를 추가/수정/조회/삭제.
- 스탠다드 요금제 제약을 준수(템플릿 생성/발송 등은 Stibee UI에서 처리).
- 동기화 신뢰성 보장(재시도/에러 로그), 개인정보 보호(암호화·접근제어).

---

# 2. 아키텍처 개요

```
[사용자 브라우저] --(subscribe)-> [atSignal Web (frontend)]
                                    │
                                    ▼
                          [Firestore (subscribers collection)]
                                    │
                                    ▼ (Cloud Function / Backend Worker)
                          [atSignal Backend Sync Service]
                                    │  (Stibee Subscriber API)
                                    ▼
                             [Stibee API Server]

```

구성 요소 설명

- **Frontend**: 구독 폼(성함, 소속, 이메일, 휴대폰번호), 개인정보 수집 동의, recaptcha(선택)
- **Firestore**: 구독자 원본 소스(소유권), 변경 이력 저장
- **Backend Sync Service**: Cloud Functions / Cloud Run / Node.js 서버. Firestore 트리거(새 문서 생성/수정/삭제)로 동작해 Stibee API 호출
- **Stibee**: 주소록(listId)에 구독자 등록/수정

---

# 3. 데이터 모델 (Firestore)

컬렉션: `subscribers`

문서 예시 (`subscribers/{uid}`)

```json
{
  "uid": "uuid-1234", // Firestore 문서ID 또는 사용자 고유ID
  "email": "user@example.com",
  "name": "홍길동",
  "mobile_phone": "010-1234-5678",
  "company": "logbase",
  "status": "pending|subscribed|unsubscribed",
  "stibee": {
    "listId": "<STIBEE_LIST_ID>",
    "subscriberId": "<stibee-subscriber-id>",
    "lastSyncedAt": "2025-11-20T12:00:00Z",
    "lastResult": { "code": 200, "message": "OK" }
  },
  "consent": {
    "agreedAt": "2025-11-20T11:59:00Z",
    "source": "website:newsletter"
  },
  "createdAt": "2025-11-20T11:59:00Z",
  "updatedAt": "2025-11-20T11:59:00Z"
}
```

보관 정책

- 이메일·휴대폰 등 PII는 최소 **필드 단위 AES-256 암호화**로 저장하고, 키는 Cloud KMS(또는 Secret Manager)로 관리한다.
- 관리자 UI에서 복호화가 필요할 때만 API를 통해 복호화하며 접근 로그를 남긴다.
- PII 접근 권한을 서비스 계정/운영자 로그 수준으로 제한.

---

## 3-1. 입력 스키마 (구독 폼)

| 필드명           | 설명                   | 필수 여부 | 검증 규칙                                                 |
| ---------------- | ---------------------- | --------- | --------------------------------------------------------- |
| `name`           | 구독자 성함            | 필수      | 공백 제거 후 최소 2자, 한글/영문/공백만 허용              |
| `company`        | 소속/회사명            | 필수      | 최소 2자, 일반 텍스트(특수문자 제한)                      |
| `email`          | 이메일 주소            | 필수      | RFC 5322 기반 이메일 형식 검증, 소문자 normalize          |
| `phone`          | 휴대폰 번호            | 필수      | `010-0000-0000` 또는 `01000000000` 패턴 허용, 숫자만 저장 |
| `privacyConsent` | 개인정보 처리방침 동의 | 필수      | `true` 값만 허용, 동의 일시(`consent.agreedAt`) 저장      |

> 모든 필드는 서버에서도 재검증하며, 유효성 실패 시 명확한 오류 메시지를 반환한다.

---

# 4. API 연동 상세

## 인증

- **환경변수**: STIBEE_API_KEY (워크스페이스 단위 API 키)
- 키는 비밀저장소(Secrets Manager) 또는 Cloud Run 환경변수로 설정
- HTTP 헤더에 `AccessToken: {STIBEE_API_KEY}` 포함

## 필수 설정 값 확인 방법

### STIBEE_API_KEY

- Stibee 관리자 페이지 → 설정 → API 키 메뉴에서 확인
- 워크스페이스 단위로 발급되는 API 키

### STIBEE_LIST_ID (주소록 ID)

Stibee에서 리스트 ID를 확인하는 방법:

1. **주소록 관리 페이지에서 확인 (가장 일반적)**

   - Stibee 관리자 페이지 로그인
   - 좌측 메뉴에서 "주소록" 또는 "리스트" 클릭
   - 사용할 주소록 선택
   - 주소록 상세 페이지 URL에서 확인
     - URL 예시: `https://stibee.com/lists/12345678`
     - 여기서 `12345678`이 LIST_ID입니다.

2. **브라우저 개발자 도구 사용**

   - 주소록 관리 페이지 접속
   - F12로 개발자 도구 열기
   - Network 탭에서 API 호출 확인
   - API 응답이나 요청 URL에서 `listId` 또는 `list_id` 확인

3. **Stibee API로 확인**
   - 인증 확인 엔드포인트: `GET https://api.stibee.com/v2/auth-check`
   - 주소록 목록 조회 API 사용 (Stibee API 문서 참조)

> **참고**: LIST_ID를 확인하지 못하는 경우 Stibee 고객지원에 문의하거나 API 문서를 참조하세요.

## 주요 엔드포인트 매핑 (v2 기준)

- 구독자 추가
  - `POST https://api.stibee.com/v2/lists/{id}/subscribers`
- 구독자 목록 조회
  - `GET https://api.stibee.com/v2/lists/{id}/subscribers`
- 구독자 삭제 (일괄)
  - `DELETE https://api.stibee.com/v2/lists/{id}/subscribers`
- 구독자 상세 수정
  - `PUT https://api.stibee.com/v2/lists/{id}/subscribers/{subscriberId}`
- 구독자 수신거부 처리
  - `POST https://api.stibee.com/v2/lists/{id}/subscribers/{subscriberEmail}/unsubscribe`
- 구독자 그룹 배정/해제
  - `POST https://api.stibee.com/v2/lists/{id}/groups/{groupId}/assign`
  - `POST https://api.stibee.com/v2/lists/{id}/groups/{groupId}/release`
- 구독자 대량 추가
  - `POST https://api.stibee.com/v2/lists/{id}/subscribers/batch`
- 인증 확인
  - `GET https://api.stibee.com/v2/auth-check`

> 최신 목록은 [Stibee API 문서](https://developers.stibee.com/docs#description/%EA%B0%9C%EC%9A%94)에서 v2 OpenAPI를 기준으로 확인한다.

## 요청 예시 (Node.js / fetch)

### addSubscriber

```jsx
// 환경: Node.js
const fetch = require("node-fetch");

async function addSubscriber(listId, payload, apiKey) {
  const url = `https://api.stibee.com/v1/lists/${listId}/subscribers`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      AccessToken: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ subscribers: [payload] }),
  });
  return res.json();
}

// payload example
// { email: 'user@example.com', name: '홍길동', memo: 'website sign-up' }
```

### automation (트랜잭션/단건 이메일) 호출 예시

```jsx
// 자동 이메일 API를 사용할 경우, 별도 엔드포인트 및 요청제한(초당 3회)를 확인
```

---

# 5. 동기화 흐름 (시퀀스)

## A. 실시간 동기화 (권장)

1. 사용자: 웹사이트에서 구독 신청(이메일 입력 + 약관 동의)
2. Frontend: Firestore에 `subscribers/{uid}` 문서 생성 (status: pending)
3. Firestore 트리거(CF): `onCreate` 이벤트로 백엔드 Sync 함수 실행
4. Sync 함수: Firestore 문서의 정보를 읽어 Stibee `POST /lists/{listId}/subscribers` 호출
   - 성공 시: Firestore 문서에 `stibee.subscriberId`, `stibee.lastSyncedAt`, `status: subscribed` 업데이트
   - 실패 시: `stibee.lastResult`에 에러 코드/메시지 저장, 재시도 큐(최대 3회)
5. 사용자에게는 즉시 "구독 신청 접수" 메시지 제공 (실제 발송 성공 여부는 백그라운드 처리)

## B. 수정(업데이트) 흐름

- Firestore `onUpdate` 트리거로 변경 감지 후 Stibee에 `update` 호출
- 이메일이 변경되면 기존 Stibee 레코드를 삭제 또는 이메일 변경 API 사용(문서 확인 필요)

## C. 삭제(구독 해지)

- Firestore `onDelete` 트리거 → Stibee `DELETE` 호출 (또는 구독 상태 변경 API)
- 수신거부 처리: Stibee에서 수신거부가 발생하면 Webhook(가능한 경우)을 사용해 Firestore 상태를 `unsubscribed`로 업데이트

## D. 초기 마이그레이션 / 배치 동기화

- 사이트 론칭 이전에 기존 DB를 Firestore로 마이그레이션한 뒤, 백엔드 배치 프로세스로 Stibee에 배치 등록
- 배치 시 초당 요청 제한을 고려해 throttling 적용(예: 100ms 간격 또는 병렬 3개 제한)

---

# 6. 실패 처리, 재시도 및 로깅

## 실패 정책 (절충안)

1. **Firestore 선 기록**: 사용자가 구독 신청 시 Firestore `subscribers` 문서에 `status=pending`으로 먼저 저장하고 요청 시각, 동의 정보 등을 남긴다.
2. **Stibee API 호출**: Cloud Function/백엔드에서 Firestore 문서를 읽어 Stibee 구독자 API를 호출한다.
3. **성공 시 업데이트**:
   - `status=subscribed`, `stibee.subscriberId`, `stibee.lastSyncedAt`, `stibee.lastResult` 등을 업데이트
4. **실패 시 처리**:
   - `status=error`로 변경하고 `stibee.lastResult`에 오류 코드/메시지 기록
   - Cloud Tasks / 재시도 큐에 등록해 최대 n회 재시도
   - 재시도 실패 시 운영 알림(슬랙/이메일)
5. **스티비 성공 후 Firestore 실패 대비**:
   - Firestore 업데이트 실패 시 재시도하거나 운영 알림 발송
   - 대비 로직 작성 (예: Cloud Functions 재실행, Dead-letter 큐 등)

## 로깅

- 연동 로그 컬렉션: `stibee_sync_logs`
  - 필드: `uid`, `listId`, `operation`, `requestPayload`, `responseCode`, `responseBody`, `attempts`, `timestamp`
- Rollbar / Sentry 연동 권장

---

# 7. 보안 및 환경 설정

## 필수 환경변수 설정

### 로컬 개발 환경

`.env` 또는 `.env.local` 파일 생성:

```env
STIBEE_API_KEY=your_api_key_here
STIBEE_LIST_ID=your_list_id_here
```

### Firebase Functions 배포 환경

**방법 1: Firebase Functions Config 사용**

```bash
firebase functions:config:set \
  stibee.api_key="your_api_key" \
  stibee.list_id="your_list_id"
```

**방법 2: 환경변수 사용 (권장)**

```bash
firebase functions:secrets:set STIBEE_API_KEY
firebase functions:secrets:set STIBEE_LIST_ID
```

### 선택 환경변수

- `STIBEE_API_BASE_URL`: 기본값 `https://api.stibee.com/v2` (변경 필요 시에만 설정)
- `SUBSCRIBERS_COLLECTION`: 기본값 `subscribers` (Firestore 컬렉션명 변경 필요 시에만 설정)

## 보안 정책

- **API Key 보관**: GCP Secret Manager / AWS Secrets Manager 사용 권장
- **네트워크**: HTTPS 강제
- **PII 보호**: Firestore 저장 시 이메일·휴대폰을 AES-256 등으로 암호화하고, 운영자 로그에는 마스킹된 값만 노출
- **접근 통제**: 서비스 계정 키만 Stibee 호출 허용, 로컬 개발시 별도의 dev API 키 사용
- **감사 로그**: 누가 어떤 구독자를 수정/동기화했는지 기록

---

# 8. 성능/요청 제한 고려사항

- Stibee 자동 이메일 API는 초당 3회 제한이 있으므로(트랜잭셔널 이메일의 경우) 자동 동기화 및 배치에서 초당 요청 수를 제한해야 함.
- Subscriber API에도 rate limit이 있을 수 있으니, 안전하게 **동시 호출 수를 3~5로 제한**하고, 실패 시 재시도 로직 적용.
- 배치 처리 시에는 큐(Cloud Tasks) 또는 워커(Cloud Run)로 throttling 관리.

---

# 9. 운영 및 모니터링

- 모니터링 항목
  - 동기화 성공률(%), 실패 건수, 평균 응답시간
  - API Key 사용량(일별 요청수)
  - 오류 유형(4xx vs 5xx)
- 알림
  - 동기화 실패가 연속 10건 이상 발생 시 슬랙/이메일 알림
- 매월 검토
  - 구독자 수 증감, 스팸/수신거부 비율
- **Webhook 기반 동기화**
  - Stibee 주소록 Webhook(https://help.stibee.com/hc/ko/articles/4756496712079-%EC%A3%BC%EC%86%8C%EB%A1%9D-%EC%9B%B9%ED%9B%85-Webhook-%EC%82%AC%EC%9A%A9%ED%95%98%EA%B8%B0)을 구독하여 구독자 정보가 Stibee에서 직접 수정/수신거부될 때 Firestore 상태를 자동 갱신한다.
  - Cloud Functions/Run 엔드포인트를 Webhook URL로 등록하고 이벤트 타입별로 Firestore의 `status`, `email`, `groups` 등을 동기화한다.
  - Webhook 실패 시 재시도 또는 Dead Letter Queue 처리, 보안(검증 토큰) 적용 필요.

---

# 10. 테스트 계획

- 단위 테스트: Stibee API 호출을 모킹하여 성공/실패/에러 응답 테스트
- 통합 테스트: Staging 계정의 Stibee 워크스페이스 사용
- 부하 테스트: 배치 등록 시 초당 호출 제한을 초과하지 않는지 검증
- 보안 테스트: API Key 누출 시 행동(리보크) 시나리오 테스트

---

# 11. 구독 신청 HTTP Endpoint (Firebase Functions)

- **Function 이름**: `subscribeNewsletterApi`
- **URL 예시**: `https://<region>-<project>.cloudfunctions.net/subscribeNewsletterApi`
- **메서드**: `POST`
- **요청 본문**

```json
{
  "name": "홍길동",
  "company": "Nethru",
  "email": "user@example.com",
  "phone": "010-1234-5678",
  "privacyConsent": true
}
```

- **성공 응답 (201)**

```json
{
  "id": "firestore-doc-id",
  "status": "subscribed"
}
```

- **에러 응답**
  - 400 `invalid-argument`: 필드 검증 실패
  - 502 `STIBEE_SYNC_FAILED`: Stibee API 오류
  - 500 `UNEXPECTED_ERROR`: 내부 오류

> 요청은 Firestore에 `status=pending`으로 저장된 뒤 Stibee API와 동기화되며, 결과는 문서의 `status`, `stibee.lastResult` 필드에 기록된다.

---

# 12. 향후 확장 제안

1. **템플릿 기반 자동 발송 연동**: 스티비 UI에서 만든 템플릿 ID를 DB에 매핑해서, 프로 요금제로 업그레이드 시 자동 템플릿 발송까지 확장
2. **Webhook 처리**: Stibee 발송 결과(수신거부, 반송 등)를 Webhook으로 받아 Firestore 상태 자동 갱신
3. **A/B 테스트 메타데이터 저장**: 캠페인 성과 비교를 위해 캠페인ID와 성과 지표 저장
4. **관리 UI**: 관리자 페이지에서 Stibee 리스트/템플릿 매핑, 동기화 상태 확인, 재동기화 버튼 제공

---

## 부록: 권장 코드 패턴 (Cloud Function 예시)

```jsx
// Cloud Function (Node.js) - Firestore onCreate trigger
const fetch = require("node-fetch");

exports.onSubscriberCreate = async (snap, context) => {
  const data = snap.data();
  const apiKey = process.env.STIBEE_API_KEY;
  const listId = process.env.STIBEE_LIST_ID; // 기본 list
  const payload = {
    email: data.email,
    name: data.name,
    memo: data.memo || "website",
  };

  try {
    const res = await fetch(
      `https://api.stibee.com/v1/lists/${listId}/subscribers`,
      {
        method: "POST",
        headers: { AccessToken: apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ subscribers: [payload] }),
      }
    );
    const body = await res.text();
    if (!res.ok) {
      console.error("Stibee add failed", res.status, body);
      await snap.ref.update({
        "stibee.lastResult": { code: res.status, message: body },
      });
      // enqueue retry logic here
      return;
    }
    // 성공 처리: Stibee가 반환하는 subscriberId가 있다면 저장
    const json = JSON.parse(body);
    await snap.ref.update({
      "stibee.lastSyncedAt": new Date().toISOString(),
      status: "subscribed",
      "stibee.lastResult": { code: res.status, message: "OK" },
    });
  } catch (err) {
    console.error("Network error to Stibee", err);
    await snap.ref.update({
      "stibee.lastResult": { code: 0, message: String(err) },
    });
    // 재시도 큐에 넣기
  }
};
```

---
