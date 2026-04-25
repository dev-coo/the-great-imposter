import { SchemaType } from "@google/generative-ai";
import {
  AnalyzeResponse,
  ImposterColor,
  IMPOSTER_COLORS,
  ImposterPoint,
} from "../types";

export const RESPONSE_SCHEMA = {
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
