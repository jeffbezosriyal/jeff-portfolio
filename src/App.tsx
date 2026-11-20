import { useCallback, useEffect, useState } from "react";
import Loader from "./components/Loader";
import Header from "./components/Header";
import Hero from "./components/Hero";
import BentoWidgets from "./components/BentoWidgets";
import Experience from "./components/Experience";
import SkillMatrix from "./components/SkillMatrix";
import Skills from "./components/Skills";
import Featured from "./components/Featured";
import Lab from "./components/Lab";
import ChatWidget from "./components/ChatWidget";
import Contact from "./components/Contact";
import CommandPalette from "./components/CommandPalette";
import ParticleField from "./components/ParticleField";
import { profile } from "./content";

const KEY = "jr-intro-seen";
const seenBefore = () => {
  try { return sessionStorage.getItem(KEY) === "1"; } catch { return false; }
};

export default function App() {
  const [loading, setLoading] = useState(() => !seenBefore());
  const [cmdOpen, setCmdOpen] = useState(false);
  const [chatTrigger, setChatTrigger] = useState(0);
  const [chatDraft, setChatDraft] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const done = useCallback(() => {
    try { sessionStorage.setItem(KEY, "1"); } catch { /* storage unavailable */ }
    setLoading(false);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  }, []);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = profile.email;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    showToast(`Copied ${profile.email}`);
  }, [showToast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".section, .bento__card, .exp-grid > li, .skills__icons li, .explorer, .metrics-strip, .learning-card, .featured"
      )
    );
    targets.forEach((el, i) => {
      el.classList.add("reveal");
      if (el.matches(".bento__card")) el.style.setProperty("--stagger", `${(i % 4) * 70}ms`);
      if (el.matches(".exp-grid > li")) el.style.setProperty("--stagger", `${(i % 4) * 80}ms`);
      if (el.matches(".skills__icons li")) el.style.setProperty("--stagger", `${(i % 13) * 35}ms`);
      if (el.matches(".learning-card")) el.style.setProperty("--stagger", `${(i % 4) * 75}ms`);
    });

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
          else if (entry.boundingClientRect.top > 0) entry.target.classList.remove("is-visible");
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -20px 0px" }
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      document.documentElement.style.setProperty("--scroll-p", p.toFixed(4));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const fine = window.matchMedia?.("(pointer: fine)").matches;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const onMove = (e: PointerEvent) => {
      document.documentElement.style.setProperty("--mx", `${e.clientX}px`);
      document.documentElement.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <>
      <ParticleField />
      <div className="spotlight" aria-hidden="true" />
      {loading && <Loader onDone={done} />}
      <a className="skip-link" href="#main">Skip to content</a>
      <Header onOpenCmd={() => setCmdOpen(true)} />
      <main id="main">
        <Hero />
        <BentoWidgets onCopyEmail={copyEmail} onOpenChat={() => setChatTrigger((c) => c + 1)} />
        <Experience />
        <SkillMatrix />
        <Skills />
        <Featured onAskChat={(q) => { setChatDraft(q); setChatTrigger((c) => c + 1); }} />
        <Lab />
      </main>
      <Contact />
      <ChatWidget triggerOpen={chatTrigger} draft={chatDraft} onDraftConsumed={() => setChatDraft(null)} />
      <CommandPalette
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        onOpenChat={() => setChatTrigger((c) => c + 1)}
        onCopyEmail={copyEmail}
      />
      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    </>
  );
}
