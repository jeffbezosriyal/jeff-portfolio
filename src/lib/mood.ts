export type Mood = "happy" | "focused" | "neutral" | "stressed" | "surprised";
export type Blend = { categoryName: string; score: number }[];

export type FaceSignals = {
  smile: number;
  frown: number;
  browUp: number;
  browDown: number;
  squint: number;
  jawOpen: number;
};

const get = (b: Blend, name: string) => b.find((c) => c.categoryName === name)?.score ?? 0;

export function readFace(b: Blend): FaceSignals {
  const smile = (get(b, "mouthSmileLeft") + get(b, "mouthSmileRight")) / 2;
  const cheek = (get(b, "cheekSquintLeft") + get(b, "cheekSquintRight")) / 2;
  const frown = (get(b, "mouthFrownLeft") + get(b, "mouthFrownRight")) / 2;
  const browDown = (get(b, "browDownLeft") + get(b, "browDownRight")) / 2;
  const browUp = (get(b, "browInnerUp") + get(b, "browOuterUpLeft") + get(b, "browOuterUpRight")) / 3;
  const squint = (get(b, "eyeSquintLeft") + get(b, "eyeSquintRight")) / 2;
  const jawOpen = get(b, "jawOpen");
  return {
    smile: smile * 0.8 + cheek * 0.2,
    frown,
    browUp,
    browDown,
    squint,
    jawOpen,
  };
}

export function classifyMood(s: FaceSignals): Mood {
  if (s.smile > 0.3) return "happy";
  if (s.jawOpen > 0.35 && s.browUp > 0.28) return "surprised";
  if (s.frown > 0.16 || s.browDown > 0.38 || (s.browUp > 0.42 && s.smile < 0.12)) return "stressed";
  if (s.browDown > 0.18 || s.squint > 0.32) return "focused";
  return "neutral";
}

/** 0..1 stress signal combining brow tension, frown, and inner brow raise, offset by smiling. */
export function stressSignal(s: FaceSignals): number {
  const tension = s.frown * 1.35 + s.browDown * 1.15 + Math.max(0, s.browUp - 0.18) * 0.7;
  const relief = s.smile * 0.95;
  const v = 0.28 + tension - relief;
  return Math.min(1, Math.max(0, v));
}

export const MOOD_INFO: Record<Mood, { emoji: string; label: string; note: string }> = {
  happy: { emoji: "😊", label: "Happy / Relaxed", note: "Low stress signal · genuine smile detected" },
  focused: { emoji: "🧐", label: "Focused", note: "Engaged concentration · mild brow/eye tension" },
  neutral: { emoji: "😐", label: "Neutral / Calm", note: "Steady baseline expression" },
  stressed: { emoji: "😟", label: "Tense / Stressed", note: "Elevated brow furrow or frown signal" },
  surprised: { emoji: "😮", label: "Surprised", note: "Raised brows + open jaw spike" },
};
