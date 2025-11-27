# :page_facing_up: PRD: Notion 연동 예약 관리 서비스

## 1. 프로젝트 개요 (Project Overview)

- **프로젝트명:** Notion Booking Service (가칭)
- **목표:** 별도의 백엔드 DB 구축 없이 Notion을 데이터베이스로 활용하여, 사용자가 날짜와 **시간**을 선택해 예약을 신청하고 관리자가 Notion 앱에서 이를 확인/확정하는 웹 서비스 구축.
- **핵심 가치:**
  - **저비용/고효율:** CMS 개발 비용 절감 (Notion 활용).
  - **접근성:** 관리자는 모바일 Notion 앱으로 어디서든 예약 관리 가능.
  - **사용성:** Next.js 기반의 빠른 웹 퍼포먼스.

## 2. 타겟 사용자 (Target Audience)

- **일반 사용자 (End User):** 웹사이트에 접속하여 원하는 날짜와 시간에 예약을 신청하는 고객.
- **관리자 (Admin):** Notion 페이지를 소유하고 예약을 승인/거절하는 주인 (병원, 미용실, 스튜디오 사장님 등).

## 3. 기술 스택 (Tech Stack)

- **Framework:** Next.js 14+ (App Router 권장)
- **Language:** TypeScript (안전한 데이터 처리를 위해 강력 추천)
- **Database:** Notion Database (via Notion API)
- **Styling:** Tailwind CSS
- **Deploy:** Vercel
- **Libraries:**
  - `@notionhq/client`: 노션 통신용
  - `date-fns` 또는 `dayjs`: 날짜/시간 계산용
  - `react-calendar` 또는 `react-datepicker`: 달력 UI

## 4. 데이터베이스 설계 (Notion DB Schema)

Notion에 생성할 데이터베이스의 컬럼 구조입니다. **시간 포함**이 핵심입니다.

| 속성 이름 (Key) | Notion 속성 타입   | 설명                                                | 비고                 |
| :-------------- | :----------------- | :-------------------------------------------------- | :------------------- |
| **예약자명**    | `제목 (Title)`     | 예약자 이름                                         |                      |
| **예약일시**    | `날짜 (Date)`      | **날짜 + 시간 포함** (ISO 8601)                     | 핵심 필터링 기준     |
| **연락처**      | `전화번호 (Phone)` | 연락처                                              |                      |
| **인원수**      | `숫자 (Number)`    | 방문 인원                                           |                      |
| **상태**        | `선택 (Select)`    | `신청대기`(Default), `예약확정`, `취소`, `방문완료` | 관리용               |
| **요청사항**    | `텍스트 (Text)`    | 추가 메모                                           |                      |
| **비밀번호**    | `텍스트 (Text)`    | 예약 조회/취소용 (선택사항)                         | 간단한 4자리 숫자 등 |

---

## 5. 상세 기능 명세 (Functional Requirements)

### A. 예약 가능 시간 조회 (Availability Check)

- **영업 시간 설정:** (예: 10:00 ~ 20:00, 1시간 단위)는 프론트엔드 상수(Constant)로 관리.
- **로직:**
  1.  사용자가 **날짜(YYYY-MM-DD)**를 선택한다.
  2.  시스템은 Notion DB에서 해당 날짜에 해당하는 모든 예약 건(`상태 != 취소`)을 조회한다.
  3.  전체 영업 시간 슬롯(Slot) 중, 이미 조회된(예약된) 시간을 제외(Disable)하고 사용자에게 보여준다.
- **UI:** 달력 클릭 -> 하단 또는 모달에 '가능한 시간 버튼' 나열.

### B. 예약 신청 (Reservation Submission)

- **입력 폼:** 이름, 연락처, 인원수, 요청사항.
- **유효성 검사:** 필수 입력값 확인, 전화번호 형식 확인.
- **중복 방지(Double Booking Prevention):**
  - 신청 버튼 클릭 시, 백엔드에서 **한 번 더** 해당 시간대 예약 유무를 체크한 후 Notion에 데이터를 생성(`Create`)한다.
- **결과 처리:**
  - 성공 시: "예약 신청이 접수되었습니다. 관리자 확인 후 확정됩니다." 메시지 출력.
  - 실패 시: "이미 예약된 시간입니다." 메시지 출력.

### C. 예약 관리 (Admin - Notion App)

- 관리자는 웹이 아닌 **Notion 앱**을 사용.
- 새로운 예약이 들어오면 Notion 알림이 옴 (또는 Slack 연동 가능).
- 관리자가 내용을 확인하고 `상태` 값을 `신청대기` → `예약확정`으로 변경.

---

## 6. API 명세 (Internal API Routes)

프론트엔드가 호출할 Next.js 내부 API 구조입니다.

### 1. `GET /api/availability?date=YYYY-MM-DD`

- **목적:** 특정 날짜의 예약된 시간 리스트 반환.
- **요청 파라미터:** `date` (예: `2023-11-25`)
- **Notion Query:**
  - Filter: `Date`가 해당 날짜와 일치 AND `Status` is not `취소`
- **응답 예시:**
  ```json
  {
    "date": "2023-11-25",
    "bookedTimes": ["10:00", "14:00", "15:00"]
  }
  ```

### 2. `POST /api/reservation`

- **목적:** 신규 예약 생성.
- **Body:** `{ name, phone, date, time, guests, note }`
- **Notion Action:**
  1.  `query`로 해당 `date + time`에 예약 있는지 재확인.
  2.  없으면 `pages.create` 실행.
- **응답 예시:**
  ```json
  { "success": true, "message": "예약 성공" }
  ```

---

## 7. UI/UX 와이어프레임 흐름

1.  **메인 페이지 (Home)**
    - 서비스 소개 문구.
    - "예약하기" 버튼.
2.  **예약 페이지 (Step 1: 날짜/시간)**
    - [Calendar Component]: 날짜 선택.
    - [Time Grid]:
      - `10:00` (가능)
      - `11:00` (마감 - 회색 처리)
      - `12:00` (가능) ...
3.  **정보 입력 (Step 2: 폼)**
    - 선택된 일시: `2023년 11월 25일 12:00`
    - 이름, 전화번호 등 입력 필드.
    - "예약 신청" 버튼.
4.  **완료 페이지**
    - 예약 완료 안내 및 주의사항(노쇼 금지 등) 표시.

---

## 8. 개발 일정 및 마일스톤 (Roadmap)

### 1주차: 설정 및 백엔드

- Next.js 프로젝트 세팅.
- Notion DB 생성 및 토큰 발급.
- Notion Client 연결 테스트.
- **API 개발:** 예약 조회, 생성 API 로직 구현 (Postman 등으로 테스트).

### 2주차: 프론트엔드 및 연동

- UI 컴포넌트 개발 (달력, 시간 선택, 입력 폼).
- API 연동 (SWR 또는 React Query 사용 권장).
- 유효성 검사 및 에러 처리 구현.

### 3주차: 배포 및 최적화

- Vercel 배포.
- 환경 변수 설정.
- 최종 테스트 (동시 접속 테스트 등).
- 오픈.

---

## 9. 위험 요소 및 해결 방안 (Risk Management)

1.  **API 속도 제한 (Rate Limiting):**
    - Notion API는 초당 요청 제한이 있으므로, `Revalidate`를 활용하거나 React Query의 캐싱 기능을 적극 활용하여 불필요한 API 호출을 줄임.
2.  **타임존 (Timezone) 문제:**
    - Notion은 기본적으로 UTC를 사용하거나 사용자 로컬 시간을 따름.
    - **해결:** 저장할 때 `YYYY-MM-DDTHH:mm:00.000+09:00` (KST) 형식으로 명시적으로 ISO String을 만들어 보내는 것이 안전함.
3.  **동시 예약 (Race Condition):**
    - 완벽한 트랜잭션 제어는 어려움.
    - **해결:** 예약 신청 시 백엔드에서 한 번 더 조회(Double Check)하는 로직을 필수로 넣고, UI에서 "관리자 확정 후 예약이 완료됩니다"라는 문구로 기대치를 관리.
