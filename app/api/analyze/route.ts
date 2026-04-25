import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/gemini/client";
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
