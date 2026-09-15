export const labels = [
  "plain",
  "comment",
  "string",
  "number",
  "keyword",
  "type",
  "function",
  "constant",
  "operator",
] as const;
export type Label = (typeof labels)[number];
export interface Span {
  type: Label;
  start: number;
  end: number;
}
