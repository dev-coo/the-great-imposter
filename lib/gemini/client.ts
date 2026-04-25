import { GoogleGenerativeAI } from "@google/generative-ai";
import { AnalyzeResponse } from "../types";
import { PROMPT } from "./prompt";
import { RESPONSE_SCHEMA, parseGeminiResponse } from "./schema";

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
