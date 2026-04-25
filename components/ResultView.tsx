"use client";

import { useEffect, useRef, useState } from "react";
import { ImposterPoint } from "@/lib/types";
import { renderImposters } from "@/lib/canvas-render";
import { DownloadIcon, RefreshIcon, SparkIcon, ShareIcon, ExpandIcon, CloseIcon } from "./Icons";

interface Props {
  imageDataUrl: string;
  imageWidth: number;
  imageHeight: number;
  points: ImposterPoint[];
  fitnessReason?: string;
  onReset: () => void;
  wide?: boolean;
}

export function ResultView({
  imageDataUrl,
  imageWidth,
  imageHeight,
  points,
  fitnessReason,
  onReset,
  wide,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showMarkers, setShowMarkers] = useState(false);
  const [zoomImg, setZoomImg] = useState<string | null>(null);

  useEffect(() => {
    if (!zoomImg) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomImg(null);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [zoomImg]);

  const handleZoom = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setZoomImg(canvas.toDataURL("image/png"));
  };

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

  const difficulty = points.length <= 3 ? "★★☆☆☆" : points.length <= 5 ? "★★★☆☆" : points.length <= 7 ? "★★★★☆" : "★★★★★";
  const estTime = points.length <= 3 ? "0m 30s" : points.length <= 5 ? "1m 00s" : points.length <= 7 ? "1m 40s" : "2m 30s";

  const imagePanel = (
    <div>
      <div ref={containerRef} style={{
        position: "relative",
        border: "1px solid var(--gi-line)",
        borderRadius: 16,
        overflow: "hidden",
        background: "var(--gi-bg-3)",
      }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
        {/* Hint markers — UI overlay only */}
        {showMarkers && points.map((pt, i) => (
          <div
            key={i}
            title={pt.reason}
            style={{
              position: "absolute",
              left: `${pt.x * 100}%`,
              top: `${pt.y * 100}%`,
              transform: "translate(-50%, -50%)",
              width: 14, height: 14,
              background: "var(--gi-red)",
              border: "1px solid rgba(255,255,255,0.4)",
              boxShadow: "0 0 0 3px rgba(255,77,94,0.25)",
              cursor: "help",
            }}
          />
        ))}
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <div className="gi-chip" style={{ background: "rgba(7,9,26,0.7)", backdropFilter: "blur(4px)" }}>
            <SparkIcon size={12} />
            합성 결과
          </div>
        </div>
        <button
          onClick={handleZoom}
          aria-label="확대"
          style={{
            position: "absolute", top: 12, right: 12,
            width: 34, height: 34, borderRadius: 8,
            background: "rgba(7,9,26,0.7)", backdropFilter: "blur(4px)",
            border: "1px solid var(--gi-line)", color: "var(--gi-fg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ExpandIcon size={16} />
        </button>
        <div style={{ position: "absolute", bottom: 12, right: 12 }}>
          <div className="gi-chip" style={{ background: "rgba(7,9,26,0.7)", backdropFilter: "blur(4px)", fontFamily: "var(--gi-font-mono)" }}>
            {imageWidth}×{imageHeight} · PNG
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => setShowMarkers(!showMarkers)}
          className={`gi-chip ${showMarkers ? "gi-chip-cyan" : ""}`}
          style={{ cursor: "pointer", border: "1px solid var(--gi-line)" }}
        >
          정답 보기: {showMarkers ? "ON" : "OFF"}
        </button>
        <div className="gi-chip">난이도: {difficulty}</div>
        <div className="gi-chip" style={{ fontFamily: "var(--gi-font-mono)" }}>{estTime}</div>
      </div>
    </div>
  );

  const infoPanel = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className="gi-chip gi-chip-red" style={{ alignSelf: "flex-start" }}>
        <SparkIcon size={10} /> 완성
      </div>
      <div className="gi-display" style={{ fontSize: wide ? 52 : 32, color: "var(--gi-fg)", lineHeight: 1.05, marginTop: 14 }}>
        <span style={{ color: "var(--gi-red)" }}>{points.length}</span>명이<br />숨어있어요
      </div>

      {/* AI explanation */}
      {fitnessReason && (
        <div style={{
          marginTop: 18,
          padding: "14px 16px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--gi-line)",
          borderRadius: 14,
          display: "flex", gap: 12,
        }}>
          <div style={{
            flexShrink: 0, width: 30, height: 30, borderRadius: 8,
            background: "rgba(255,77,94,0.15)", color: "var(--gi-red-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--gi-font-mono)", fontSize: 11, fontWeight: 700,
          }}>AI</div>
          <div style={{ color: "var(--gi-fg-2)", fontSize: 14, lineHeight: 1.55 }}>
            {fitnessReason}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: wide ? "1fr 1fr" : "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
        {[
          { k: "임포스터", v: `${points.length}명` },
          { k: "예상 검색 시간", v: estTime },
          ...(!wide ? [{ k: "난이도", v: difficulty }] : []),
        ].map((s, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--gi-line)",
            borderRadius: 10, padding: "10px 12px",
          }}>
            <div style={{ fontFamily: "var(--gi-font-mono)", fontSize: 10, color: "var(--gi-fg-3)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{s.k}</div>
            <div style={{ color: "var(--gi-fg)", fontSize: 16, fontWeight: 600, marginTop: 2 }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
        <button onClick={handleDownload} className="gi-btn gi-btn-primary gi-size-lg">
          <DownloadIcon size={18} />
          이미지 다운로드
        </button>
        <button onClick={onReset} className="gi-btn gi-btn-ghost gi-size-md">
          <RefreshIcon size={16} /> 다른 사진으로 다시
        </button>
      </div>

      {/* Share placeholder */}
      <div style={{
        marginTop: "auto", paddingTop: 16,
      }}>
        <div style={{
          padding: 12,
          border: "1px dashed var(--gi-line-strong)",
          borderRadius: 12,
          color: "var(--gi-fg-3)", fontSize: 12,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontFamily: "var(--gi-font-mono)", letterSpacing: "0.05em",
        }}>
          <span>SHARE — 곧 공개</span>
          <ShareIcon size={14} />
        </div>
      </div>
    </div>
  );

  const zoomModal = zoomImg ? (
    <div
      onClick={() => setZoomImg(null)}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(7,9,26,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, cursor: "zoom-out",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          maxWidth: "95vw", maxHeight: "95vh",
          cursor: "default",
        }}
      >
        <img
          src={zoomImg}
          alt="확대된 결과"
          style={{ display: "block", maxWidth: "95vw", maxHeight: "95vh", borderRadius: 8 }}
        />
        {showMarkers && points.map((pt, i) => (
          <div
            key={i}
            title={pt.reason}
            style={{
              position: "absolute",
              left: `${pt.x * 100}%`,
              top: `${pt.y * 100}%`,
              transform: "translate(-50%, -50%)",
              width: 18, height: 18,
              background: "var(--gi-red)",
              border: "2px solid rgba(255,255,255,0.5)",
              boxShadow: "0 0 0 4px rgba(255,77,94,0.3)",
              cursor: "help",
            }}
          />
        ))}
        <button
          onClick={() => setZoomImg(null)}
          aria-label="닫기"
          style={{
            position: "absolute", top: -14, right: -14,
            width: 38, height: 38, borderRadius: 19,
            background: "var(--gi-bg-2)", border: "1px solid var(--gi-line)",
            color: "var(--gi-fg)", display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <CloseIcon size={18} />
        </button>
      </div>
    </div>
  ) : null;

  if (wide) {
    return (
      <>
        <div className="gi-card" style={{ width: 1080, maxWidth: "100%", padding: 28, display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 28 }}>
          {imagePanel}
          {infoPanel}
        </div>
        {zoomModal}
      </>
    );
  }

  // Mobile — vertical stack
  return (
    <>
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div className="gi-chip gi-chip-red">
            <SparkIcon size={10} /> 완성
          </div>
        </div>
        <div className="gi-display" style={{ fontSize: 32, color: "var(--gi-fg)", lineHeight: 1.1 }}>
          <span style={{ color: "var(--gi-red)" }}>{points.length}</span>명이<br />숨어있어요
        </div>
      </div>

      <div style={{
        position: "relative",
        border: "1px solid var(--gi-line)",
        borderRadius: 16,
        overflow: "hidden",
        background: "var(--gi-bg-3)",
      }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "auto", display: "block" }} />
        {showMarkers && points.map((pt, i) => (
          <div
            key={i}
            title={pt.reason}
            style={{
              position: "absolute",
              left: `${pt.x * 100}%`,
              top: `${pt.y * 100}%`,
              transform: "translate(-50%, -50%)",
              width: 14, height: 14,
              background: "var(--gi-red)",
              border: "1px solid rgba(255,255,255,0.4)",
              boxShadow: "0 0 0 3px rgba(255,77,94,0.25)",
              cursor: "help",
            }}
          />
        ))}
        <button
          onClick={handleZoom}
          aria-label="확대"
          style={{
            position: "absolute", top: 10, right: 10,
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(7,9,26,0.7)", backdropFilter: "blur(4px)",
            border: "1px solid var(--gi-line)", color: "var(--gi-fg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <ExpandIcon size={15} />
        </button>
        <div style={{ position: "absolute", bottom: 10, right: 10 }}>
          <div className="gi-chip" style={{ background: "rgba(7,9,26,0.7)", backdropFilter: "blur(4px)" }}>
            {imageWidth}×{imageHeight}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button
          onClick={() => setShowMarkers(!showMarkers)}
          className={`gi-chip ${showMarkers ? "gi-chip-cyan" : ""}`}
          style={{ cursor: "pointer", border: "1px solid var(--gi-line)" }}
        >
          정답 보기: {showMarkers ? "ON" : "OFF"}
        </button>
      </div>

      {fitnessReason && (
        <div style={{
          marginTop: 14, padding: "12px 14px",
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 14 }}>
        {[
          { k: "임포스터", v: `${points.length}명` },
          { k: "난이도", v: difficulty },
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
    {zoomModal}
    </>
  );
}
