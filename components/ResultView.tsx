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
