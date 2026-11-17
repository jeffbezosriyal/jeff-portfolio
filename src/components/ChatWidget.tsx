import { useEffect, useRef, useState } from "react";
import { experience, featured, profile, skills } from "../content";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = ["What has Jeffry built with AI?", "What is his AWS experience?", "Which tech stack does he use?"];
const GREETING: Msg = {
  role: "assistant",
  content: "Hi! I’m an AI assistant that answers questions about Jeffry’s work, skills and experience. What would you like to know?",
};

function offlineReply(q: string): string {
  const s = q.toLowerCase();
  if (/aws|cloud|hitachi|vpc|lambda|ec2/.test(s)) {
    return `At Hitachi (Feb 2026 – Apr 2026), Jeffry worked as a Cloud Engineering Intern setting up AWS IAM & Organizations governance, VPCs with EC2/EBS/RDS, and serverless backends using S3, Lambda, API Gateway, and DynamoDB.`;
  }
  if (/stack|skill|tech|python|react|flutter|language/.test(s)) {
    return `Jeffry’s core stack includes ${skills.list.join(", ")}. He builds end-to-end systems from ML models and APIs to React/Flutter interfaces and AWS/Cloudflare deployments.`;
  }
  if (/ai|ml|project|serenity|stress|asl|sign|chatbot|wincy|esab/.test(s)) {
    return `${featured.title}: ${featured.text} He also built an AI health chatbot (LLaMA + Pinecone), an industrial Flutter HMI app at ESAB, and the Wincy Software Solutions site (${experience[0].href}).`;
  }
  if (/contact|email|hire|reach|linkedin|github/.test(s)) {
    return `You can reach Jeffry at ${profile.email} or connect via GitHub and LinkedIn in the Contact section below.`;
  }
  return `Jeffry Raymond is an ${profile.role.replace(/^I’m an?\s*/i, "").replace(/\.$/, "")} at ${profile.current.company}, working across AI, React/Flutter, and AWS cloud. Ask about his AI projects, AWS work, tech stack, or email ${profile.email}.`;
}

export default function ChatWidget({ triggerOpen }: { triggerOpen: number }) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
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
    if (triggerOpen > 0) openChat();
  }, [triggerOpen]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [msgs, busy, open]);

  useEffect(() => {
    if (!open || closing) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 120);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
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
      if (res.status === 404) {
        setMsgs([...next, { role: "assistant", content: offlineReply(content) }]);
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.reply) throw new Error(data.error ?? "request failed");
      setMsgs([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      const limited = e instanceof Error && /too many/i.test(e.message);
      setMsgs([...next, {
        role: "assistant",
        content: limited
          ? "You’re sending messages quickly. Please wait a moment and try again."
          : offlineReply(content),
      }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button className="chat__fab" onClick={openChat} aria-label="Ask Jeffry — open chat">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
          </svg>
          <span>Ask Jeffry</span>
        </button>
      )}
      {open && (
        <section className={`chat${closing ? " chat--closing" : ""}`} role="dialog" aria-label="Ask Jeffry chat">
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
                <button type="button" onClick={() => setMsgs([GREETING])} aria-label="Clear chat" title="Reset conversation">↺</button>
              )}
              <button type="button" onClick={closeChat} aria-label="Close chat" title="Close">✕</button>
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
