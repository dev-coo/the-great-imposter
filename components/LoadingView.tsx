"use client";

import { useEffect, useState } from "react";

interface Props {
  imageDataUrl: string;
  wide?: boolean;
}

const STEPS = [
  { d: "사진 분석", key: "analyze" },
  { d: "후보 자리 찾는 중", key: "candidates" },
  { d: "픽셀 합성", key: "compose" },
];

const MONOLOGUES = [
  "조용히 잠입 중…",
  "Sus한 자리 물색 중…",
  "환풍구 통과… 발소리 죽이고…",
  "Crewmate인 척 연기 시작…",
];

export function LoadingView({ imageDataUrl, wide }: Props) {
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

  const imagePanel = (
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
              position: "absolute", width: 22, height: 22,
              borderColor: "var(--gi-cyan)", borderStyle: "solid", borderWidth: 0,
              opacity: 0.9, ...pos,
            }}
          />
        );
      })}
      <div className="gi-scan-line" />
      <div style={{ position: "absolute", top: "32%", left: "22%", width: 10, height: 10, borderRadius: 999, background: "var(--gi-cyan)", boxShadow: "0 0 0 4px rgba(70,225,225,0.2)" }} />
      <div style={{ position: "absolute", top: "61%", left: "70%", width: 8, height: 8, borderRadius: 999, background: "var(--gi-cyan)", boxShadow: "0 0 0 4px rgba(70,225,225,0.2)" }} />
      <div style={{ position: "absolute", top: "44%", left: "53%", width: 6, height: 6, borderRadius: 999, background: "var(--gi-fg-3)", opacity: 0.5 }} />
      <div style={{ position: "absolute", bottom: 12, left: 12 }}>
        <div className="gi-chip gi-chip-cyan" style={{ fontFamily: "var(--gi-font-mono)" }}>
          <span className="gi-dot" /> SCANNING
        </div>
      </div>
    </div>
  );

  const statusPanel = (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div className="gi-display" style={{ fontSize: wide ? 32 : 26, color: "var(--gi-fg)", lineHeight: wide ? 1.15 : 1.2 }}>
        숨을 곳을<br />찾는 중<span style={{ color: "var(--gi-cyan)" }}>...</span>
      </div>
      <div style={{ color: "var(--gi-fg-2)", fontSize: wide ? 14 : 13, marginTop: wide ? 10 : 8, lineHeight: 1.55 }}>
        &ldquo;{monologue}&rdquo;
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="gi-progress"><div className="gi-progress-bar" style={{ width: `${progress}%` }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "var(--gi-font-mono)", fontSize: 11, color: "var(--gi-fg-3)", letterSpacing: "0.06em" }}>
          <span>STEP {String(stepIdx + 1).padStart(2, "0")} / 03 · {STEPS[stepIdx].d}</span>
          <span>{progress}%</span>
        </div>
      </div>

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
    </div>
  );

  if (wide) {
    return (
      <div className="gi-card" style={{ width: 880, maxWidth: "100%", padding: 28, display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 28 }}>
        {imagePanel}
        {statusPanel}
      </div>
    );
  }

  // Mobile
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

      {imagePanel}

      <div style={{ marginTop: 22 }}>
        <div className="gi-progress"><div className="gi-progress-bar" style={{ width: `${progress}%` }} /></div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "var(--gi-font-mono)", fontSize: 11, color: "var(--gi-fg-3)", letterSpacing: "0.05em" }}>
          <span>STEP {String(stepIdx + 1).padStart(2, "0")} / 03</span>
          <span>{progress}%</span>
        </div>
      </div>

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

      <div style={{ marginTop: 16, textAlign: "center", color: "var(--gi-fg-3)", fontSize: 12, fontStyle: "italic" }}>
        &ldquo;{monologue}&rdquo;
      </div>
    </div>
  );
}
