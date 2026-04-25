import { ImposterPoint } from "./types";
import {
  IMPOSTER_PATTERN,
  PATTERN_SIZE,
  PALETTE,
  DETAIL_COLOR,
} from "./imposter-pattern";

export function computeScale(imageWidth: number): number {
  return Math.max(2, Math.round(imageWidth / 800));
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
  ctx.imageSmoothingEnabled = false;
  for (const point of points) {
    const { px, py } = denormalize(point, imageWidth, imageHeight);
    const fillColor = PALETTE[point.color];
    for (let r = 0; r < PATTERN_SIZE; r++) {
      for (let c = 0; c < PATTERN_SIZE; c++) {
        const v = IMPOSTER_PATTERN[r][c];
        if (v === 0) continue;
        ctx.fillStyle = v === 1 ? fillColor : DETAIL_COLOR;
        ctx.fillRect(px + c * scale, py + r * scale, scale, scale);
      }
    }
  }
}
