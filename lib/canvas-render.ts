import { ImposterPoint } from "./types";
import {
  IMPOSTER_PATTERN,
  PATTERN_SIZE,
  PALETTE,
} from "./imposter-pattern";

const IMPOSTER_ALPHA = 0.85;
const DETAIL_DARKEN = 0.35;

interface RGB {
  r: number;
  g: number;
  b: number;
}

const PALETTE_RGB: { name: keyof typeof PALETTE; rgb: RGB }[] = (
  Object.keys(PALETTE) as (keyof typeof PALETTE)[]
).map((name) => ({ name, rgb: hexToRgb(PALETTE[name]) }));

function hexToRgb(hex: string): RGB {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

function averageRgb(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  imageWidth: number,
  imageHeight: number,
): RGB | null {
  const sx = Math.max(0, Math.min(x, imageWidth - 1));
  const sy = Math.max(0, Math.min(y, imageHeight - 1));
  const sw = Math.max(1, Math.min(w, imageWidth - sx));
  const sh = Math.max(1, Math.min(h, imageHeight - sy));
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(sx, sy, sw, sh).data;
  } catch {
    return null;
  }
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }
  if (count === 0) return null;
  return { r: r / count, g: g / count, b: b / count };
}

function darken(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${Math.round(r * factor)}, ${Math.round(g * factor)}, ${Math.round(b * factor)})`;
}

function nearestPaletteColor(rgb: RGB): keyof typeof PALETTE {
  let bestName = PALETTE_RGB[0].name;
  let bestDist = Infinity;
  for (const { name, rgb: p } of PALETTE_RGB) {
    const dr = p.r - rgb.r;
    const dg = p.g - rgb.g;
    const db = p.b - rgb.b;
    const d = dr * dr + dg * dg + db * db;
    if (d < bestDist) {
      bestDist = d;
      bestName = name;
    }
  }
  return bestName;
}

export function computeScale(imageWidth: number): number {
  return Math.max(1, Math.round(imageWidth / 1000));
}

export function denormalize(
  point: ImposterPoint,
  imageWidth: number,
  imageHeight: number,
): { px: number; py: number } {
  const scale = computeScale(imageWidth);
  const size = PATTERN_SIZE * scale;
  const rawX = Math.round(point.x * imageWidth);
  const rawY = Math.round(point.y * imageHeight);
  const px = Math.min(Math.max(rawX, 0), Math.max(0, imageWidth - size));
  const py = Math.min(Math.max(rawY, 0), Math.max(0, imageHeight - size));
  return { px, py };
}

export function renderImposters(
  ctx: CanvasRenderingContext2D,
  points: ImposterPoint[],
  imageWidth: number,
  imageHeight: number,
): void {
  const scale = computeScale(imageWidth);
  const size = PATTERN_SIZE * scale;
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  ctx.globalAlpha = IMPOSTER_ALPHA;
  for (const point of points) {
    const { px, py } = denormalize(point, imageWidth, imageHeight);
    const sampled = averageRgb(ctx, px, py, size, size, imageWidth, imageHeight);
    const colorName = sampled ? nearestPaletteColor(sampled) : point.color;
    const fillColor = PALETTE[colorName];
    const detailColor = darken(fillColor, DETAIL_DARKEN);
    for (let r = 0; r < PATTERN_SIZE; r++) {
      for (let c = 0; c < PATTERN_SIZE; c++) {
        const v = IMPOSTER_PATTERN[r][c];
        if (v === 0) continue;
        ctx.fillStyle = v === 1 ? fillColor : detailColor;
        ctx.fillRect(px + c * scale, py + r * scale, scale, scale);
      }
    }
  }
  ctx.restore();
}
