// Cloudflare Pages Function: POST /api/chat
// Agentic Gemini API endpoint with Function Calling, RAG citations, JD fit scoring,
// GitHub inspection, portfolio navigation, Google Calendar/Meet booking, and Turnstile verification.
import { KNOWLEDGE } from "../_lib/knowledge";
import { retrieveChunks } from "../_lib/rag";
import {
  AgentEnv,
  executeBookingAndEmail,
  FUNCTION_DECLARATIONS,
  PendingBooking,
  runAgentTool,
  ToolSideEffects,
  verifyTurnstile,
} from "../_lib/tools";

const SYSTEM = `You are Jeffry Raymond's AI alter-ego and agentic portfolio assistant. Your goal is to feel like a sharp, likable engineer—never a stiff customer-support bot—while using your tools to take real actions when asked.

AVAILABLE CAPABILITIES & WHEN TO USE TOOLS:
- Casual greetings & small talk ("hi", "hey", "thanks", "nice site"): Match their energy in 1–2 short, natural sentences. Do NOT call tools or dump bio/projects on a simple greeting.
- Technical, project, or experience questions ("how does Serenity work?", "what did you build at Hitachi?", "ESAB metrics?"): Answer directly from the context below (already grounded) without extra tool calls unless you need to look up something missing.
- Job Description / recruiter fit checks (user pastes a JD or role requirements): Call analyze_jd_fit to generate a structured match scorecard.
- Live code or repository questions ("show me the portfolio repo", "what languages are in your GitHub?"): Call inspect_github_repo.
- Navigation requests ("take me to the ASL demo", "show me your AWS skills", "go to featured projects"): Call navigate_portfolio.
- Scheduling a call / meeting / sending resume ("let's have a meet", "schedule a call", "send me your resume"):
  1. Call check_availability ONLY ONCE when they first ask to meet—NEVER re-call check_availability after they have already picked a slot.
  2. Once they pick a slot, simply ask for their name and email without calling any tool.
  3. Once they provide name, email, and slot, call prepare_meeting_booking so they can click Confirm & Book Meet. Never claim a meeting is booked until they confirm.
- Curveballs or off-topic chat ("are you a robot?", "coffee or tea?"): Play along with warmth and light humor.
- Unknowns or private details (salary, phone number): Be honest and casual—point them to jeffryraymond2004@gmail.com.

VOICE & RHYTHM:
- Use contractions, everyday phrasing, and varied sentence lengths (1–4 sentences unless a deep dive is requested).
- Plain text only—no markdown headings, no bullet-point lists, no corporate buzzwords, and NEVER ask follow-up questions or suggest what to ask next (only ask for name/email/slot when actively booking a meeting).
- Never invent employers, dates, numbers, emails, or links not in tool outputs or the context below.

BASELINE CONTEXT ABOUT JEFFRY:
${KNOWLEDGE}`;

const MAX_MESSAGES = 10;
const MAX_CHARS = 2000;

const hits = new Map<string, number[]>();
const bookingHits = new Map<string, number[]>();

function limited(map: Map<string, number[]>, key: string, windowMs: number, max: number): boolean {
  const now = Date.now();
  const recent = (map.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  map.set(key, recent);
  if (map.size > 5000) map.clear();
  return recent.length > max;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

function originAllowed(request: Request, env: AgentEnv): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  const self = new URL(request.url).origin;
  const extra = (env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return (
    origin === self ||
    extra.includes(origin) ||
    /^http:\/\/localhost(:\d+)?$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)
  );
}

type GeminiPart = {
  text?: string;
  functionCall?: { name?: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: { result: unknown } };
};

type GeminiContent = {
  role: "user" | "model" | "function";
  parts: GeminiPart[];
};

function streamSse(reply: string, effects: ToolSideEffects): Response {
  const encoder = new TextEncoder();
  // Instant single-frame delta
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };
      sendEvent("meta", effects);
      // Emit full reply immediately with zero loop overhead
      if (reply) sendEvent("delta", { text: reply });
      sendEvent("done", { ok: true });
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
    },
  });
}

export const onRequestPost = async ({ request, env }: { request: Request; env: AgentEnv }) => {
  if (!originAllowed(request, env)) return json({ error: "Forbidden" }, 403);
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";

  let body: {
    messages?: { role?: string; content?: unknown }[];
    stream?: boolean;
    confirmBooking?: PendingBooking;
    turnstileToken?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  // Handle human-in-the-loop booking confirmation
  if (body.confirmBooking) {
    if (limited(bookingHits, ip, 24 * 60 * 60_000, 3)) {
      return json({ error: "Daily booking limit reached from this network. Please email jeffryraymond2004@gmail.com." }, 429);
    }
    const humanOk = await verifyTurnstile(body.turnstileToken, ip, env);
    if (!humanOk) {
      return json({ error: "Please complete the verification check before booking." }, 403);
    }
    try {
      const confirmed = await executeBookingAndEmail(body.confirmBooking, env);
      return json({ confirmedBooking: confirmed });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not complete booking.";
      return json({ error: msg }, 400);
    }
  }

  if (!env.GEMINI_API_KEY) {
    return json({ error: "Chat isn’t configured yet. Add GEMINI_API_KEY in .dev.vars or Cloudflare Pages Secrets." }, 500);
  }
  if (limited(hits, ip, 10 * 60_000, 20)) {
    return json({ error: "Too many requests. Please wait a bit." }, 429);
  }

  const cleaned: GeminiContent[] = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .slice(-MAX_MESSAGES)
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: (m.content as string).slice(0, MAX_CHARS) }],
    }));

  while (cleaned.length && cleaned[0].role !== "user") cleaned.shift();
  if (!cleaned.length || cleaned[cleaned.length - 1].role !== "user") return json({ error: "Bad request" }, 400);

  const models = Array.from(
    new Set([env.GEMINI_MODEL, "gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-2.5-flash-lite"].filter(Boolean) as string[])
  );

  let lastStatus = 502;
  let lastErr = "";

  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const contents: GeminiContent[] = [...cleaned];
    const lastUserText = cleaned[cleaned.length - 1]?.parts?.[0]?.text ?? "";
    const isGreeting = /^(hi|hey|hello|yo|sup|thanks|thank you|ok|okay|nice)[!.,\s]*$/i.test(lastUserText.trim());
    const isNonPortfolioTurn =
      /^(hi|hey|hello|yo|sup|thanks|thank you|ok|okay|nice)[!.,\s]*$/i.test(lastUserText.trim()) ||
      /\b(book|schedule|meet|meeting|call|slot|calendar|availability|resume|cv)\b/i.test(lastUserText) ||
      /@/.test(lastUserText) ||
      lastUserText.trim().length < 10;
    const effects: ToolSideEffects = {
      citations: isNonPortfolioTurn ? [] : retrieveChunks(lastUserText, 3).citations,
    };
    let modelNotFound = false;

    try {
      for (let round = 0; round < 4; round++) {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM }] },
            contents,
            ...(isGreeting ? {} : { tools: [{ functionDeclarations: FUNCTION_DECLARATIONS }] }),
            generationConfig: { temperature: 0.85, maxOutputTokens: 350 },
          }),
        });

        if (res.status === 429) return json({ error: "Too many requests. Please wait a bit." }, 429);
        if (res.status === 404) {
          lastStatus = 404;
          lastErr = `Model ${model} not found`;
          modelNotFound = true;
          break;
        }
        if (!res.ok) {
          lastStatus = res.status;
          lastErr = await res.text().catch(() => "");
          console.error(`Gemini API error (${model}, ${res.status}):`, lastErr);
          break;
        }

        const data = (await res.json()) as {
          candidates?: { content?: { parts?: GeminiPart[] } }[];
        };
        const parts = data.candidates?.[0]?.content?.parts ?? [];
        const fnCalls = parts.filter((p) => p.functionCall?.name);

        if (fnCalls.length > 0) {
          contents.push({ role: "model", parts });
          const fnResponses: GeminiPart[] = [];
          for (const call of fnCalls) {
            const fnName = call.functionCall?.name || "";
            const fnArgs = call.functionCall?.args || {};
            const result = await runAgentTool(fnName, fnArgs, env, effects);
            fnResponses.push({
              functionResponse: {
                name: fnName,
                response: { result },
              },
            });
          }
          contents.push({ role: "user", parts: fnResponses });
          continue;
        }

        if (effects.slots || effects.pendingBooking || effects.jdScorecard || effects.githubRepo || effects.navAction) {
          effects.citations = [];
        }
        const reply = parts.map((p) => p.text ?? "").join("").trim();
        if (!reply) return json({ error: "No answer generated." }, 502);

        if (body.stream) return streamSse(reply, effects);
        return json({ reply, ...effects });
      }
      if (modelNotFound) continue;
    } catch (err) {
      console.error(`Gemini fetch failed (${model}):`, err);
    }
  }

  if (lastStatus === 400 || lastStatus === 401 || lastStatus === 403) {
    return json({ error: "Gemini API key was rejected—check GEMINI_API_KEY in .dev.vars or Cloudflare Secrets." }, 502);
  }
  return json({ error: `The assistant is unavailable right now (${lastErr ? `HTTP ${lastStatus}` : "network error"}).` }, 502);
};

export const onRequest = () => json({ error: "Method not allowed" }, 405);
