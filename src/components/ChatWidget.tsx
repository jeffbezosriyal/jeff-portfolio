import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = ["What has Jeffry built with AI?", "Tell me about his ESAB Flutter app", "What did he do at Hitachi on AWS?"];
const GREETING: Msg = {
  role: "assistant",
  content: "Hey! I’m Jeffry’s AI wingman—ask me anything specific about his AI builds, AWS cloud work, ESAB Flutter HMI, or how he engineered this site.",
};

export default function ChatWidget({ triggerOpen, draft, onDraftConsumed }: { triggerOpen: number; draft?: string | null; onDraftConsumed?: () => void }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [showTop, setShowTop] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<number>();

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

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [msgs, busy, open]);

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

  const send = async (text: string) => {
    const content = text.trim().slice(0, 500);
    if (!content || busy) return;
    const next: Msg[] = [...msgs, { role: "user", content }];
    setMsgs(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m) => m !== GREETING) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.reply) throw new Error(data.error ?? `HTTP ${res.status}`);
      setMsgs([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not reach Gemini right now.";
      setMsgs([...next, {
        role: "assistant",
        content: /404/.test(msg)
          ? "Local Vite dev doesn’t run Cloudflare Functions—use `npm run preview:cf` (or the live Cloudflare URL) to chat with Gemini."
          : msg,
      }]);
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
                <small>Powered by Gemini</small>
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
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} maxLength={500}
              placeholder="Ask about projects, skills, AWS…" aria-label="Your question" />
            <button type="submit" disabled={busy || !input.trim()}>Send</button>
          </form>
        </section>
      )}
    </>
  );
}
