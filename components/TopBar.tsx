import { GiMark } from "./GiMark";

export function TopBar() {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 lg:px-8 lg:py-5"
      style={{
        borderBottom: "1px solid var(--gi-line)",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <GiMark size={24} />
        <div className="gi-display text-base lg:text-lg" style={{ color: "var(--gi-fg)" }}>
          The Great Imposter
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div className="gi-chip" style={{ fontSize: 10 }}>BETA</div>
      </div>
    </div>
  );
}
