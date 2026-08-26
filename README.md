# ReadShelf 📚

책을 읽고 기록할수록 AI가 나의 독서 습관과 취향을 발견해주는 독서 분석 도구.

## 스택

- Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **DB 없음** — 모든 데이터는 브라우저 `localStorage`(`readshelf:v1`)에 저장
- AI 분석: Gemini API (`gemini-3.7-flash`, 구조화 출력) — 서버 라우트 `POST /api/report`
- 책 검색: 알라딘 OpenAPI — 서버 라우트 `GET /api/books/search`

## 실행

```bash
npm install
cp .env.example .env.local   # API 키 입력
npm run dev
```

키 없이도 책장 · 상세 기록 · 트래커는 모두 동작합니다.

| 키 | 없으면 |
|---|---|
| `GEMINI_API_KEY` | AI 리포트만 막힙니다 |
| `ALADIN_TTB_KEY` | 표지 검색만 막힙니다 (표지를 직접 올리는 건 그대로 됩니다) |

## Vercel 배포

1. GitHub에 push → Vercel에서 Import
2. **Settings → Environment Variables** 에 `GEMINI_API_KEY`와 `ALADIN_TTB_KEY` 추가
3. Deploy (별도 빌드 설정 불필요)

데이터가 브라우저에만 저장되므로 DB 연결은 필요 없습니다. 대신 **기기·브라우저가 바뀌면 기록도 달라집니다.**

## 화면

| 경로 | 화면 | 내용 |
|---|---|---|
| `/` | 책장 | 책등 형태로 쌓이는 책, 책 추가, 목록 보기 |
| `/book/[id]` | 책 상세 | 별점 · 한줄 후기 · 진행률 · 인상 깊은 문장 · 페이지 · 메모 |
| `/tracker` | 독서 트래커 | GitHub 잔디형 히트맵, 연속 독서일, 월간/총 독서량 |
| `/report` | AI 리포트 | 선호 장르 · 관심 주제 · 독서 습관 · 높은 평점의 공통점 · 한줄 분석 · 다음에 읽을 책 추천 |

## 데이터 구조

```ts
Book          { id, title, author, publisher, genre, totalPages, rating, review, createdAt,
                spineColor, spineImage, spineAspect,   // 책등 — 색상 템플릿 또는 직접 찍은 사진
                coverImage, coverAspect }              // 앞표지 — 알라딘 URL 또는 직접 올린 사진
ReadingRecord { id, bookId, date, startPage, endPage, pagesRead, memo, quote, quotePage }
AIReport      { preferredGenres, keywords[], readingHabit, ratingPattern, summary, generatedAt }
```

- **진행률** = 해당 책 기록 중 가장 큰 `endPage` ÷ `totalPages`
- **잔디 단계** = 0쪽 / 1–10쪽 / 11–30쪽 / 31쪽 이상
- **연속 독서일** = 오늘(또는 어제)부터 거슬러 올라가며 기록이 끊기지 않은 일수

## AI 리포트 동작

`src/app/api/report/route.ts` 가 브라우저에서 받은 책·기록을 서버에서 요약문(digest)으로 정리한 뒤 Gemini에 넘깁니다.
JSON 스키마로 응답 형태를 강제하고 zod로 한 번 더 검증하므로 화면이 깨지지 않고, 시스템 프롬프트에서 **입력된 데이터에만 근거하도록** 제약합니다.
생성된 리포트는 `localStorage`에 저장되어 재방문 시에도 유지되고, "다시 분석하기"로 갱신합니다.

### 책 추천은 지어낸 책을 걸러낸다

생성 모델은 그럴듯한 가짜 제목을 만들어낼 수 있습니다.
그래서 추천받은 책을 **알라딘에서 제목과 저자로 대조해 실물을 찾은 것만** 보여줍니다.

제목만 대조하면 동명이서를 잘못 집습니다 —
「끕림」은 이병률의 여행 에세이와 세라 워터스의 소설이 둘 다 있어서,
저자까지 맞는 것만 인정합니다.

## MVP 제외 (PRD 기준)

뽀모도로, 친구/소셜, 리뷰 공유, 댓글·좋아요, 책 추천, 외부 연동, 책 검색 API, 세부 통계, 책장 애니메이션
