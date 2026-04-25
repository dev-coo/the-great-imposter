import { describe, it, expect } from "vitest";
import { computeScale, denormalize } from "@/lib/canvas-render";

describe("computeScale", () => {
  it("returns minimum 2 for small images", () => {
    expect(computeScale(400)).toBe(2);   // round(0.5)=1 → max(2,1)=2
    expect(computeScale(800)).toBe(2);   // round(1)=1 → max(2,1)=2
    expect(computeScale(1200)).toBe(2);  // round(1.5)=2 → max(2,2)=2
    expect(computeScale(1600)).toBe(2);  // round(2)=2 → max(2,2)=2
  });

  it("scales proportionally for larger images", () => {
    expect(computeScale(2400)).toBe(3);  // round(3)=3
    expect(computeScale(3200)).toBe(4);  // round(4)=4
    expect(computeScale(4800)).toBe(6);  // round(6)=6
  });
});

describe("denormalize", () => {
  it("converts normalized to pixel coordinates", () => {
    const point = { x: 0.5, y: 0.25, color: "red" as const, reason: "" };
    expect(denormalize(point, 1000, 800)).toEqual({ px: 500, py: 200 });
  });

  it("rounds fractional pixels", () => {
    const point = { x: 0.333, y: 0.667, color: "red" as const, reason: "" };
    expect(denormalize(point, 1000, 1000)).toEqual({ px: 333, py: 667 });
  });

  it("clamps coordinates so the imposter fits inside the image", () => {
    const point = { x: 1.0, y: 1.0, color: "red" as const, reason: "" };
    // imageWidth=1000 → scale=max(2, round(1000/800))=max(2,1)=2, size=4*2=8
    // rawX=rawY=1000 → clamped to max(0, 1000-8)=992
    expect(denormalize(point, 1000, 1000)).toEqual({ px: 992, py: 992 });
  });

  it("clamps negative coordinates to zero", () => {
    const point = { x: -0.1, y: -0.5, color: "red" as const, reason: "" };
    expect(denormalize(point, 1000, 1000)).toEqual({ px: 0, py: 0 });
  });
});
