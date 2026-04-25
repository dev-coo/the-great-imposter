import { ImposterColor } from "./types";

// 4×4 패턴: 1 = 임포스터 색, 2 = 검정 디테일, 0 = 투명
// 사용자 제공 디자인 기반 (필요시 수정)
export const IMPOSTER_PATTERN: ReadonlyArray<ReadonlyArray<0 | 1 | 2>> = [
  [1, 1, 1, 2],
  [2, 2, 1, 1],
  [1, 1, 1, 1],
  [1, 2, 1, 2],
];

export const PATTERN_SIZE = IMPOSTER_PATTERN.length;

export const PALETTE: Record<ImposterColor, string> = {
  red:    "#C51111",
  blue:   "#132ED1",
  yellow: "#EDE15B",
  green:  "#117F2D",
  pink:   "#ED54BA",
  orange: "#EF7D0E",
  cyan:   "#38FEDC",
  lime:   "#50EF39",
  black:  "#3F474E",
  white:  "#D6E0F0",
  purple: "#6B2FBC",
  brown:  "#71491E",
};

export const DETAIL_COLOR = "#1A1A1A";
