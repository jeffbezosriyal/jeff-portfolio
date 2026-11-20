import { useEffect, useRef, useState } from "react";

type Citation = { id: string; label: string; sectionId: string };
type SlotOption = { iso: string; label: string };
type JdScorecard = {
  roleTitle: string;
  overallMatch: number;
  matchedSkills: string[];
  relevantProjects: { title: string; reason: string; sectionId: string }[];
  gaps: string[];
  summary: string;
};
type GitHubRepoCard = {
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  language: string;
  languages: string[];
  updatedAt: string;
};
type PendingBooking = {
  recruiterName: string;
  recruiterEmail: string;
  slotIso: string;
  slotLabel: string;
  notes?: string;
};
type ConfirmedBooking = PendingBooking & {
  meetLink?: string;
  calendarUpdated: boolean;
  emailSent: boolean;
  resumeIncluded: boolean;
  resumeUrl?: string;
};
type NavAction = { sectionId: string; skillName?: string; labTab?: "asl" | "mood" };

type Msg = {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  slots?: SlotOption[];
  jdScorecard?: JdScorecard;
  githubRepo?: GitHubRepoCard;
  pendingBooking?: PendingBooking;
  confirmedBooking?: ConfirmedBooking;
};

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void }) => string;
    };
  }
}

const SUGGESTIONS = [
  "What has Jeffry built with AI?",
  "Let's schedule a quick meet",
  "Inspect his portfolio GitHub repo",
];

const GREETING: Msg = {
  role: "assistant",
  content:
    "Hey! I’m Jeffry’s agentic AI—ask about his builds, paste a Job Description for a fit check, or say \"let's have a meet\" to book a call and get his resume.",
};

const TURNSTILE_SITE_KEY = (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_TURNSTILE_SITE_KEY;

function jumpToSection(sectionId: string, nav?: NavAction) {
  window.dispatchEvent(new CustomEvent("portfolio:navigate", { detail: nav ?? { sectionId } }));
  const target = document.querySelector(sectionId);
  if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function ChatWidget({
  triggerOpen,
  draft,
  onDraftConsumed,
}: {
  triggerOpen: number;
  draft?: string | null;
  onDraftConsumed?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [bookingBusyIdx, setBookingBusyIdx] = useState<number | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showTop, setShowTop] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number>();
  const turnstileRef = useRef<HTMLDivElement>(null);

  const openChat = () => {
    window.clearTimeout(closeTimer.current);
    setClosing(false);
    setOpen(true);
  };

  const closeChat = () => {
    if (!open || closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 220);
  };

  useEffect(() => {
    if (triggerOpen > 0) {
      openChat();
      if (draft) {
        setInput(draft);
        onDraftConsumed?.();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerOpen]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 360);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [msgs, busy, open]);

  // Load Cloudflare Turnstile script lazily only when a pendingBooking card is shown
  const hasPendingBooking = msgs.some((m) => m.pendingBooking && !m.confirmedBooking);
  useEffect(() => {
    if (!hasPendingBooking || !TURNSTILE_SITE_KEY || !turnstileRef.current) return;
    const renderWidget = () => {
      if (window.turnstile && turnstileRef.current && turnstileRef.current.childElementCount === 0) {
        window.turnstile.render(turnstileRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (tok) => setTurnstileToken(tok),
        });
      }
    };
    if (window.turnstile) {
      renderWidget();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = renderWidget;
    document.head.appendChild(script);
  }, [hasPendingBooking]);

  useEffect(() => {
    if (!open || closing) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 120);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKey);

    const isMobile = window.matchMedia?.("(max-width: 480px)").matches;
    const prevOverflow = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = "hidden";

    const vv = window.visualViewport;
    const syncViewport = () => {
      const el = chatRef.current;
      if (!el || !vv || !window.matchMedia?.("(max-width: 480px)").matches) return;
      el.style.height = `${vv.height}px`;
      el.style.top = `${vv.offsetTop}px`;
      endRef.current?.scrollIntoView({ block: "end" });
    };

    if (vv) {
      syncViewport();
      vv.addEventListener("resize", syncViewport);
      vv.addEventListener("scroll", syncViewport);
    }

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      if (isMobile) document.body.style.overflow = prevOverflow;
      if (vv) {
        vv.removeEventListener("resize", syncViewport);
        vv.removeEventListener("scroll", syncViewport);
      }
      if (chatRef.current) {
        chatRef.current.style.height = "";
        chatRef.current.style.top = "";
      }
    };
  }, [open, closing]);

  const copyMsg = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopiedIdx(idx);
    window.setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1500);
  };

  const confirmBooking = async (pending: PendingBooking, msgIdx: number) => {
    if (bookingBusyIdx !== null) return;
    setBookingBusyIdx(msgIdx);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmBooking: pending, turnstileToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.confirmedBooking) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMsgs((prev) =>
        prev.map((m, i) =>
          i === msgIdx ? { ...m, pendingBooking: undefined, confirmedBooking: data.confirmedBooking } : m
        )
      );
      setTurnstileToken(undefined);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Could not complete booking.";
      setMsgs((prev) => [...prev, { role: "assistant", content: errMsg }]);
    } finally {
      setBookingBusyIdx(null);
    }
  };

  const send = async (text: string) => {
    const content = text.trim().slice(0, 2000);
    if (!content || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content }];
    setMsgs(next);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stream: true,
          messages: next
            .filter((m) => m !== GREETING)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const contentType = res.headers.get("Content-Type") || "";
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error ?? `HTTP ${res.status}`);
      }

      if (contentType.includes("text/event-stream") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantAdded = false;
        let currentMeta: Partial<Msg> = {};
        let currentText = "";

        const upsertAssistant = () => {
          setMsgs((prev) => {
            const draftMsg: Msg = { role: "assistant", content: currentText, ...currentMeta };
            if (!assistantAdded) {
              assistantAdded = true;
              return [...prev, draftMsg];
            }
            const copy = [...prev];
            copy[copy.length - 1] = draftMsg;
            return copy;
          });
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const lines = frame.split("\n");
            let evName = "message";
            let dataLine = "";
            for (const line of lines) {
              if (line.startsWith("event:")) evName = line.slice(6).trim();
              else if (line.startsWith("data:")) dataLine += line.slice(5).trim();
            }
            if (!dataLine) continue;
            const parsed = JSON.parse(dataLine);
            if (evName === "meta") {
              currentMeta = {
                citations: parsed.citations?.length ? parsed.citations : undefined,
                slots: parsed.slots?.length ? parsed.slots : undefined,
                jdScorecard: parsed.jdScorecard,
                githubRepo: parsed.githubRepo,
                pendingBooking: parsed.pendingBooking,
              };
              if (parsed.navAction) jumpToSection(parsed.navAction.sectionId, parsed.navAction);
            } else if (evName === "delta" && parsed.text) {
              currentText += parsed.text;
              upsertAssistant();
            }
          }
        }
        if (!assistantAdded && currentText) upsertAssistant();
      } else {
        const data = await res.json().catch(() => ({}));
        if (!data.reply) throw new Error(data.error ?? "No answer generated.");
        if (data.navAction) jumpToSection(data.navAction.sectionId, data.navAction);
        setMsgs([
          ...next,
          {
            role: "assistant",
            content: data.reply,
            citations: data.citations?.length ? data.citations : undefined,
            slots: data.slots?.length ? data.slots : undefined,
            jdScorecard: data.jdScorecard,
            githubRepo: data.githubRepo,
            pendingBooking: data.pendingBooking,
          },
        ]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not reach Gemini right now.";
      setMsgs([
        ...next,
        {
          role: "assistant",
          content: /404/.test(msg)
            ? "Local Vite dev doesn’t run Cloudflare Functions—use `npm run preview:cf` (or the live Cloudflare URL) to chat with Gemini."
            : msg,
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <div className="fab-dock">
          {showTop && (
            <button
              type="button"
              className="fab-top"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              aria-label="Back to top"
              data-tip="Back to top"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </button>
          )}
          <button className="chat__fab" onClick={openChat} aria-label="Ask Jeffry — open chat">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
            </svg>
            <span>Ask Jeffry</span>
          </button>
        </div>
      )}
      {open && (
        <section ref={chatRef} className={`chat${closing ? " chat--closing" : ""}`} role="dialog" aria-label="Ask Jeffry chat">
          <header className="chat__head">
            <div className="chat__title">
              <span className="chat__dot" aria-hidden="true" />
              <div>
                <strong>Ask Jeffry</strong>
                <small>Agentic AI · Gemini</small>
              </div>
            </div>
            <div className="chat__actions">
              {msgs.length > 1 && (
                <button type="button" onClick={() => setMsgs([GREETING])} aria-label="Clear chat" data-tip="Reset chat">↺</button>
              )}
              <button type="button" onClick={closeChat} aria-label="Close chat" data-tip="Close (Esc)">✕</button>
            </div>
          </header>
          <div className="chat__log" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`chat__bubble chat__bubble--${m.role}`}>
                <p className={`chat__msg chat__msg--${m.role}`}>{m.content}</p>

                {m.slots && m.slots.length > 0 && (
                  <div className="chat__slots" role="group" aria-label="Available meeting slots">
                    {m.slots.map((s) => (
                      <button
                        key={s.iso}
                        type="button"
                        className="chat__slot-btn"
                        disabled={busy}
                        onClick={() => send(`Let's book ${s.label} (${s.iso})`)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}

                {m.pendingBooking && (
                  <div className="chat__card chat__booking">
                    <strong>Confirm Meeting &amp; Resume</strong>
                    <span>{m.pendingBooking.recruiterName} · {m.pendingBooking.recruiterEmail}</span>
                    <span>{m.pendingBooking.slotLabel}</span>
                    {TURNSTILE_SITE_KEY && <div ref={turnstileRef} className="chat__turnstile" />}
                    <button
                      type="button"
                      className="chat__confirm-btn"
                      disabled={bookingBusyIdx === i || (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)}
                      onClick={() => confirmBooking(m.pendingBooking!, i)}
                    >
                      {bookingBusyIdx === i ? "Booking…" : "Confirm & Book Meet"}
                    </button>
                  </div>
                )}

                {m.confirmedBooking && (
                  <div className="chat__card chat__confirmed">
                    <strong>Meeting Confirmed ✓</strong>
                    <span>{m.confirmedBooking.slotLabel}</span>
                    {m.confirmedBooking.meetLink && (
                      <a href={m.confirmedBooking.meetLink} target="_blank" rel="noreferrer">
                        Join Google Meet →
                      </a>
                    )}
                    {m.confirmedBooking.resumeUrl && (
                      <a href={m.confirmedBooking.resumeUrl} target="_blank" rel="noreferrer">
                        View Resume →
                      </a>
                    )}
                    <small>
                      {m.confirmedBooking.calendarUpdated ? "Calendar updated" : "Calendar pending"} ·{" "}
                      {m.confirmedBooking.emailSent ? "Resume emailed" : "Email pending"}
                    </small>
                  </div>
                )}

                {m.jdScorecard && (
                  <div className="chat__card chat__scorecard">
                    <div className="chat__score-head">
                      <strong>{m.jdScorecard.roleTitle}</strong>
                      <span>{m.jdScorecard.overallMatch}% match</span>
                    </div>
                    <div className="chat__score-bar">
                      <i style={{ width: `${m.jdScorecard.overallMatch}%` }} />
                    </div>
                    <div className="chat__chips">
                      {m.jdScorecard.matchedSkills.map((s) => <span key={s}>{s}</span>)}
                    </div>
                    {m.jdScorecard.relevantProjects.map((p) => (
                      <button
                        key={p.title}
                        type="button"
                        className="chat__cite-link"
                        onClick={() => jumpToSection(p.sectionId)}
                      >
                        {p.title} — {p.reason}
                      </button>
                    ))}
                    {m.jdScorecard.gaps.length > 0 && (
                      <small>Honest gaps: {m.jdScorecard.gaps.join("; ")}</small>
                    )}
                  </div>
                )}

                {m.githubRepo && (
                  <div className="chat__card chat__repo">
                    <div className="chat__score-head">
                      <strong>{m.githubRepo.fullName}</strong>
                      <span>★ {m.githubRepo.stars}</span>
                    </div>
                    <p>{m.githubRepo.description}</p>
                    <div className="chat__chips">
                      {m.githubRepo.languages.map((l) => <span key={l}>{l}</span>)}
                    </div>
                    <a href={m.githubRepo.url} target="_blank" rel="noreferrer">Open on GitHub →</a>
                  </div>
                )}

                {m.citations && m.citations.length > 0 && (
                  <div className="chat__citations">
                    {m.citations.map((c) => (
                      <button key={c.id} type="button" onClick={() => jumpToSection(c.sectionId)}>
                        ↗ {c.label}
                      </button>
                    ))}
                  </div>
                )}

                {m.role === "assistant" && i > 0 && (
                  <button
                    type="button"
                    className="chat__copy"
                    onClick={() => copyMsg(m.content, i)}
                    aria-label="Copy reply"
                  >
                    {copiedIdx === i ? "Copied ✓" : "Copy"}
                  </button>
                )}
              </div>
            ))}
            {busy && <p className="chat__msg chat__msg--assistant chat__typing" aria-label="Typing"><i /><i /><i /></p>}
            {msgs.length === 1 && (
              <div className="chat__sugg">
                {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form className="chat__form" onSubmit={(e) => { e.preventDefault(); send(input); }}>
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} maxLength={2000}
              placeholder="Ask, paste a JD, or book a meet…" aria-label="Your question" />
            <button type="submit" disabled={busy || !input.trim()}>Send</button>
          </form>
        </section>
      )}
    </>
  );
}
