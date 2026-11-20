// Cloudflare Pages Function: POST /api/chat
// The Gemini key lives only here, as a secret named GEMINI_API_KEY (never in the React code).
import { KNOWLEDGE } from "../_lib/knowledge";

interface Env {
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;       // optional override, e.g. gemini-3.5-flash-lite
  ALLOWED_ORIGINS?: string;    // optional, comma-separated, e.g. https://yourname.dev
}

const SYSTEM = `You are Jeffry Raymond's AI alter-ego on his portfolio website. Your goal is to make whoever is chatting feel like they're texting a real, sharp, likable engineer—not a customer-support bot.

HOW TO HANDLE EVERY SCENARIO NATURALLY:
- Casual greetings & small talk ("hi", "hey", "how's it going", "thanks", "nice site"): Match their energy in 1–2 short, natural sentences. Never dump Jeffry's bio, projects, or skills when someone just says hi.
- Recruiter or hiring questions ("are you available?", "why should we hire you?", "what's your background?"): Speak with grounded confidence—talk about how you like owning the whole system from model to cloud deployment, and weave in real proof naturally (like +30% efficiency on the ESAB Transmax XP6 HMI, AWS architecture at Hitachi, or shipping Wincy's site) without sounding like a stiff cover letter.
- Technical / project deep-dives ("how does Serenity work?", "what did you build at Hitachi?", "how's this site deployed?"): Talk shop like a fellow builder—mention the real stack (BLoC + Clean Architecture, CNN + NLP fusion, IAM/STS/SCPs & VPCs, MediaPipe WASM, Cloudflare Pages Functions) cleanly and directly.
- Curveballs, jokes, or off-topic chat ("are you a robot?", "coffee or tea?", "tell me a joke"): Play along with warmth and light humor like a real person—never hit them with a robotic "I can only answer questions about Jeffry's work" wall.
- Unknowns or private details (salary, phone number, anything not in the context): Just be honest and casual—say you don't have that handy here and tell them to shoot an email to jeffryraymond2004@gmail.com.

VOICE & RHYTHM:
- Use contractions, everyday phrasing, and varied sentence lengths. Keep replies tight (usually 1–4 sentences unless they ask for a deep dive).
- Plain text only—no markdown headings, no bullet-point lists, no corporate buzzwords, and NEVER suggest what the user should ask next.
- Never invent employers, dates, numbers, or links not in the context below.

CONTEXT ABOUT JEFFRY (draw on this only when relevant):
${KNOWLEDGE}`;

const MAX_MESSAGES = 8;
const MAX_CHARS = 500;

// Best-effort per-isolate limiter. For real protection also add a Cloudflare Rate Limiting rule on /api/chat.
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now(), windowMs = 10 * 60_000, max = 15;
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > max;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

function originAllowed(request: Request, env: Env): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  const self = new URL(request.url).origin;
  const extra = (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return origin === self || extra.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin);
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  if (!originAllowed(request, env)) return json({ error: "Forbidden" }, 403);
  if (!env.GEMINI_API_KEY) return json({ error: "Chat isn’t configured yet. Add GEMINI_API_KEY in .dev.vars or Cloudflare Pages Secrets." }, 500);

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  if (limited(ip)) return json({ error: "Too many requests. Please wait a bit." }, 429);

  let body: { messages?: { role?: string; content?: unknown }[] };
  try { body = await request.json(); } catch { return json({ error: "Bad request" }, 400); }

  const cleaned = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_MESSAGES)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: (m.content as string).slice(0, MAX_CHARS) }],
    }));
  // Gemini expects the conversation to start with, and end on, a user turn.
  while (cleaned.length && cleaned[0].role !== "user") cleaned.shift();
  if (!cleaned.length || cleaned[cleaned.length - 1].role !== "user") return json({ error: "Bad request" }, 400);

  const models = Array.from(
    new Set([env.GEMINI_MODEL, "gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-2.5-flash-lite"].filter(Boolean) as string[])
  );

  let lastStatus = 502;
  let lastErr = "";

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: cleaned,
          generationConfig: { temperature: 0.9, maxOutputTokens: 600 },
        }),
      });
      if (res.status === 429) return json({ error: "Too many requests. Please wait a bit." }, 429);
      if (res.status === 404) {
        lastStatus = 404;
        lastErr = `Model ${model} not found`;
        continue;
      }
      if (!res.ok) {
        lastStatus = res.status;
        lastErr = await res.text().catch(() => "");
        console.error(`Gemini API error (${model}, ${res.status}):`, lastErr);
        break;
      }
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("").trim();
      if (!reply) return json({ error: "No answer generated." }, 502);
      return json({ reply });
    } catch (err) {
      console.error(`Gemini fetch failed (${model}):`, err);
    }
  }

  if (lastStatus === 400 || lastStatus === 401 || lastStatus === 403) {
    return json({ error: "Gemini API key was rejected—check GEMINI_API_KEY in .dev.vars or Cloudflare Secrets." }, 502);
  }
  return json({ error: `The assistant is unavailable right now (${lastErr ? `HTTP ${lastStatus}` : "network error"}).` }, 502);
};

// Anything other than POST
export const onRequest = () => json({ error: "Method not allowed" }, 405);
