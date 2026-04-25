"use client";

import { PlugIcon, RefreshIcon } from "./Icons";

interface Props {
  onRetry: () => void;
  onReset: () => void;
  wide?: boolean;
}

export function ErrorView({ onRetry, onReset, wide }: Props) {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

  const content = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: wide ? "36px" : "40px 0" }}>
      <div style={{
        width: wide ? 80 : 72, height: wide ? 80 : 72, borderRadius: wide ? 20 : 18,
        background: "rgba(255,90,110,0.1)",
        border: "1px solid rgba(255,90,110,0.3)",
        color: "var(--gi-err)",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 22,
      }}>
        <PlugIcon size={wide ? 32 : 28} />
      </div>
      <div className="gi-display" style={{ fontSize: wide ? 30 : 26, color: "var(--gi-fg)", marginBottom: 10 }}>
        연결이 끊겼어요
      </div>
      <div style={{ color: "var(--gi-fg-2)", fontSize: 14, lineHeight: 1.6, maxWidth: 260, marginBottom: 22 }}>
        서버랑 인사하다가 길을 잃었어요.<br />잠시 후 다시 시도해 주세요.
      </div>

      <div style={{
        width: "100%", maxWidth: 280,
        background: "rgba(255,255,255,0.02)",
        border: "1px solid var(--gi-line)",
        borderRadius: 12, padding: 12,
        fontFamily: "var(--gi-font-mono)", fontSize: 11, color: "var(--gi-fg-3)",
        textAlign: "left", marginBottom: 22,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span>STATUS</span><span style={{ color: "var(--gi-err)" }}>503 BUSY</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span>REQ_ID</span><span>img_{Math.random().toString(36).slice(2, 8)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>TIME</span><span>{time}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button onClick={onRetry} className="gi-btn gi-btn-primary gi-size-md">
          <RefreshIcon size={16} /> 다시 시도하기
        </button>
        <button onClick={onReset} className="gi-btn gi-btn-ghost gi-size-md">처음으로</button>
      </div>
    </div>
  );

  if (wide) {
    return (
      <div className="gi-card" style={{ width: 540, maxWidth: "100%", overflow: "hidden" }}>
        {content}
      </div>
    );
  }

  return content;
}
