import { useEffect, useState } from "react";
import LogoMark from "./LogoMark";

/**
 * Short intro screen. It waits for real loading (fonts + window load), with a
 * minimum of ~0.9s so it doesn't flash, and a hard cap of ~2.2s so it never drags.
 */
export default function Loader({ onDone }: { onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    const loaded = new Promise<void>((r) => {
      if (document.readyState === "complete") r();
      else window.addEventListener("load", () => r(), { once: true });
    });
    const fonts = document.fonts?.ready ? document.fonts.ready.then(() => {}) : Promise.resolve();
    let exit: number | undefined;

    Promise.race([Promise.all([wait(900), loaded, fonts]), wait(2200)]).then(() => {
      setLeaving(true);
      exit = window.setTimeout(onDone, 450);
    });
    return () => window.clearTimeout(exit);
  }, [onDone]);

  return (
    <div className={`loader${leaving ? " loader--leaving" : ""}`} role="status" aria-live="polite">
      <div className="loader__mark">
        <LogoMark />
      </div>
      <div className="loader__bar" aria-hidden="true"><span /></div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
