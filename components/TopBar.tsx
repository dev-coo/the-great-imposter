import { GiMark } from "./GiMark";

export function TopBar() {
  return (
    <div className="gi-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <GiMark size={24} />
        <div className="gi-display gi-topbar-title" style={{ fontSize: 16, color: "var(--gi-fg)" }}>
          The Great Imposter
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div className="gi-chip" style={{ fontSize: 10 }}>BETA</div>
      </div>
    </div>
  );
}
