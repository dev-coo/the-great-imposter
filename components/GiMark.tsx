interface Props {
  size?: number;
  accent?: string;
}

export function GiMark({ size = 28, accent = "#FF4D5E" }: Props) {
  const cell = size / 4;
  const grid = [
    [1, 1, 1, 1],
    [1, 1, 2, 1],
    [1, 1, 1, 1],
    [1, 1, 1, 1],
  ];
  const inset = 0.5;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      {grid.map((row, y) =>
        row.map((v, x) =>
          v ? (
            <rect
              key={`${x}-${y}`}
              x={x * cell + inset}
              y={y * cell + inset}
              width={cell - inset * 2}
              height={cell - inset * 2}
              fill={v === 2 ? accent : "#EDEEF3"}
              rx={0.5}
            />
          ) : null
        )
      )}
    </svg>
  );
}
