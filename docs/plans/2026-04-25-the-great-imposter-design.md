> 작성일: 2026-04-25

# The Great Imposter — 설계 문서

## 0. 한 줄 요약

사용자가 업로드한 사진에 4×4 픽셀 도트 임포스터를 자동으로 다수 숨겨주는 웹 앱. 1차 버전은 **워터마크 형태**(임포스터를 박은 결과 이미지 + "N개 숨겨져 있어요"만 표시). 정답 토글·게임 모드는 다음 스텝.

---

## 1. 개요 & 사용 흐름

### 핵심 사용 흐름

1. 사용자가 브라우저에서 사진 업로드 (드래그앤드롭 또는 파일 선택)
2. 클라이언트가 Base64 인코딩 후 Next.js API Route(`/api/analyze`) 호출
3. API Route가 Gemini Vision에 이미지 + 프롬프트 전달 → 구조화된 JSON 응답 수신
4. 응답이 클라이언트로 반환되면 Canvas API로 원본 위에 4×4 임포스터 패턴을 N개 합성
5. 결과 이미지 + "N명의 임포스터가 숨어있어요" 표시, PNG 다운로드 버튼 제공
6. 부적합 이미지(단색 풍경 등)는 친절한 거절 메시지 + 다른 사진 권유

### 시스템 구성도

```
[Browser]
   │ ① 이미지 업로드 (Base64)
   ▼
[Next.js API Route /api/analyze]   ← API 키 서버 보관
   │ ② Gemini Vision 호출
   ▼
[Gemini 2.5 Flash]
   │ ③ JSON {fitness, count, points: [{x, y, color, reason}]}
   ▼
[Browser - Canvas API]
   │ ④ 원본 + 임포스터 N개 합성
   ▼
[결과 PNG 다운로드]
```

### 기술 스택

- **Next.js (App Router)** + TypeScript
- **Tailwind CSS** (UI 스타일)
- **Canvas API** (클라이언트 합성, 서버 부담 0)
- **Gemini 2.5 Flash** (멀티모달 비전)
- **Vercel** (배포, Region: `icn1` 서울)

---

## 2. AI 계약 (Gemini API)

### 호출 방식

- **Next.js API Route(`/api/analyze`)에서만 호출** — API 키 클라이언트 노출 방지
- 모델: `gemini-2.5-flash` (멀티모달, 빠르고 저렴, 구조화 응답 지원)
- `responseMimeType: "application/json"` + JSON Schema로 출력 강제

### 입력

- 이미지 (Base64 inline_data)
- 프롬프트: "임포스터 숨기기 전문가" 역할 + 출력 가이드라인

### 응답 스키마

```jsonc
{
  "fitness": 0.0~1.0,             // 이미지 적합도
  "fitnessReason": "...",         // 한국어 한두 문장
  "imposterCount": 0~50,          // AI가 결정
  "points": [
    {
      "x": 0.0~1.0,               // 정규화 좌표 (이미지 비율)
      "y": 0.0~1.0,
      "color": "red|blue|yellow|green|pink|orange|cyan|lime|black|white|purple|brown",
      "reason": "잎사귀 그늘 사이"  // 디버깅·다음 스텝용
    }
  ]
}
```

좌표는 **정규화 (0~1)** 로 받는다. 리사이즈해도 안전.

### 갯수 가이드 (프롬프트에 명시)

| 이미지 유형 | 권장 갯수 |
|---|---|
| 복잡한 이미지 (잎사귀·군중·패턴) | 20~40개 |
| 중간 (일반 풍경·실내) | 8~20개 |
| 낮음 (단색·평탄) | 0~5개 |

### AI의 의미 있는 역할 (시맨틱 이해)

- **위치 추천**: 단순 텍스처 분석이 아니라 사진 맥락 이해. "장례식 → 화환 잎 사이", "정원 → 잎사귀 그늘", "콘서트 → 군중 머리 사이".
- **위치별 색 추천**: 12색 팔레트에서 사진 분위기와 위치별 주변 색에 어울리는 색 선택.
- **자동 갯수 결정**: 이미지마다 자연스럽게 다른 N (5/13/27 등).

→ 클래식 컴퓨터 비전(엣지 디텍션, 색 분산)으로는 불가능한 영역.

### 거절 처리

- `fitness < 0.4` 또는 `imposterCount === 0` → 합성 생략, `fitnessReason`을 그대로 사용자에게 보여주고 "다른 사진을 시도해 보세요" 안내
- 회색 영역(0.4~0.7)은 진행하되 갯수가 적을 수 있음

### 비용·지연

이미지 1장당 1회 호출, 평균 응답 1~3초, 토큰은 수백 단위 → Vercel Hobby 환경에서도 부담 없음.

---

## 3. 클라이언트 렌더링 (Canvas)

### 임포스터 패턴 정의 (4×4)

`1` = 임포스터 색, `2` = 검정 디테일(눈/팔), `0` = 투명. 사용자 제공 디자인 기반:

```ts
// 실제 패턴은 디자인에 맞춰 최종 확정
const IMPOSTER_PATTERN: number[][] = [
  [1, 1, 1, 2],
  [2, 2, 1, 1],
  [1, 1, 1, 1],
  [1, 2, 1, 2],
];
```

### 색 팔레트

Among Us 컬러 12종을 hex로 정의 → AI가 반환한 `color` 문자열을 hex로 매핑:

```ts
const PALETTE = {
  red: "#C51111",
  blue: "#132ED1",
  green: "#117F2D",
  yellow: "#EDE15B",
  pink: "#ED54BA",
  orange: "#EF7D0E",
  cyan: "#38FEDC",
  lime: "#50EF39",
  black: "#3F474E",
  white: "#D6E0F0",
  purple: "#6B2FBC",
  brown: "#71491E",
};
```

### 스케일 공식

작은 사진에서 4×4가 너무 작아지지 않게 **하한 8×8 보장**:

```
scaleFactor = max(2, round(imageWidth / 800))
finalSize   = 4 × scaleFactor

400px  사진 → 8×8   (2배 보장)
1200px 사진 → 12×12 (3배)
3200px 사진 → 16×16 (4배)
4800px 사진 → 24×24 (6배)
```

### 렌더링 파이프라인

1. 원본 이미지를 Canvas에 `drawImage`로 그림
2. `imageSmoothingEnabled = false` (도트가 흐려지지 않게)
3. 각 `point.{x, y}` (정규화) → 실제 픽셀 좌표 변환:
   ```
   px = round(x * imageWidth)
   py = round(y * imageHeight)
   ```
4. 스케일 계산: `s = max(2, round(imageWidth / 800))`, `size = 4 * s`
5. 패턴 그리기 (4×4 루프 × s×s 블록):
   ```ts
   for (let r = 0; r < 4; r++) {
     for (let c = 0; c < 4; c++) {
       const v = PATTERN[r][c];
       if (v === 0) continue;
       ctx.fillStyle = v === 1 ? PALETTE[point.color] : "#1A1A1A";
       ctx.fillRect(px + c * s, py + r * s, s, s);
     }
   }
   ```
6. 좌표 클램프 (Gemini가 0.99처럼 끝값 줘서 잘림 방지)

### 다운로드

`canvas.toBlob('image/png')` → `URL.createObjectURL` → `<a download="imposter-{N}.png">`로 저장. 파일명에 N개 포함.

### 성능

4K 이미지 + 임포스터 30개도 Canvas 합성은 50ms 이내. 클라이언트 처리라 서버 부담 0.

---

## 4. UI / 에러 처리 / 배포

### UI 상태 (단일 페이지, 4단계)

| 상태 | 화면 |
|---|---|
| **Idle** | 큰 드롭존 + "사진을 끌어다 놓으세요" |
| **Loading** | 미리보기 이미지 + "임포스터 잠입 중…" 스피너 |
| **Result** | 합성 이미지 + `🔴 N명의 임포스터가 숨어있어요` + 다운로드 / 다시하기 버튼 |
| **Reject** | 원본 이미지 + `fitnessReason` 메시지 + 다시 업로드 버튼 |

### 입력 검증 (클라이언트)

- 형식: PNG / JPEG / WebP
- 크기: 최대 10MB (Vercel API Route payload 한도 고려)
- 최소 해상도: 가로 400px (그 미만은 임포스터가 너무 크게 보임)

### 에러 처리

| 케이스 | 처리 |
|---|---|
| Gemini 호출 실패 (네트워크/5xx) | 1회 자동 재시도 → 실패 시 "잠시 후 다시 시도" 토스트 |
| 응답 JSON 파싱 실패 | 1회 재시도 (구조화 응답이라 거의 없지만 보험) |
| Rate limit (429) | "조금 후 다시 시도해주세요" + 60초 카운트다운 |
| 좌표 검증 실패 (예: x>1) | 클라이언트에서 클램프, 진행 |

### 환경 변수

```
GEMINI_API_KEY=...   # Vercel 환경 변수, 서버 전용
```

클라이언트 번들에 절대 노출하지 않음 (`NEXT_PUBLIC_` 접두사 금지).

### 배포

- Vercel `main` 브랜치 자동 배포
- Region: `icn1` (서울) — 한국 사용자 지연 최소
- Function `maxDuration: 30s` (Hobby 플랜 한도)

---

## 5. 명시적으로 빼는 것 (다음 스텝)

YAGNI 원칙으로 1차 버전에 포함하지 않음:

- 정답 토글 / 게임 모드 / 타이머 / 점수
- 사용자 커스텀 임포스터 업로드
- 캡션 자동 생성
- 좌표·사유 결과 화면 노출 (데이터는 받지만 UI엔 표시 안 함 — 다음 스텝 힌트 시스템에서 활용)
- 음성 사회자 / 영상 지원 등 확장 카드

---

## 6. 디렉토리 구조 (예정)

```
the-great-imposter/
├── app/
│   ├── page.tsx              # 메인 페이지 (Idle/Loading/Result/Reject 상태 관리)
│   ├── layout.tsx
│   └── api/
│       └── analyze/
│           └── route.ts      # Gemini 호출 (서버 전용)
├── components/
│   ├── DropZone.tsx
│   ├── ResultView.tsx
│   └── RejectView.tsx
├── lib/
│   ├── imposter-pattern.ts   # 4×4 패턴 + 12색 팔레트
│   ├── canvas-render.ts      # Canvas 합성 로직
│   └── gemini-client.ts      # Gemini 호출 래퍼
├── docs/
│   └── plans/
│       └── 2026-04-25-the-great-imposter-design.md
├── package.json
├── next.config.js
└── tailwind.config.ts
```
