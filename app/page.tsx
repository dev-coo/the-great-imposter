"use client";

import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { PixelBg } from "@/components/PixelBg";
import { DropZone } from "@/components/DropZone";
import { LoadingView } from "@/components/LoadingView";
import { ResultView } from "@/components/ResultView";
import { RejectView } from "@/components/RejectView";
import { ErrorView } from "@/components/ErrorView";
import { AnalyzeResponse, ImposterPoint } from "@/lib/types";
import { UploadIcon, ImageIcon } from "@/components/Icons";

type State =
  | { kind: "idle" }
  | { kind: "loading"; imageDataUrl: string }
  | {
      kind: "result";
      imageDataUrl: string;
      width: number;
      height: number;
      points: ImposterPoint[];
      fitnessReason?: string;
    }
  | { kind: "reject"; imageDataUrl: string; reason: string }
  | { kind: "error"; imageDataUrl: string; file: File; width: number; height: number };

export default function Home() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [lastFile, setLastFile] = useState<{ file: File; dataUrl: string; width: number; height: number } | null>(null);

  const handleFile = async (
    file: File,
    dataUrl: string,
    width: number,
    height: number,
  ) => {
    setLastFile({ file, dataUrl, width, height });
    setState({ kind: "loading", imageDataUrl: dataUrl });

    const base64 = dataUrl.split(",")[1] ?? "";
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      const data = (await res.json()) as AnalyzeResponse;
      if (data.ok) {
        setState({
          kind: "result",
          imageDataUrl: dataUrl,
          width,
          height,
          points: data.points,
          fitnessReason: data.fitnessReason,
        });
      } else {
        setState({ kind: "reject", imageDataUrl: dataUrl, reason: data.reason });
      }
    } catch {
      setState({ kind: "error", imageDataUrl: dataUrl, file, width, height });
    }
  };

  const reset = () => setState({ kind: "idle" });

  const retry = () => {
    if (lastFile) {
      handleFile(lastFile.file, lastFile.dataUrl, lastFile.width, lastFile.height);
    }
  };

  // Idle content for mobile
  const idleMobileContent = (
    <>
      <div style={{ padding: "24px 20px 32px" }}>
        <div className="gi-chip gi-chip-cyan" style={{ marginBottom: 14 }}>
          <span className="gi-dot" style={{ background: "var(--gi-cyan)" }} />
          워터마크 모드
        </div>
        <div className="gi-display" style={{ fontSize: 30, color: "var(--gi-fg)", marginBottom: 12 }}>
          이 사진엔 임포스터가<br />
          몇 명이나 <span style={{ color: "var(--gi-red)" }}>숨을 수 있을까?</span>
        </div>
        <div style={{ color: "var(--gi-fg-2)", fontSize: 14, lineHeight: 1.6 }}>
          AI가 사진 속 자연스러운 자리에 작은 픽셀 친구들을 박아넣어 드려요.
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        <DropZone onFileSelected={handleFile} />
      </div>

      {/* How it works */}
      <div style={{ padding: "32px 20px 24px" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--gi-font-mono)", fontSize: 11, letterSpacing: "0.14em", color: "var(--gi-cyan)", textTransform: "uppercase" as const, marginBottom: 8 }}>
            How it works
          </div>
          <div className="gi-display" style={{ fontSize: 22, color: "var(--gi-fg)" }}>어떻게 작동하나요?</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { n: 1, title: "사진을 올려요", desc: "배경이 복잡한 사진일수록 잘 숨길 수 있어요." },
            { n: 2, title: "AI가 위치를 찾아요", desc: "잎사귀, 무늬, 그림자 — 자연스러운 자리를 골라줘요." },
            { n: 3, title: "합성된 이미지를 받아요", desc: "PNG로 다운로드해서 친구한테 보내고 찾기 게임!" },
          ].map((step) => (
            <div key={step.n} style={{
              display: "flex", alignItems: "flex-start", gap: 14, padding: 14,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--gi-line)", borderRadius: 14,
            }}>
              <div style={{
                width: 30, height: 30, flexShrink: 0, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(70,225,225,0.1)", border: "1px solid rgba(70,225,225,0.3)",
                color: "var(--gi-cyan)", fontFamily: "var(--gi-font-mono)", fontSize: 12, fontWeight: 700,
              }}>
                {String(step.n).padStart(2, "0")}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: "var(--gi-fg)", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{step.title}</div>
                <div style={{ color: "var(--gi-fg-3)", fontSize: 13, lineHeight: 1.5 }}>{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "8px 20px 24px", color: "var(--gi-fg-4)", fontSize: 11, fontFamily: "var(--gi-font-mono)" }}>
        NO ACCOUNT NEEDED · IMAGES ARE NOT STORED
      </div>
    </>
  );

  // Desktop idle: 2-column
  const idleDesktopContent = (
    <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 0 }}>
      {/* Left — pitch + steps */}
      <div style={{ padding: "60px 56px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="gi-chip gi-chip-cyan" style={{ alignSelf: "flex-start", marginBottom: 18 }}>
          <span className="gi-dot" /> WATERMARK MODE · v0.1
        </div>
        <div className="gi-display" style={{ fontSize: 56, color: "var(--gi-fg)", lineHeight: 1.04 }}>
          이 사진엔 임포스터가<br />
          몇 명이나{" "}
          <span style={{ color: "var(--gi-red)" }}>숨을 수 있을까?</span>
        </div>
        <div style={{ color: "var(--gi-fg-2)", fontSize: 17, marginTop: 18, maxWidth: 480, lineHeight: 1.6 }}>
          사진을 올리면 AI가 가장 자연스러운 자리를 골라 작은 픽셀 친구들을 박아넣어 드려요. 친구한테 보내고 — &ldquo;찾아봐!&rdquo;
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 36, maxWidth: 540 }}>
          {[
            { n: 1, t: "업로드", d: "PNG · JPEG · WEBP" },
            { n: 2, t: "AI 분석", d: "자연스러운 자리 추천" },
            { n: 3, t: "다운로드", d: "합성된 PNG" },
          ].map((s) => (
            <div key={s.n} style={{
              padding: 14, background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--gi-line)", borderRadius: 14,
            }}>
              <div style={{ fontFamily: "var(--gi-font-mono)", fontSize: 11, color: "var(--gi-cyan)", letterSpacing: "0.1em" }}>
                {String(s.n).padStart(2, "0")}
              </div>
              <div style={{ color: "var(--gi-fg)", fontWeight: 600, marginTop: 6, fontSize: 14 }}>{s.t}</div>
              <div style={{ color: "var(--gi-fg-3)", fontSize: 12, marginTop: 4, fontFamily: "var(--gi-font-mono)", letterSpacing: "0.02em" }}>
                {s.d}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 32, color: "var(--gi-fg-4)", fontSize: 11, fontFamily: "var(--gi-font-mono)", letterSpacing: "0.1em" }}>
          NO ACCOUNT · IMAGES ARE NOT STORED · MIT
        </div>
      </div>

      {/* Right — drop zone card */}
      <div style={{ padding: "48px 56px 48px 0", display: "flex", alignItems: "center" }}>
        <div className="gi-card" style={{ width: "100%", padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
            <div className="gi-display" style={{ fontSize: 18, color: "var(--gi-fg)" }}>사진 올리기</div>
            <div className="gi-chip" style={{ fontFamily: "var(--gi-font-mono)" }}>STEP 01</div>
          </div>
          <DropZone onFileSelected={handleFile} />
          <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--gi-fg-3)", fontSize: 12 }}>
            <span>· 워터마크 모드는 무료예요</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Active state content (loading/result/reject/error) — same for mobile, wrapped in card for desktop
  const activeContent = () => {
    switch (state.kind) {
      case "loading":
        return <LoadingView imageDataUrl={state.imageDataUrl} />;
      case "result":
        return (
          <ResultView
            imageDataUrl={state.imageDataUrl}
            imageWidth={state.width}
            imageHeight={state.height}
            points={state.points}
            fitnessReason={state.fitnessReason}
            onReset={reset}
          />
        );
      case "reject":
        return (
          <RejectView
            imageDataUrl={state.imageDataUrl}
            reason={state.reason}
            onReset={reset}
          />
        );
      case "error":
        return <ErrorView onRetry={retry} onReset={reset} />;
      default:
        return null;
    }
  };

  const isActive = state.kind !== "idle";
  const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;

  return (
    <div style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      <PixelBg />
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <TopBar wide={isActive ? false : undefined} />

        {/* Mobile layout */}
        <div className="block lg:hidden" style={{ flex: 1 }}>
          {state.kind === "idle" ? (
            idleMobileContent
          ) : (
            <div style={{ padding: "20px 20px 32px" }}>
              {activeContent()}
            </div>
          )}
        </div>

        {/* Desktop layout */}
        <div className="hidden lg:flex" style={{ flex: 1 }}>
          {state.kind === "idle" ? (
            idleDesktopContent
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 56px" }}>
              <div className="gi-card" style={{ width: "100%", maxWidth: 880, padding: 28 }}>
                {activeContent()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
