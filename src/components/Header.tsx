import { useEffect, useState } from "react";
import { nav, profile } from "../content";
import LogoMark from "./LogoMark";

export default function Header({ onOpenCmd }: { onOpenCmd: () => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#home");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);

      const ids = nav.map((n) => n.href.slice(1));
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) current = id;
      }
      setActive(`#${current}`);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="header">
      <div className="header__progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <div className="container header__inner">
        <a href="#home" className="header__logo" aria-label="Home" onClick={() => setOpen(false)}>
          <LogoMark />
        </a>
        <div className="header__right">
          <nav id="site-nav" className={`header__nav${open ? " is-open" : ""}`}>
            {nav.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className={active === n.href ? "is-active" : undefined}
                onClick={() => setOpen(false)}
              >
                {n.label}
              </a>
            ))}
            <a href={profile.github} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              GitHub
            </a>
          </nav>
          <button
            type="button"
            className="header__cmd"
            onClick={onOpenCmd}
            aria-label="Open command palette"
            title="Quick jump (Ctrl+K / ⌘K)"
          >
            <span>⌘K</span>
          </button>
          <button
            className="header__toggle"
            aria-expanded={open}
            aria-controls="site-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
