"use client";

import { AlertIcon, RefreshIcon } from "./Icons";

interface Props {
  imageDataUrl: string;
  reason: string;
  onReset: () => void;
  onRetryAnyway?: () => void;
}

const CHECKLIST = [
  { ok: false, t: "복잡한 배경 (무늬·텍스처·잎)" },
  { ok: true, t: "충분한 해상도 (≥ 400px)" },
  { ok: false, t: "적당한 명암 차이" },
];

export function RejectView({ imageDataUrl, reason, onReset, onRetryAnyway }: Props) {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 20 }}>
        <div className="gi-chip" style={{ background: "rgba(255,180,84,0.1)", borderColor: "rgba(255,180,84,0.4)", color: "#FFD08A" }}>
          <AlertIcon size={12} />
          숨을 자리가 부족해요
        </div>
        <div className="gi-display" style={{ fontSize: 28, color: "var(--gi-fg)", marginTop: 14, lineHeight: 1.15 }}>
          이 사진은<br />너무 잘 보일 것 같아요
        </div>
        <div style={{ color: "var(--gi-fg-2)", fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
          {reason}
        </div>
      </div>

      {/* Image with overlay */}
      <div style={{
        position: "relative",
        border: "1px solid var(--gi-line)",
        borderRadius: 16,
        overflow: "hidden",
        aspectRatio: "4/3",
      }}>
        <img
          src={imageDataUrl}
          alt="거부된 이미지"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "rgba(7,9,26,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div className="gi-chip gi-chip-red" style={{ fontSize: 12 }}>REJECTED</div>
        </div>
      </div>

      {/* Checklist */}
      <div style={{
        marginTop: 16,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--gi-line)",
        borderRadius: 12, padding: 14,
      }}>
        <div style={{ fontFamily: "var(--gi-font-mono)", fontSize: 10, letterSpacing: "0.08em", color: "var(--gi-fg-3)", textTransform: "uppercase" as const, marginBottom: 8 }}>
          CHECKLIST
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {CHECKLIST.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: item.ok ? "var(--gi-fg)" : "var(--gi-fg-3)" }}>
              <div style={{
                width: 16, height: 16, borderRadius: 4,
                background: item.ok ? "var(--gi-cyan)" : "transparent",
                border: item.ok ? "none" : "1.5px solid var(--gi-fg-4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#042020", fontSize: 10,
              }}>{item.ok ? "✓" : ""}</div>
              {item.t}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
        <button onClick={onReset} className="gi-btn gi-btn-primary gi-size-lg" style={{ width: "100%" }}>
          <RefreshIcon size={16} />
          다른 사진으로 시도하기
        </button>
        {onRetryAnyway && (
          <button onClick={onRetryAnyway} className="gi-btn gi-btn-ghost gi-size-md" style={{ width: "100%" }}>
            그래도 시도해볼래요
          </button>
        )}
      </div>
    </div>
  );
}
