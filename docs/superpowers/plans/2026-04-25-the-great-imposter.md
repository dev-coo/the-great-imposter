# The Great Imposter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자 업로드 사진에 4×4 픽셀 임포스터를 Gemini Vision 추천 위치에 자동으로 다수 합성하는 Next.js 웹 앱 (MVP: 워터마크 모드).

**Architecture:** Next.js App Router 단일 페이지 앱. 서버는 `/api/analyze` 한 곳뿐 — Gemini 2.5 Flash에 이미지 보내고 좌표·색·갯수를 구조화 JSON으로 받음. 픽셀 합성은 전부 클라이언트 Canvas API에서 수행 (서버 부담 0, Vercel Hobby 한도 안전). Vercel `icn1` 배포.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, @google/generative-ai SDK, Vitest (단위 테스트), Vercel.

**참고 설계 문서:** `docs/plans/2026-04-25-the-great-imposter-design.md`

**작업 규칙 (사용자 글로벌 인스트럭션):**
- 빌드·테스트는 **사용자가 직접 실행**합니다. 각 task의 검증 단계에서 명령어를 안내하면 사용자가 결과를 확인하고 다음으로 진행합니다.
- 커밋은 **사용자가 명시적으로 요청할 때만**. 각 task 끝의 commit step도 사용자 검토·승인 후 실행.

---

## 파일 구조

| 파일 | 역할 |
|---|---|
| `package.json` | 의존성 (Next, React, TS, Tailwind, @google/generative-ai, vitest) |
| `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs` | 표준 설정 (create-next-app 생성) |
| `vitest.config.ts` | 단위 테스트 설정 |
| `vercel.json` | Region `icn1`, function `maxDuration` |
| `.env.example` | `GEMINI_API_KEY=` 샘플 |
| `app/layout.tsx` | 루트 레이아웃 + 메타데이터 |
| `app/page.tsx` | 메인 페이지 (Idle/Loading/Result/Reject 상태 머신) |
| `app/globals.css` | Tailwind + 글로벌 스타일 (create-next-app 생성) |
| `app/api/analyze/route.ts` | Gemini 호출 (서버 전용) |
| `lib/types.ts` | 공유 타입 (`AnalyzeResponse`, `ImposterPoint`, `ImposterColor`) |
| `lib/imposter-pattern.ts` | 4×4 패턴 + 12색 팔레트 상수 |
| `lib/canvas-render.ts` | Canvas 합성 로직 (스케일 계산, 좌표 변환, 패턴 그리기) |
| `lib/gemini-client.ts` | Gemini 호출 래퍼 + 응답 검증 |
| `components/DropZone.tsx` | 파일 업로드 UI (드래그앤드롭 + 클릭) |
| `components/ResultView.tsx` | 결과 화면: Canvas 합성 + 다운로드 |
| `tests/lib/canvas-render.test.ts` | 좌표 변환 + 스케일 단위 테스트 |
| `tests/lib/gemini-client.test.ts` | 응답 검증 단위 테스트 |
| `README.md` | 로컬 실행/배포 가이드 |

각 파일은 **하나의 책임**만 갖도록 분리. UI 컴포넌트는 단위 테스트하지 않음(통합 검증은 사용자가 브라우저로). 핵심 순수 로직(`canvas-render`, `gemini-client`)에만 TDD 적용.

---

## Task 1: 프로젝트 초기화

빈 디렉토리에 Next.js 스캐폴드 + 추가 의존성 설치 + git 저장소 초기화.

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css` (create-next-app)
- Create: `.gitignore` (create-next-app), `.env.example`, `vitest.config.ts`

- [ ] **Step 1: Next.js 프로젝트 스캐폴드**

```bash
cd /Users/choeeun-u/project/the-great-imposter
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --turbopack --use-npm --yes
```

(빈 디렉토리에 그대로 깔림. git 저장소도 자동 초기화.)

- [ ] **Step 2: 추가 의존성 설치**

```bash
npm install @google/generative-ai
npm install -D vitest @vitejs/plugin-react happy-dom
```

- [ ] **Step 3: `.env.example` 작성**

`.env.example`:

```
GEMINI_API_KEY=your-gemini-api-key-here
```

- [ ] **Step 4: `vitest.config.ts` 작성**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
```

- [ ] **Step 5: `package.json`의 scripts에 test 명령 추가**

기존 scripts에 다음 두 줄 추가:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: 검증 (사용자 실행)**

```bash
npm run dev
```

→ http://localhost:3000 에서 기본 Next.js 페이지 확인. Ctrl+C로 종료.

```bash
npm run test
```

→ "No test files found" 메시지 (정상, 테스트 아직 없음).

- [ ] **Step 7: 커밋 (사용자 승인 후)**

```bash
git add .
git commit -m "chore: scaffold Next.js + Tailwind + Vitest"
```

---

## Task 2: 공유 타입 + 임포스터 패턴/팔레트 상수

순수 데이터/상수 파일. 이후 모든 task가 import.

**Files:**
- Create: `lib/types.ts`
- Create: `lib/imposter-pattern.ts`

- [ ] **Step 1: `lib/types.ts` 작성**

```ts
export const IMPOSTER_COLORS = [
  "red", "blue", "yellow", "green", "pink", "orange",
  "cyan", "lime", "black", "white", "purple", "brown",
] as const;

export type ImposterColor = (typeof IMPOSTER_COLORS)[number];

export interface ImposterPoint {
  x: number;        // 0~1 정규화
  y: number;        // 0~1 정규화
  color: ImposterColor;
  reason: string;   // 디버깅·다음 스텝용
}

export interface AnalyzeSuccess {
  ok: true;
  fitness: number;             // 0~1
  fitnessReason: string;
  imposterCount: number;
  points: ImposterPoint[];
}

export interface AnalyzeReject {
  ok: false;
  reason: string;              // 사용자에게 보여줄 메시지
}

export type AnalyzeResponse = AnalyzeSuccess | AnalyzeReject;
```

- [ ] **Step 2: `lib/imposter-pattern.ts` 작성**

```ts
import { ImposterColor } from "./types";

// 4×4 패턴: 1 = 임포스터 색, 2 = 검정 디테일, 0 = 투명
// 사용자 제공 디자인 기반 (필요시 수정)
export const IMPOSTER_PATTERN: ReadonlyArray<ReadonlyArray<0 | 1 | 2>> = [
  [1, 1, 1, 2],
  [2, 2, 1, 1],
  [1, 1, 1, 1],
  [1, 2, 1, 2],
];

export const PATTERN_SIZE = 4;

export const PALETTE: Record<ImposterColor, string> = {
  red:    "#C51111",
  blue:   "#132ED1",
  yellow: "#EDE15B",
  green:  "#117F2D",
  pink:   "#ED54BA",
  orange: "#EF7D0E",
  cyan:   "#38FEDC",
  lime:   "#50EF39",
  black:  "#3F474E",
  white:  "#D6E0F0",
  purple: "#6B2FBC",
  brown:  "#71491E",
};

export const DETAIL_COLOR = "#1A1A1A";
```

- [ ] **Step 3: 검증 (사용자 실행)**

```bash
npx tsc --noEmit
```

→ 에러 없이 통과.

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add lib/
git commit -m "feat: add shared types and imposter pattern/palette"
```

---

## Task 3: Canvas 렌더링 로직 (TDD)

핵심 로직. 단위 테스트 먼저, 구현 나중.

**함수 설계:**
- `computeScale(imageWidth: number): number` — `max(2, round(imageWidth / 800))`
- `denormalize(p: ImposterPoint, w: number, h: number): {px, py}` — 정규화 좌표 → 픽셀, 경계 클램프
- `renderImposters(ctx, points, imageWidth, imageHeight): void` — 패턴 그리기 (Canvas 부수효과)

**Files:**
- Create: `tests/lib/canvas-render.test.ts`
- Create: `lib/canvas-render.ts`

- [ ] **Step 1: 테스트 파일 작성 (실패)**

`tests/lib/canvas-render.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { computeScale, denormalize } from "@/lib/canvas-render";

describe("computeScale", () => {
  it("returns minimum 2 for small images", () => {
    expect(computeScale(400)).toBe(2);
    expect(computeScale(800)).toBe(2);  // round(1)=1 → max(2,1)=2
  });

  it("scales proportionally for larger images", () => {
    expect(computeScale(1200)).toBe(2);  // round(1.5)=2
    expect(computeScale(1600)).toBe(2);  // round(2)=2
    expect(computeScale(2400)).toBe(3);  // round(3)=3
    expect(computeScale(3200)).toBe(4);  // round(4)=4
    expect(computeScale(4800)).toBe(6);  // round(6)=6
  });
});

describe("denormalize", () => {
  it("converts normalized to pixel coordinates", () => {
    const point = { x: 0.5, y: 0.25, color: "red" as const, reason: "" };
    expect(denormalize(point, 1000, 800)).toEqual({ px: 500, py: 200 });
  });

  it("rounds fractional pixels", () => {
    const point = { x: 0.333, y: 0.667, color: "red" as const, reason: "" };
    expect(denormalize(point, 1000, 1000)).toEqual({ px: 333, py: 667 });
  });

  it("clamps coordinates so the imposter fits inside the image", () => {
    const point = { x: 0.99, y: 1.0, color: "red" as const, reason: "" };
    // imageWidth=1000 → scale=max(2, round(1.25))=2, size=4*2=8
    // max px = 1000 - 8 = 992
    expect(denormalize(point, 1000, 1000)).toEqual({ px: 992, py: 992 });
  });

  it("clamps negative coordinates to zero", () => {
    const point = { x: -0.1, y: -0.5, color: "red" as const, reason: "" };
    expect(denormalize(point, 1000, 1000)).toEqual({ px: 0, py: 0 });
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인 (사용자 실행)**

```bash
npm run test
```

Expected: `lib/canvas-render` 모듈을 못 찾아 import 에러로 실패.

- [ ] **Step 3: `lib/canvas-render.ts` 구현**

```ts
import { ImposterPoint } from "./types";
import {
  IMPOSTER_PATTERN,
  PATTERN_SIZE,
  PALETTE,
  DETAIL_COLOR,
} from "./imposter-pattern";

export function computeScale(imageWidth: number): number {
  return Math.max(2, Math.round(imageWidth / 800));
}

export function denormalize(
  point: ImposterPoint,
  imageWidth: number,
  imageHeight: number,
): { px: number; py: number } {
  const scale = computeScale(imageWidth);
  const size = PATTERN_SIZE * scale;
  const rawX = Math.round(point.x * imageWidth);
  const rawY = Math.round(point.y * imageHeight);
  const px = Math.min(Math.max(rawX, 0), Math.max(0, imageWidth - size));
  const py = Math.min(Math.max(rawY, 0), Math.max(0, imageHeight - size));
  return { px, py };
}

export function renderImposters(
  ctx: CanvasRenderingContext2D,
  points: ImposterPoint[],
  imageWidth: number,
  imageHeight: number,
): void {
  const scale = computeScale(imageWidth);
  ctx.imageSmoothingEnabled = false;
  for (const point of points) {
    const { px, py } = denormalize(point, imageWidth, imageHeight);
    const fillColor = PALETTE[point.color];
    for (let r = 0; r < PATTERN_SIZE; r++) {
      for (let c = 0; c < PATTERN_SIZE; c++) {
        const v = IMPOSTER_PATTERN[r][c];
        if (v === 0) continue;
        ctx.fillStyle = v === 1 ? fillColor : DETAIL_COLOR;
        ctx.fillRect(px + c * scale, py + r * scale, scale, scale);
      }
    }
  }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인 (사용자 실행)**

```bash
npm run test
```

Expected: 모든 테스트 PASS.

- [ ] **Step 5: 커밋 (사용자 승인 후)**

```bash
git add lib/canvas-render.ts tests/lib/canvas-render.test.ts
git commit -m "feat: add canvas rendering with scale and clamping"
```

---

## Task 4: Gemini 클라이언트 래퍼 (TDD)

응답 검증·정규화 로직(`parseGeminiResponse`)만 단위 테스트. 실제 API 호출(`callGemini`)은 다음 task에서 통합 검증.

**함수 설계:**
- `parseGeminiResponse(raw: unknown): AnalyzeResponse` — 잘못된 색·범위 밖 좌표 필터링, fitness < 0.4면 reject
- `callGemini(imageBase64, mimeType): Promise<AnalyzeResponse>` — Gemini 호출 + parseGeminiResponse 적용

**Files:**
- Create: `tests/lib/gemini-client.test.ts`
- Create: `lib/gemini-client.ts`

- [ ] **Step 1: 테스트 파일 작성 (실패)**

`tests/lib/gemini-client.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseGeminiResponse } from "@/lib/gemini-client";

describe("parseGeminiResponse", () => {
  it("accepts a valid response", () => {
    const raw = {
      fitness: 0.8,
      fitnessReason: "복잡한 잎사귀가 많아 잘 숨길 수 있음",
      imposterCount: 2,
      points: [
        { x: 0.3, y: 0.5, color: "red", reason: "잎사귀 사이" },
        { x: 0.7, y: 0.2, color: "green", reason: "그늘" },
      ],
    };
    const result = parseGeminiResponse(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fitness).toBe(0.8);
      expect(result.points).toHaveLength(2);
    }
  });

  it("rejects when fitness < 0.4", () => {
    const raw = {
      fitness: 0.2,
      fitnessReason: "단색 하늘이라 임포스터가 다 보일 거예요",
      imposterCount: 0,
      points: [],
    };
    const result = parseGeminiResponse(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("단색");
  });

  it("rejects when imposterCount === 0", () => {
    const raw = {
      fitness: 0.5,
      fitnessReason: "어쩐지 적합하지 않음",
      imposterCount: 0,
      points: [],
    };
    const result = parseGeminiResponse(raw);
    expect(result.ok).toBe(false);
  });

  it("filters out points with invalid colors", () => {
    const raw = {
      fitness: 0.7,
      fitnessReason: "ok",
      imposterCount: 2,
      points: [
        { x: 0.5, y: 0.5, color: "red", reason: "ok" },
        { x: 0.6, y: 0.6, color: "magenta", reason: "bad" },
      ],
    };
    const result = parseGeminiResponse(raw);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.points).toHaveLength(1);
  });

  it("filters out points with out-of-range coordinates", () => {
    const raw = {
      fitness: 0.7,
      fitnessReason: "ok",
      imposterCount: 3,
      points: [
        { x: 0.5, y: 0.5, color: "red", reason: "ok" },
        { x: 1.5, y: 0.5, color: "red", reason: "out" },
        { x: -0.1, y: 0.5, color: "red", reason: "out" },
      ],
    };
    const result = parseGeminiResponse(raw);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.points).toHaveLength(1);
  });

  it("rejects malformed input", () => {
    const result = parseGeminiResponse({ foo: "bar" });
    expect(result.ok).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트 실행 — 실패 확인 (사용자 실행)**

```bash
npm run test
```

- [ ] **Step 3: `lib/gemini-client.ts` 구현**

```ts
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import {
  AnalyzeResponse,
  ImposterColor,
  IMPOSTER_COLORS,
  ImposterPoint,
} from "./types";

const PROMPT = `당신은 사진에 4×4 픽셀 임포스터(Among Us 캐릭터)를 자연스럽게 숨기는 전문가입니다.

다음 가이드라인을 엄격히 따라 응답하세요:

1. 사진의 맥락을 이해하세요 (정원/장례식/콘서트/풍경 등).
2. "위장 효과"가 좋은 위치를 찾으세요 — 잎사귀 사이, 군중 머리 사이, 패턴이 복잡한 영역, 그늘 등.
3. 사진의 적합도(fitness, 0~1)를 평가하세요:
   - 단색 하늘/평탄한 풍경/심플한 일러스트 → 0~0.3 (부적합)
   - 일반 풍경/실내 → 0.4~0.7
   - 복잡한 잎사귀/군중/디테일이 많은 사진 → 0.8~1.0
4. 적정 갯수(imposterCount)는 적합도에 비례:
   - 0~0.3: 0~5개
   - 0.4~0.7: 8~20개
   - 0.8~1.0: 20~40개
5. 각 위치마다:
   - 좌표(x, y)는 0~1 정규화 (이미지 좌상단 기준)
   - color는 12색 중 하나: red/blue/yellow/green/pink/orange/cyan/lime/black/white/purple/brown — 그 위치 주변과 자연스럽게 어울리는 색
   - reason은 한국어 한 줄 (예: "잎사귀 그늘 사이")
6. 부적합한 사진이면 imposterCount=0, points=[], fitnessReason에 친절한 한국어 사유.

JSON으로만 응답하세요.`;

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    fitness: { type: SchemaType.NUMBER },
    fitnessReason: { type: SchemaType.STRING },
    imposterCount: { type: SchemaType.INTEGER },
    points: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          x: { type: SchemaType.NUMBER },
          y: { type: SchemaType.NUMBER },
          color: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
        },
        required: ["x", "y", "color", "reason"],
      },
    },
  },
  required: ["fitness", "fitnessReason", "imposterCount", "points"],
} as const;

export function parseGeminiResponse(raw: unknown): AnalyzeResponse {
  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: "AI 응답을 이해할 수 없어요. 다시 시도해 주세요." };
  }
  const r = raw as Record<string, unknown>;
  const fitness = typeof r.fitness === "number" ? r.fitness : NaN;
  const fitnessReason = typeof r.fitnessReason === "string" ? r.fitnessReason : "";
  const imposterCount =
    typeof r.imposterCount === "number" ? Math.floor(r.imposterCount) : 0;

  if (Number.isNaN(fitness) || fitness < 0.4 || imposterCount <= 0) {
    return {
      ok: false,
      reason:
        fitnessReason ||
        "이 사진은 임포스터를 숨기기에 적합하지 않아요. 다른 사진을 시도해 주세요.",
    };
  }

  const rawPoints = Array.isArray(r.points) ? r.points : [];
  const points: ImposterPoint[] = [];
  for (const p of rawPoints) {
    if (!p || typeof p !== "object") continue;
    const pt = p as Record<string, unknown>;
    const x = typeof pt.x === "number" ? pt.x : NaN;
    const y = typeof pt.y === "number" ? pt.y : NaN;
    const color = typeof pt.color === "string" ? pt.color : "";
    const reason = typeof pt.reason === "string" ? pt.reason : "";
    if (Number.isNaN(x) || Number.isNaN(y) || x < 0 || x > 1 || y < 0 || y > 1) continue;
    if (!IMPOSTER_COLORS.includes(color as ImposterColor)) continue;
    points.push({ x, y, color: color as ImposterColor, reason });
  }

  if (points.length === 0) {
    return {
      ok: false,
      reason: fitnessReason || "추천 위치가 없어요. 다른 사진을 시도해 주세요.",
    };
  }

  return { ok: true, fitness, fitnessReason, imposterCount: points.length, points };
}

export async function callGemini(
  imageBase64: string,
  mimeType: string,
): Promise<AnalyzeResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "서버 설정 오류: GEMINI_API_KEY 누락" };
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA as never,
    },
  });

  try {
    const result = await model.generateContent([
      { inlineData: { data: imageBase64, mimeType } },
      { text: PROMPT },
    ]);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return parseGeminiResponse(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return { ok: false, reason: `AI 호출 실패: ${msg}` };
  }
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인 (사용자 실행)**

```bash
npm run test
```

Expected: 모든 테스트 PASS.

- [ ] **Step 5: 커밋 (사용자 승인 후)**

```bash
git add lib/gemini-client.ts tests/lib/gemini-client.test.ts
git commit -m "feat: add gemini client with response validation"
```

---

## Task 5: API Route `/api/analyze`

서버에서 Base64 이미지 받아 Gemini 호출 → AnalyzeResponse 반환. 입력 검증 포함.

**Files:**
- Create: `app/api/analyze/route.ts`

- [ ] **Step 1: `app/api/analyze/route.ts` 작성**

```ts
import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini-client";
import { AnalyzeResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"];
const MAX_BASE64_LENGTH = 14_000_000; // ~10MB binary

export async function POST(req: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, reason: "잘못된 요청 형식이에요." },
      { status: 400 },
    );
  }

  const { imageBase64, mimeType } = (body ?? {}) as {
    imageBase64?: unknown;
    mimeType?: unknown;
  };

  if (typeof imageBase64 !== "string" || imageBase64.length === 0) {
    return NextResponse.json(
      { ok: false, reason: "이미지 데이터가 없어요." },
      { status: 400 },
    );
  }
  if (typeof mimeType !== "string" || !ALLOWED_MIME.includes(mimeType)) {
    return NextResponse.json(
      { ok: false, reason: "지원하지 않는 이미지 형식이에요. (PNG/JPEG/WebP만 가능)" },
      { status: 400 },
    );
  }
  if (imageBase64.length > MAX_BASE64_LENGTH) {
    return NextResponse.json(
      { ok: false, reason: "이미지가 너무 커요. 10MB 이하로 올려주세요." },
      { status: 413 },
    );
  }

  const result = await callGemini(imageBase64, mimeType);
  return NextResponse.json(result);
}
```

(거절도 200으로 보내는 이유: 클라이언트는 "정상적으로 거절 메시지를 수신"하는 흐름. 실제 서버 에러만 4xx/5xx.)

- [ ] **Step 2: `.env.local`에 실제 API 키 설정 (사용자 실행)**

```bash
echo "GEMINI_API_KEY=실제키" > .env.local
```

(`.env.local`은 create-next-app의 `.gitignore`에 자동 포함, 커밋 안 됨. https://aistudio.google.com/app/apikey 에서 발급)

- [ ] **Step 3: 검증 (사용자 실행)**

```bash
npm run dev
```

다른 터미널에서 작은 PNG로 테스트:

```bash
IMG=$(base64 < some-image.png | tr -d '\n')
curl -X POST http://localhost:3000/api/analyze \
  -H 'Content-Type: application/json' \
  -d "{\"imageBase64\":\"$IMG\",\"mimeType\":\"image/png\"}"
```

Expected: `{"ok":true,"fitness":...,"points":[...]}` 또는 `{"ok":false,"reason":"..."}`

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add app/api/
git commit -m "feat: add /api/analyze route with input validation"
```

---

## Task 6: DropZone 컴포넌트

파일 업로드 UI. 드래그앤드롭 + 클릭 모두 지원. 검증(형식·크기·최소 해상도) 후 부모에 콜백.

**Files:**
- Create: `components/DropZone.tsx`

- [ ] **Step 1: `components/DropZone.tsx` 작성**

```tsx
"use client";

import { useCallback, useRef, useState } from "react";

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;
const MIN_WIDTH = 400;

interface Props {
  onFileSelected: (file: File, dataUrl: string, width: number, height: number) => void;
}

export function DropZone({ onFileSelected }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndEmit = useCallback(
    (file: File) => {
      setError(null);
      if (!ALLOWED_MIME.includes(file.type)) {
        setError("PNG, JPEG, WebP 형식만 지원해요.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("파일이 너무 커요 (최대 10MB).");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth < MIN_WIDTH) {
            setError(`이미지 가로가 ${MIN_WIDTH}px 이상이어야 해요.`);
            return;
          }
          onFileSelected(file, dataUrl, img.naturalWidth, img.naturalHeight);
        };
        img.onerror = () => setError("이미지를 읽을 수 없어요.");
        img.src = dataUrl;
      };
      reader.onerror = () => setError("파일을 읽을 수 없어요.");
      reader.readAsDataURL(file);
    },
    [onFileSelected],
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file) validateAndEmit(file);
        }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition ${
          dragOver ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <p className="text-lg font-medium text-gray-700">사진을 끌어다 놓으세요</p>
        <p className="text-sm text-gray-500 mt-2">또는 클릭해서 선택 (PNG/JPEG/WebP, 최대 10MB)</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) validateAndEmit(file);
          }}
        />
      </div>
      {error && <p className="mt-4 text-center text-red-600">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: 검증 (사용자 실행)**

이 시점엔 페이지에 붙이지 않았으므로 타입 체크만:

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add components/DropZone.tsx
git commit -m "feat: add DropZone component with file validation"
```

---

## Task 7: ResultView 컴포넌트

받은 좌표로 Canvas에 합성, "N명의 임포스터가 숨어있어요" 텍스트, 다운로드 버튼.

**Files:**
- Create: `components/ResultView.tsx`

- [ ] **Step 1: `components/ResultView.tsx` 작성**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { ImposterPoint } from "@/lib/types";
import { renderImposters } from "@/lib/canvas-render";

interface Props {
  imageDataUrl: string;
  imageWidth: number;
  imageHeight: number;
  points: ImposterPoint[];
  onReset: () => void;
}

export function ResultView({
  imageDataUrl,
  imageWidth,
  imageHeight,
  points,
  onReset,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      renderImposters(ctx, points, imageWidth, imageHeight);
    };
    img.src = imageDataUrl;
  }, [imageDataUrl, imageWidth, imageHeight, points]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `imposter-${points.length}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <p className="text-2xl font-bold text-center mb-4">
        🔴 {points.length}명의 임포스터가 숨어있어요
      </p>
      <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
        <canvas ref={canvasRef} className="w-full h-auto block" />
      </div>
      <div className="flex justify-center gap-3 mt-6">
        <button
          onClick={handleDownload}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
        >
          다운로드
        </button>
        <button
          onClick={onReset}
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
        >
          다른 사진
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 검증 (사용자 실행)**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add components/ResultView.tsx
git commit -m "feat: add ResultView with canvas composite and download"
```

---

## Task 8: 메인 페이지 (상태 머신 + RejectView 인라인)

`Idle / Loading / Result / Reject` 4상태. RejectView는 작아서 인라인.

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: `app/page.tsx` 전체 교체**

```tsx
"use client";

import { useState } from "react";
import { DropZone } from "@/components/DropZone";
import { ResultView } from "@/components/ResultView";
import { AnalyzeResponse, ImposterPoint } from "@/lib/types";

type State =
  | { kind: "idle" }
  | { kind: "loading"; imageDataUrl: string }
  | {
      kind: "result";
      imageDataUrl: string;
      width: number;
      height: number;
      points: ImposterPoint[];
    }
  | { kind: "reject"; imageDataUrl: string; reason: string };

export default function Home() {
  const [state, setState] = useState<State>({ kind: "idle" });

  const handleFile = async (
    file: File,
    dataUrl: string,
    width: number,
    height: number,
  ) => {
    setState({ kind: "loading", imageDataUrl: dataUrl });

    const base64 = dataUrl.split(",")[1] ?? "";
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      const data = (await res.json()) as AnalyzeResponse;
      if (data.ok) {
        setState({
          kind: "result",
          imageDataUrl: dataUrl,
          width,
          height,
          points: data.points,
        });
      } else {
        setState({ kind: "reject", imageDataUrl: dataUrl, reason: data.reason });
      }
    } catch {
      setState({
        kind: "reject",
        imageDataUrl: dataUrl,
        reason: "네트워크 오류가 발생했어요. 잠시 후 다시 시도해 주세요.",
      });
    }
  };

  const reset = () => setState({ kind: "idle" });

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-2">The Great Imposter</h1>
      <p className="text-center text-gray-600 mb-12">
        사진을 올리면 임포스터가 몰래 숨어듭니다.
      </p>

      {state.kind === "idle" && <DropZone onFileSelected={handleFile} />}

      {state.kind === "loading" && (
        <div className="max-w-2xl mx-auto text-center">
          <img
            src={state.imageDataUrl}
            alt="업로드한 이미지"
            className="rounded-xl mx-auto opacity-60"
          />
          <p className="mt-6 text-lg text-gray-700">임포스터 잠입 중…</p>
        </div>
      )}

      {state.kind === "result" && (
        <ResultView
          imageDataUrl={state.imageDataUrl}
          imageWidth={state.width}
          imageHeight={state.height}
          points={state.points}
          onReset={reset}
        />
      )}

      {state.kind === "reject" && (
        <div className="max-w-2xl mx-auto text-center">
          <img
            src={state.imageDataUrl}
            alt="업로드한 이미지"
            className="rounded-xl mx-auto"
          />
          <p className="mt-6 text-lg text-gray-700">{state.reason}</p>
          <button
            onClick={reset}
            className="mt-6 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
          >
            다른 사진 시도
          </button>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: 검증 (사용자 실행)**

```bash
npm run dev
```

→ http://localhost:3000

확인 포인트:
1. 드롭존이 보임
2. 사진을 드래그하면 "임포스터 잠입 중…" 표시 후 결과 화면
3. 결과 화면에 "N명의 임포스터가 숨어있어요" + 합성된 이미지 + 다운로드/다른 사진 버튼
4. 다운로드 누르면 `imposter-N.png` 저장
5. 단색 이미지(예: 회색 단일 색)를 올리면 거절 화면 + 사유

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add app/page.tsx
git commit -m "feat: wire main page state machine"
```

---

## Task 9: 레이아웃 + 메타데이터

한국어 메타·OG 태그.

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: `app/layout.tsx` 교체**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Great Imposter",
  description: "사진을 올리면 임포스터가 몰래 숨어듭니다.",
  openGraph: {
    title: "The Great Imposter",
    description: "사진 속 임포스터를 찾아보세요.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: 검증 (사용자 실행)**

```bash
npm run build
```

→ 빌드 성공.

- [ ] **Step 3: 커밋 (사용자 승인 후)**

```bash
git add app/layout.tsx
git commit -m "chore: add korean metadata and og tags"
```

---

## Task 10: Vercel 배포 설정 + README

**Files:**
- Create: `vercel.json`
- Create: `README.md`

- [ ] **Step 1: `vercel.json` 작성**

```json
{
  "regions": ["icn1"],
  "functions": {
    "app/api/analyze/route.ts": {
      "maxDuration": 30
    }
  }
}
```

- [ ] **Step 2: `README.md` 작성**

````markdown
# The Great Imposter

사진을 올리면 4×4 픽셀 임포스터가 몰래 숨어드는 웹 앱.

## 로컬 실행

```bash
npm install
cp .env.example .env.local
# .env.local의 GEMINI_API_KEY 채우기 (https://aistudio.google.com/app/apikey)
npm run dev
```

http://localhost:3000

## 테스트

```bash
npm run test
```

## 배포 (Vercel)

1. Vercel에 프로젝트 임포트
2. 환경 변수 `GEMINI_API_KEY` 설정
3. 자동 배포 (region: `icn1`)

## 설계 문서

- `docs/plans/2026-04-25-the-great-imposter-design.md`
- `docs/superpowers/plans/2026-04-25-the-great-imposter.md`
````

- [ ] **Step 3: 검증 (사용자 실행)**

```bash
npm run build
```

→ 성공.

- [ ] **Step 4: 커밋 (사용자 승인 후)**

```bash
git add vercel.json README.md
git commit -m "chore: add vercel config and README"
```

---

## 완료 기준

- [ ] `npm run dev`에서 사진 업로드 → 결과 화면에 합성된 이미지 + 임포스터 갯수 표시
- [ ] 단색/평탄 이미지 올리면 거절 메시지
- [ ] 다운로드 버튼으로 PNG 저장
- [ ] `npm run test` 모두 통과
- [ ] `npm run build` 성공
- [ ] Vercel `icn1`에 배포되고 환경 변수 `GEMINI_API_KEY` 설정됨
