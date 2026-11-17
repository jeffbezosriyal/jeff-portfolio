import { useEffect, useMemo, useRef, useState } from "react";
import { profile } from "../content";

type Action = {
  id: string;
  label: string;
  hint: string;
  run: () => void;
};

export default function CommandPalette({
  open,
  onClose,
  onOpenChat,
  onCopyEmail,
}: {
  open: boolean;
  onClose: () => void;
  onOpenChat: () => void;
  onCopyEmail: () => void;
}) {
  const [query, setQuery] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions: Action[] = useMemo(
    () => [
      { id: "home", label: "Jump to Home", hint: "Section", run: () => document.getElementById("home")?.scrollIntoView({ behavior: "smooth" }) },
      { id: "about", label: "Jump to About", hint: "Section", run: () => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" }) },
      { id: "work", label: "Jump to Experience & Projects", hint: "Section", run: () => document.getElementById("work")?.scrollIntoView({ behavior: "smooth" }) },
      { id: "lab", label: "Open The AI Lab (Sign Language & Mood)", hint: "Interactive", run: () => document.getElementById("lab")?.scrollIntoView({ behavior: "smooth" }) },
      { id: "chat", label: "Ask Jeffry AI Assistant", hint: "Gemini Chatbot", run: onOpenChat },
      { id: "email", label: `Copy Email (${profile.email})`, hint: "Clipboard", run: onCopyEmail },
      { id: "github", label: "Open GitHub Profile", hint: "External", run: () => window.open(profile.github, "_blank", "noopener,noreferrer") },
      { id: "linkedin", label: "Open LinkedIn Profile", hint: "External", run: () => window.open(profile.linkedin, "_blank", "noopener,noreferrer") },
    ],
    [onOpenChat, onCopyEmail]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? actions.filter((a) => a.label.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q)) : actions;
  }, [actions, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setIdx(0);
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => (filtered.length ? (i + 1) % filtered.length : 0)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0)); }
      else if (e.key === "Enter" && filtered[idx]) {
        e.preventDefault();
        filtered[idx].run();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, idx, onClose]);

  if (!open) return null;

  return (
    <div className="cmdk__backdrop" onClick={onClose} role="presentation">
      <div className="cmdk" role="dialog" aria-label="Command palette" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk__head">
          <span aria-hidden="true">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIdx(0); }}
            placeholder="Type a command or jump to a section…"
            aria-label="Search commands"
          />
          <button type="button" onClick={onClose} aria-label="Close command palette">ESC</button>
        </div>
        <ul className="cmdk__list">
          {filtered.length ? (
            filtered.map((a, i) => (
              <li key={a.id}>
                <button
                  type="button"
                  className={i === idx ? "is-selected" : undefined}
                  onMouseEnter={() => setIdx(i)}
                  onClick={() => { a.run(); onClose(); }}
                >
                  <span>{a.label}</span>
                  <small>{a.hint}</small>
                </button>
              </li>
            ))
          ) : (
            <li className="cmdk__empty">No matching commands.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
