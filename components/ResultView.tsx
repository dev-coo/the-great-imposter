"use client";

import { useEffect, useRef } from "react";
import { ImposterPoint } from "@/lib/types";
import { renderImposters } from "@/lib/canvas-render";
import { DownloadIcon, RefreshIcon, SparkIcon, ShareIcon } from "./Icons";

interface Props {
  imageDataUrl: string;
  imageWidth: number;
  imageHeight: number;
  points: ImposterPoint[];
  fitnessReason?: string;
  onReset: () => void;
}

export function ResultView({
  imageDataUrl,
  imageWidth,
  imageHeight,
  points,
  fitnessReason,
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

  const difficulty = points.length <= 3 ? "★★☆☆��" : points.length <= 5 ? "★★★☆☆" : points.length <= 7 ? "★★��★☆" : "★★★★★";
  const estTime = points.length <= 3 ? "0m 30s" : points.length <= 5 ? "1m 00s" : points.length <= 7 ? "1m 40s" : "2m 30s";

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div className="gi-chip gi-chip-red">
            <SparkIcon size={10} />
            완성
          </div>
        </div>
        <div className="gi-display" style={{ fontSize: 32, color: "var(--gi-fg)", lineHeight: 1.1 }}>
          <span style={{ color: "var(--gi-red)" }}>{points.length}</span>명이<br />숨어있어요
        </div>
      </div>

      {/* Result image */}
      <div style={{
        position: "relative",
        border: "1px solid var(--gi-line)",
        borderRadius: 16,
        overflow: "hidden",
        background: "var(--gi-bg-3)",
      }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
        <div style={{ position: "absolute", bottom: 10, right: 10 }}>
          <div className="gi-chip" style={{ background: "rgba(7,9,26,0.7)", backdropFilter: "blur(4px)" }}>
            {imageWidth}×{imageHeight}
          </div>
        </div>
      </div>

      {/* AI explanation */}
      {fitnessReason && (
        <div style={{
          marginTop: 14,
          padding: "12px 14px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--gi-line)",
          borderRadius: 12,
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <div style={{
            flexShrink: 0, width: 26, height: 26, borderRadius: 8,
            background: "rgba(255,77,94,0.15)", color: "var(--gi-red-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--gi-font-mono)", fontSize: 11, fontWeight: 700,
          }}>AI</div>
          <div style={{ color: "var(--gi-fg-2)", fontSize: 13, lineHeight: 1.55 }}>
            {fitnessReason}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
        {[
          { k: "임포스터", v: `${points.length}명` },
          { k: "난이���", v: difficulty },
          { k: "예상 검색 시간", v: estTime },
        ].map((s, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--gi-line)",
            borderRadius: 10, padding: "10px 12px",
          }}>
            <div style={{ fontFamily: "var(--gi-font-mono)", fontSize: 10, color: "var(--gi-fg-3)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{s.k}</div>
            <div style={{ color: "var(--gi-fg)", fontSize: 14, fontWeight: 600, marginTop: 2 }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
        <button onClick={handleDownload} className="gi-btn gi-btn-primary gi-size-lg" style={{ width: "100%" }}>
          <DownloadIcon size={18} />
          이미지 다운로드
        </button>
        <button onClick={onReset} className="gi-btn gi-btn-ghost gi-size-md" style={{ width: "100%" }}>
          <RefreshIcon size={16} />
          다른 사진으로 다시
        </button>
      </div>

      {/* Share placeholder */}
      <div style={{
        marginTop: 20, padding: 14,
        border: "1px dashed var(--gi-line-strong)",
        borderRadius: 14,
        color: "var(--gi-fg-3)", fontSize: 12,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: "var(--gi-font-mono)", letterSpacing: "0.05em",
      }}>
        <span>SHARE — 곧 공개</span>
        <ShareIcon size={14} />
      </div>
    </div>
  );
}
