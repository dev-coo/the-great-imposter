import { GoogleAuth } from "google-auth-library";
import { AnalyzeResponse } from "../types";
import { PROMPT } from "./prompt";
import { RESPONSE_SCHEMA, parseGeminiResponse } from "./schema";

const MODEL = "gemini-2.5-flash";

let cachedAuth: GoogleAuth | null = null;
function getAuth(): GoogleAuth {
  if (!cachedAuth) {
    const inlineJson = process.env.GCP_CREDENTIALS_JSON;
    cachedAuth = new GoogleAuth({
      credentials: inlineJson ? JSON.parse(inlineJson) : undefined,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
  }
  return cachedAuth;
}

export async function callGemini(
  imageBase64: string,
  mimeType: string,
): Promise<AnalyzeResponse> {
  const projectId = process.env.GCP_PROJECT_ID;
  const location = process.env.GCP_LOCATION || "us-central1";
  if (!projectId) {
    return { ok: false, reason: "서버 설정 오류: GCP_PROJECT_ID 누락" };
  }
  if (!process.env.GCP_CREDENTIALS_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return { ok: false, reason: "서버 설정 오류: GCP_CREDENTIALS_JSON 또는 GOOGLE_APPLICATION_CREDENTIALS 필요" };
  }

  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${MODEL}:generateContent`;

  let token: string;
  try {
    const auth = getAuth();
    const client = await auth.getClient();
    const tokenRes = await client.getAccessToken();
    if (!tokenRes.token) throw new Error("토큰 발급 실패");
    token = tokenRes.token;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return { ok: false, reason: `서비스 계정 인증 실패: ${msg}` };
  }

  const body = {
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: imageBase64 } },
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      return { ok: false, reason: `Vertex AI 호출 실패 (${res.status}): ${errText.slice(0, 300)}` };
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return { ok: false, reason: "Vertex AI 응답에 텍스트가 없어요." };
    }
    const parsed = JSON.parse(text);
    return parseGeminiResponse(parsed);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, reason: "AI 응답이 25초 안에 오지 않았어요. 다시 시도해 주세요." };
    }
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return { ok: false, reason: `Vertex AI 호출 실패: ${msg}` };
  } finally {
    clearTimeout(timeoutId);
  }
}
