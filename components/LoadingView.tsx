"use client";

import { useEffect, useState } from "react";

interface Props {
  imageDataUrl: string;
}

const STEPS = [
  { d: "사진 분석", key: "analyze" },
  { d: "후보 자리 찾는 중", key: "candidates" },
  { d: "픽셀 합성", key: "compose" },
];

const MONOLOGUES = [
  "잎사귀 사이가 잘 숨겨질 것 같아요…",
  "그림자 아래가 딱이네요…",
  "여기 무늬가 복잡해서 눈에 안 띌 거예요…",
  "이 자리가 제일 자연스러울 것 같아요…",
];

export function LoadingView({ imageDataUrl }: Props) {
  const [progress, setProgress] = useState(10);
  const [stepIdx, setStepIdx] = useState(0);
  const [monologue, setMonologue] = useState(MONOLOGUES[0]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => { setProgress(35); setStepIdx(1); }, 1500));
    timers.push(setTimeout(() => { setProgress(62); setMonologue(MONOLOGUES[1]); }, 3000));
    timers.push(setTimeout(() => { setProgress(78); setMonologue(MONOLOGUES[2]); }, 5000));
    timers.push(setTimeout(() => { setProgress(88); setStepIdx(2); setMonologue(MONOLOGUES[3]); }, 7000));
    return () => timers.forEach(clearTimeout);
  }, []);

  const stepState = (i: number) => {
    if (i < stepIdx) return "done";
    if (i === stepIdx) return "active";
    return "wait";
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <div className="gi-chip gi-chip-cyan">
          <span className="gi-dot" />
          ANALYZING
        </div>
        <div className="gi-display" style={{ fontSize: 26, color: "var(--gi-fg)", marginTop: 14, lineHeight: 1.2 }}>
          숨을 곳을<br />찾는 중<span style={{ color: "var(--gi-cyan)" }}>...</span>
        </div>
        <div style={{ color: "var(--gi-fg-2)", fontSize: 13, marginTop: 8 }}>
          평균 8–15초 정도 걸려요.
        </div>
      </div>

      {/* Preview with scan line */}
      <div style={{
        position: "relative",
        border: "1px solid var(--gi-line)",
        borderRadius: 16,
        overflow: "hidden",
        aspectRatio: "4/3",
      }}>
        <img
          src={imageDataUrl}
          alt="분석 중"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Corner brackets */}
        {(["tl", "tr", "bl", "br"] as const).map((p) => {
          const pos = {
            tl: { top: 10, left: 10, borderTopWidth: 2, borderLeftWidth: 2 },
            tr: { top: 10, right: 10, borderTopWidth: 2, borderRightWidth: 2 },
            bl: { bottom: 10, left: 10, borderBottomWidth: 2, borderLeftWidth: 2 },
            br: { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2 },
          }[p];
          return (
            <div
              key={p}
              style={{
                position: "absolute", width: 18, height: 18,
                borderColor: "var(--gi-cyan)", borderStyle: "solid", borderWidth: 0,
                opacity: 0.9, ...pos,
              }}
            />
          );
        })}
        <div className="gi-scan-line" />
        {/* Candidate dots */}
        <div style={{ position: "absolute", top: "32%", left: "22%", width: 10, height: 10, borderRadius: 999, background: "var(--gi-cyan)", boxShadow: "0 0 0 4px rgba(70,225,225,0.2)" }} />
        <div style={{ position: "absolute", top: "61%", left: "70%", width: 8, height: 8, borderRadius: 999, background: "var(--gi-cyan)", boxShadow: "0 0 0 4px rgba(70,225,225,0.2)" }} />
        <div style={{ position: "absolute", top: "44%", left: "53%", width: 6, height: 6, borderRadius: 999, background: "var(--gi-fg-3)", opacity: 0.5 }} />
      </div>

      {/* Progress */}
      <div style={{ marginTop: 22 }}>
        <div className="gi-progress"><div className="gi-progress-bar" style={{ width: `${progress}%` }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "var(--gi-font-mono)", fontSize: 11, color: "var(--gi-fg-3)", letterSpacing: "0.05em" }}>
          <span>STEP {String(stepIdx + 1).padStart(2, "0")} / 03</span>
          <span>{progress}%</span>
        </div>
      </div>

      {/* Step list */}
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 6 }}>
        {STEPS.map((s, i) => {
          const st = stepState(i);
          return (
            <div key={s.key} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px",
              background: st === "active" ? "rgba(70,225,225,0.06)" : "transparent",
              border: "1px solid",
              borderColor: st === "active" ? "rgba(70,225,225,0.3)" : "var(--gi-line)",
              borderRadius: 10,
              color: st === "wait" ? "var(--gi-fg-3)" : "var(--gi-fg)",
              fontSize: 13,
            }}>
              <div style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                background: st === "done" ? "var(--gi-cyan)" : "transparent",
                border: st === "active" ? "1.5px dashed var(--gi-cyan)" : st === "done" ? "none" : "1.5px solid var(--gi-fg-4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#042020", fontSize: 10,
              }}>
                {st === "done" && "✓"}
              </div>
              <div style={{ flex: 1 }}>{s.d}</div>
              <div style={{ fontFamily: "var(--gi-font-mono)", fontSize: 11, color: "var(--gi-fg-3)" }}>
                {st === "done" ? "✓" : st === "active" ? "..." : "—"}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 16, textAlign: "center",
        color: "var(--gi-fg-3)", fontSize: 12, fontStyle: "italic",
      }}>
        &ldquo;{monologue}&rdquo;
      </div>
    </div>
  );
}
