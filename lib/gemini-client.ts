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
