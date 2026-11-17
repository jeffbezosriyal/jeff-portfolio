export type Pt = { x: number; y: number; z?: number };

const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** [thumb, index, middle, ring, pinky] -> true when extended. Works for any hand rotation. */
export function fingerStates(l: Pt[]): boolean[] {
  const wrist = l[0];
  const palm = dist(l[0], l[9]) || 1;
  const finger = (tip: number, mcp: number) => dist(l[tip], wrist) > dist(l[mcp], wrist) * 1.35;
  const thumb = dist(l[4], l[5]) > palm * 0.55;
  return [thumb, finger(8, 5), finger(12, 9), finger(16, 13), finger(20, 17)];
}

const SIGNS: Record<string, string> = {
  "11111": "Hello (5)",
  "00000": "A (fist)",
  "10000": "Thumbs up",
  "01000": "1 (point)",
  "01100": "2 / V",
  "01110": "W (3)",
  "01111": "4",
  "11000": "L",
  "10001": "Y",
  "00001": "I",
  "11001": "I love you",
};

export function classifySign(l: Pt[]): string {
  const f = fingerStates(l);
  const key = f.map((v) => (v ? "1" : "0")).join("");
  if (SIGNS[key]) return SIGNS[key];
  // OK / F: index curled (touching thumb), the other three fingers extended
  if (!f[1] && f[2] && f[3] && f[4]) return "F (OK)";
  return "Not sure";
}

export const SIGN_LIST = [...Object.values(SIGNS), "F (OK)"];

export const SIGN_GUIDES: { label: string; emoji: string; cue: string }[] = [
  { label: "Hello (5)", emoji: "🖐️", cue: "All 5 fingers open" },
  { label: "A (fist)", emoji: "✊", cue: "Closed fist, thumb tucked" },
  { label: "Thumbs up", emoji: "👍", cue: "Only thumb extended" },
  { label: "1 (point)", emoji: "☝️", cue: "Index finger up only" },
  { label: "2 / V", emoji: "✌️", cue: "Index + middle up" },
  { label: "W (3)", emoji: "🤟", cue: "Index, middle + ring up" },
  { label: "4", emoji: "🖖", cue: "4 fingers up, thumb in" },
  { label: "L", emoji: "👆", cue: "Thumb + index L-shape" },
  { label: "Y", emoji: "🤙", cue: "Thumb + pinky out" },
  { label: "I", emoji: "🤏", cue: "Pinky finger up only" },
  { label: "I love you", emoji: "🤘", cue: "Thumb, index + pinky" },
  { label: "F (OK)", emoji: "👌", cue: "Thumb + index touch, 3 up" },
];

/** Show a label only when it has been stable for most of the recent frames. */
export class Smoother {
  private buf: string[] = [];
  constructor(private size = 7, private need = 5) {}
  push(v: string): string | null {
    this.buf.push(v);
    if (this.buf.length > this.size) this.buf.shift();
    const counts = new Map<string, number>();
    this.buf.forEach((x) => counts.set(x, (counts.get(x) ?? 0) + 1));
    for (const [k, n] of counts) if (n >= this.need) return k;
    return null;
  }
  clear() { this.buf = []; }
}
