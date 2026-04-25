export function PixelBg({ opacity = 0.5 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity,
        backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0),
          radial-gradient(1200px 600px at 80% -10%, rgba(255,77,94,0.08), transparent 60%),
          radial-gradient(900px 500px at -10% 110%, rgba(70,225,225,0.07), transparent 60%)
        `,
        backgroundSize: "16px 16px, 100% 100%, 100% 100%",
      }}
    />
  );
}
