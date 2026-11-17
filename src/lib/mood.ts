export type Mood = "smiling" | "neutral" | "sad";
export type Blend = { categoryName: string; score: number }[];

const get = (b: Blend, name: string) => b.find((c) => c.categoryName === name)?.score ?? 0;

export function readFace(b: Blend) {
  const smile = (get(b, "mouthSmileLeft") + get(b, "mouthSmileRight")) / 2;
  const frown = (get(b, "mouthFrownLeft") + get(b, "mouthFrownRight")) / 2;
  const brow = get(b, "browInnerUp");
  return { smile, frown, brow };
}

export function classifyMood(s: { smile: number; frown: number; brow: number }): Mood {
  if (s.smile > 0.35) return "smiling";
  if (s.frown > 0.2 || (s.brow > 0.45 && s.smile < 0.15)) return "sad";
  return "neutral";
}

/** Simple 0..1 stress signal for the demo trend line (higher = more stressed). */
export function stressSignal(s: { smile: number; frown: number; brow: number }): number {
  const v = 0.45 - s.smile * 0.9 + s.frown * 1.4 + Math.max(0, s.brow - 0.2) * 0.8;
  return Math.min(1, Math.max(0, v));
}

export const MOOD_INFO: Record<Mood, { emoji: string; label: string; note: string }> = {
  smiling: { emoji: "😊", label: "Smiling", note: "Relaxed signal" },
  neutral: { emoji: "😐", label: "Neutral", note: "Calm signal" },
  sad: { emoji: "🙁", label: "Sad", note: "Possible stress signal" },
};
