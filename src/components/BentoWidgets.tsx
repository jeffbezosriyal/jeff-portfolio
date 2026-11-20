import { useEffect, useState } from "react";
import { profile } from "../content";

const STACK_ROW_1 = [
  "LLaMA & RAG",
  "AWS Serverless",
  "React 19",
  "TypeScript",
  "Flutter & Dart",
];

const STACK_ROW_2 = [
  "TensorFlow Lite",
  "MediaPipe",
  "FastAPI",
  "DynamoDB",
  "Cloudflare",
];

function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(target);
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) { setVal(target); return; }
    let start: number | null = null;
    let raf = 0;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / duration);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export default function BentoWidgets({ onCopyEmail, onOpenChat }: { onCopyEmail: () => void; onOpenChat: () => void }) {
  const [time, setTime] = useState("");
  const projects = useCountUp(5, 800);
  const efficiency = useCountUp(30, 1000);
  const accuracy = useCountUp(90, 1100);

  useEffect(() => {
    const fmt = () => {
      try {
        setTime(
          new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }).format(new Date())
        );
      } catch {
        setTime("IST");
      }
    };
    fmt();
    const id = window.setInterval(fmt, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="bento container" aria-label="Live highlights and quick actions">
      <div className="bento__card bento__status">
        <span className="bento__eyebrow">LIVE TELEMETRY</span>
        <p className="bento__clock" data-tip="Live local time in Chennai">{time || "—"}</p>
        <p className="bento__loc">Chennai, India (IST)</p>
        <p className="bento__avail"><i aria-hidden="true" /> Open to AI &amp; Cloud roles</p>
      </div>

      <div className="bento__card bento__metrics">
        <span className="bento__eyebrow">IMPACT SNAPSHOT</span>
        <div className="bento__stats">
          <div>
            <strong>{projects}+</strong>
            <span>Shipped Systems</span>
          </div>
          <div>
            <strong>{efficiency}%</strong>
            <span>HMI Gain @ ESAB</span>
          </div>
          <div>
            <strong>{accuracy}%+</strong>
            <span>ASL Accuracy</span>
          </div>
        </div>
      </div>

      <div className="bento__card bento__actions">
        <span className="bento__eyebrow">QUICK LAUNCH</span>
        <div className="bento__btns">
          <button type="button" className="bento__btn" onClick={onOpenChat}>Ask Jeffry AI</button>
          <button type="button" className="bento__btn" onClick={onCopyEmail} data-tip="Copy email to clipboard">Copy Email</button>
          <a className="bento__btn" href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a className="bento__btn" href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
      </div>

      <div className="bento__card bento__marquee-card">
        <span className="bento__eyebrow">CORE STACK IN MOTION</span>
        <div className="marquee-stack" aria-label="Core technologies">
          <div className="marquee">
            <div className="marquee__track">
              {[...STACK_ROW_1, ...STACK_ROW_1].map((item, idx) => (
                <span key={idx} className="marquee__pill">{item}</span>
              ))}
            </div>
          </div>
          <div className="marquee">
            <div className="marquee__track marquee__track--reverse">
              {[...STACK_ROW_2, ...STACK_ROW_2].map((item, idx) => (
                <span key={idx} className="marquee__pill marquee__pill--alt">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
