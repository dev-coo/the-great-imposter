import { describe, it, expect } from "vitest";
import { parseGeminiResponse } from "@/lib/gemini/schema";

describe("parseGeminiResponse", () => {
  it("accepts a valid response", () => {
    const raw = {
      fitness: 0.8,
      fitnessReason: "복잡한 잎사귀가 많아 잘 숨길 수 있음",
      imposterCount: 2,
      points: [
        { x: 0.3, y: 0.5, color: "red", reason: "잎사귀 사이" },
        { x: 0.7, y: 0.2, color: "green", reason: "그늘" },
      ],
    };
    const result = parseGeminiResponse(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fitness).toBe(0.8);
      expect(result.points).toHaveLength(2);
    }
  });

  it("rejects when fitness < 0.4", () => {
    const raw = {
      fitness: 0.2,
      fitnessReason: "단색 하늘이라 임포스터가 다 보일 거예요",
      imposterCount: 0,
      points: [],
    };
    const result = parseGeminiResponse(raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain("단색");
  });

  it("rejects when imposterCount === 0", () => {
    const raw = {
      fitness: 0.5,
      fitnessReason: "어쩐지 적합하지 않음",
      imposterCount: 0,
      points: [],
    };
    const result = parseGeminiResponse(raw);
    expect(result.ok).toBe(false);
  });

  it("filters out points with invalid colors", () => {
    const raw = {
      fitness: 0.7,
      fitnessReason: "ok",
      imposterCount: 2,
      points: [
        { x: 0.5, y: 0.5, color: "red", reason: "ok" },
        { x: 0.6, y: 0.6, color: "magenta", reason: "bad" },
      ],
    };
    const result = parseGeminiResponse(raw);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.points).toHaveLength(1);
  });

  it("filters out points with out-of-range coordinates", () => {
    const raw = {
      fitness: 0.7,
      fitnessReason: "ok",
      imposterCount: 3,
      points: [
        { x: 0.5, y: 0.5, color: "red", reason: "ok" },
        { x: 1.5, y: 0.5, color: "red", reason: "out" },
        { x: -0.1, y: 0.5, color: "red", reason: "out" },
      ],
    };
    const result = parseGeminiResponse(raw);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.points).toHaveLength(1);
  });

  it("rejects malformed input", () => {
    const result = parseGeminiResponse({ foo: "bar" });
    expect(result.ok).toBe(false);
  });
});
