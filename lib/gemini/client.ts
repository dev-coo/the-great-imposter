import { GoogleAuth } from "google-auth-library";
import { AnalyzeResponse } from "../types";
import { PROMPT } from "./prompt";
import { RESPONSE_SCHEMA, parseGeminiResponse } from "./schema";

const MODEL = "gemini-2.5-flash";

let cachedAuth: GoogleAuth | null = null;
function getAuth(): GoogleAuth {
  if (!cachedAuth) {
    cachedAuth = new GoogleAuth({
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
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return { ok: false, reason: "서버 설정 오류: GOOGLE_APPLICATION_CREDENTIALS 누락" };
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
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
    const msg = err instanceof Error ? err.message : "알 수 없는 오류";
    return { ok: false, reason: `Vertex AI 호출 실패: ${msg}` };
  }
}
