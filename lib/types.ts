export const IMPOSTER_COLORS = [
  "red", "blue", "yellow", "green", "pink", "orange",
  "cyan", "lime", "black", "white", "purple", "brown",
] as const;

export type ImposterColor = (typeof IMPOSTER_COLORS)[number];

export interface ImposterPoint {
  x: number;        // 0~1 정규화
  y: number;        // 0~1 정규화
  color: ImposterColor;
  reason: string;   // 디버깅·다음 스텝용
}

export interface AnalyzeSuccess {
  ok: true;
  fitness: number;             // 0~1
  fitnessReason: string;
  imposterCount: number;
  points: ImposterPoint[];
}

export interface AnalyzeReject {
  ok: false;
  reason: string;              // 사용자에게 보여줄 메시지
}

export type AnalyzeResponse = AnalyzeSuccess | AnalyzeReject;
