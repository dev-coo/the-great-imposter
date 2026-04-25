import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export interface BoundaryObject {
  label: string;
  box_2d: [number, number, number, number]; // [y0, x0, y1, x1] normalized 0-1000
  mask: string; // data URL or raw base64 of PNG
}

export type BoundaryResponse =
  | { ok: true; objects: BoundaryObject[] }
  | { ok: false; reason: string };

const PROMPT = `Give the segmentation masks for the most prominent objects in the image (up to 5).
Wrap the result in {"objects": [...]}. Each item must contain:
- "label": brief object name
- "box_2d": bounding box [y0, x0, y1, x1] as integers normalized to 0-1000
- "mask": a data URL "data:image/png;base64,..." of the binary mask PNG, sized to the bounding box

Return JSON only.`;

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    objects: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          label: { type: SchemaType.STRING },
          box_2d: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.INTEGER },
          },
          mask: { type: SchemaType.STRING },
        },
        required: ["label", "box_2d", "mask"],
      },
    },
  },
  required: ["objects"],
} as const;

export async function detectBoundaries(
  imageBase64: string,
  mimeType: string,
): Promise<BoundaryResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, reason: "서버 설정 오류: GEMINI_API_KEY 누락" };

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
    const parsed = JSON.parse(result.response.text());
    const rawArr = (parsed as { objects?: unknown }).objects;
    if (!Array.isArray(rawArr)) {
      return { ok: false, reason: "AI 응답 형식이 잘못됐어요." };
    }

    const objects: BoundaryObject[] = [];
    for (const item of rawArr) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const label = typeof o.label === "string" ? o.label : "";
      const bbox = Array.isArray(o.box_2d) ? o.box_2d : null;
      const mask = typeof o.mask === "string" ? o.mask : "";
      if (!label || !bbox || bbox.length !== 4 || !mask) continue;
      const nums = bbox.map((n) => (typeof n === "number" ? n : NaN));
      if (nums.some(Number.isNaN)) continue;
      objects.push({
        label,
        box_2d: [nums[0], nums[1], nums[2], nums[3]],
        mask,
      });
    }

    if (objects.length === 0) {
      return { ok: false, reason: "객체를 찾지 못했어요. 다른 사진을 시도해 주세요." };
    }
    return { ok: true, objects };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return { ok: false, reason: `AI 호출 실패: ${msg}` };
  }
}
