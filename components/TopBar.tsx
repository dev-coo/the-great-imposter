import { GiMark } from "./GiMark";

interface Props {
  wide?: boolean;
}

export function TopBar({ wide = false }: Props) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: wide ? "20px 32px" : "16px 20px",
        borderBottom: "1px solid var(--gi-line)",
        position: "relative",
        zIndex: 2,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <GiMark size={24} />
        <div className="gi-display" style={{ fontSize: wide ? 18 : 16, color: "var(--gi-fg)" }}>
          The Great Imposter
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div className="gi-chip" style={{ fontSize: 10 }}>BETA</div>
      </div>
    </div>
  );
}
