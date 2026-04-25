"use client";

import { useEffect, useRef, useState } from "react";
import { DropZone } from "@/components/DropZone";
import type { BoundaryObject, BoundaryResponse } from "@/lib/gemini/boundary";

const COLORS = [
  "#ef4444",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

type State =
  | { kind: "idle" }
  | { kind: "loading"; dataUrl: string }
  | {
      kind: "result";
      dataUrl: string;
      width: number;
      height: number;
      objects: BoundaryObject[];
    }
  | { kind: "error"; reason: string };

export default function BoundaryTestPage() {
  const [state, setState] = useState<State>({ kind: "idle" });

  const handleFile = async (
    file: File,
    dataUrl: string,
    width: number,
    height: number,
  ) => {
    setState({ kind: "loading", dataUrl });
    const base64 = dataUrl.split(",")[1] ?? "";
    try {
      const res = await fetch("/api/boundary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      const data = (await res.json()) as BoundaryResponse;
      if (data.ok) {
        setState({ kind: "result", dataUrl, width, height, objects: data.objects });
      } else {
        setState({ kind: "error", reason: data.reason });
      }
    } catch {
      setState({ kind: "error", reason: "네트워크 오류가 발생했어요." });
    }
  };

  const reset = () => setState({ kind: "idle" });

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-2">경계선 추출 테스트</h1>
      <p className="text-center text-gray-600 mb-8">
        Gemini 2.5 Flash 세그멘테이션 마스크로 객체 윤곽을 그립니다.
      </p>

      {state.kind === "idle" && <DropZone onFileSelected={handleFile} />}

      {state.kind === "loading" && (
        <div className="max-w-2xl mx-auto text-center">
          <img src={state.dataUrl} alt="업로드한 이미지" className="rounded-xl mx-auto opacity-60" />
          <p className="mt-6 text-lg text-gray-700">경계선 추출 중…</p>
        </div>
      )}

      {state.kind === "result" && (
        <BoundaryCanvas
          dataUrl={state.dataUrl}
          width={state.width}
          height={state.height}
          objects={state.objects}
          onReset={reset}
        />
      )}

      {state.kind === "error" && (
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-red-600">{state.reason}</p>
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

interface CanvasProps {
  dataUrl: string;
  width: number;
  height: number;
  objects: BoundaryObject[];
  onReset: () => void;
}

function BoundaryCanvas({ dataUrl, width, height, objects, onReset }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const baseImg = new Image();
    baseImg.onload = async () => {
      if (cancelled) return;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(baseImg, 0, 0);

      const errs: string[] = [];
      for (let i = 0; i < objects.length; i++) {
        try {
          await drawMaskBoundary(ctx, objects[i], width, height, COLORS[i % COLORS.length]);
        } catch (e) {
          errs.push(`${objects[i].label}: ${e instanceof Error ? e.message : "마스크 디코드 실패"}`);
        }
      }
      if (!cancelled) setWarnings(errs);
    };
    baseImg.src = dataUrl;
    return () => {
      cancelled = true;
    };
  }, [dataUrl, width, height, objects]);

  return (
    <div className="max-w-4xl mx-auto">
      <canvas ref={canvasRef} className="w-full h-auto rounded-xl border border-gray-200" />
      <div className="mt-4 flex flex-wrap gap-2">
        {objects.map((o, i) => (
          <span
            key={i}
            className="px-3 py-1 rounded text-sm text-white font-medium"
            style={{ backgroundColor: COLORS[i % COLORS.length] }}
          >
            {o.label}
          </span>
        ))}
      </div>
      {warnings.length > 0 && (
        <ul className="mt-4 text-sm text-amber-700 list-disc pl-6">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      )}
      <button
        onClick={onReset}
        className="mt-6 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
      >
        다른 사진
      </button>
    </div>
  );
}

async function drawMaskBoundary(
  ctx: CanvasRenderingContext2D,
  obj: BoundaryObject,
  imgW: number,
  imgH: number,
  color: string,
): Promise<void> {
  const [y0, x0, y1, x1] = obj.box_2d;
  const bx = (Math.min(x0, x1) / 1000) * imgW;
  const by = (Math.min(y0, y1) / 1000) * imgH;
  const bw = (Math.abs(x1 - x0) / 1000) * imgW;
  const bh = (Math.abs(y1 - y0) / 1000) * imgH;
  if (bw <= 0 || bh <= 0) return;

  const src = obj.mask.startsWith("data:")
    ? obj.mask
    : `data:image/png;base64,${obj.mask}`;

  const maskImg = await loadImage(src);
  const off = document.createElement("canvas");
  off.width = maskImg.width;
  off.height = maskImg.height;
  const offCtx = off.getContext("2d");
  if (!offCtx) throw new Error("offscreen ctx 없음");
  offCtx.drawImage(maskImg, 0, 0);
  const { data } = offCtx.getImageData(0, 0, maskImg.width, maskImg.height);

  const w = maskImg.width;
  const h = maskImg.height;
  const isIn = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    const i = (y * w + x) * 4;
    // 일부 모델은 알파, 일부는 R 채널을 마스크로 사용
    return data[i + 3] > 128 || data[i] > 128;
  };

  const scaleX = bw / w;
  const scaleY = bh / h;
  const dotW = Math.max(1, Math.ceil(scaleX));
  const dotH = Math.max(1, Math.ceil(scaleY));

  // 반투명 채움
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = color;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (isIn(x, y)) {
        ctx.fillRect(bx + x * scaleX, by + y * scaleY, dotW, dotH);
      }
    }
  }
  ctx.restore();

  // 윤곽 픽셀 (in이지만 이웃 중 하나라도 out)
  ctx.fillStyle = color;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!isIn(x, y)) continue;
      if (
        !isIn(x - 1, y) ||
        !isIn(x + 1, y) ||
        !isIn(x, y - 1) ||
        !isIn(x, y + 1)
      ) {
        ctx.fillRect(bx + x * scaleX, by + y * scaleY, dotW, dotH);
      }
    }
  }

  // 라벨
  const fontSize = Math.max(14, Math.round(imgW / 60));
  ctx.font = `bold ${fontSize}px sans-serif`;
  const padding = 4;
  const textW = ctx.measureText(obj.label).width;
  ctx.fillStyle = color;
  ctx.fillRect(bx, by, textW + padding * 2, fontSize + padding * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(obj.label, bx + padding, by + fontSize + padding - 2);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("마스크 이미지 로드 실패"));
    img.src = src;
  });
}
