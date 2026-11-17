import { useEffect, useRef, useState } from "react";
import { useWebcam } from "../../hooks/useWebcam";
import { classifyMood, MOOD_INFO, readFace, stressSignal, type Mood } from "../../lib/mood";
import { createFaceLandmarker } from "../../lib/vision";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";

const MAX = 60;

export default function MoodDemo() {
  const { videoRef, active, error, start, stop } = useWebcam();
  const modelRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef(0);
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "failed">("idle");
  const [mood, setMood] = useState<Mood | null>(null);
  const [signalPct, setSignalPct] = useState(0);
  const [trend, setTrend] = useState<number[]>([]);

  const halt = () => {
    cancelAnimationFrame(rafRef.current);
    stop();
    setStatus("idle");
    setMood(null);
    setSignalPct(0);
  };

  const run = async () => {
    setStatus("loading");
    try {
      modelRef.current ??= await createFaceLandmarker();
    } catch {
      setStatus("failed");
      return;
    }
    if (!(await start())) { setStatus("idle"); return; }
    setStatus("running");

    // Smoothed scores so the label doesn't flicker.
    let s = { smile: 0, frown: 0, brow: 0 };
    let lastTime = -1, lastPush = 0;
    const loop = () => {
      const v = videoRef.current, m = modelRef.current;
      if (!v || !m) return;
      if (v.readyState >= 2 && v.currentTime !== lastTime) {
        lastTime = v.currentTime;
        const res = m.detectForVideo(v, performance.now());
        const cats = res.faceBlendshapes?.[0]?.categories;
        if (cats) {
          const raw = readFace(cats);
          const a = 0.35;
          s = { smile: s.smile + (raw.smile - s.smile) * a, frown: s.frown + (raw.frown - s.frown) * a, brow: s.brow + (raw.brow - s.brow) * a };
          setMood(classifyMood(s));
          const sig = stressSignal(s);
          setSignalPct(Math.round(sig * 100));
          const now = performance.now();
          if (now - lastPush > 500) {
            lastPush = now;
            setTrend((t) => [...t.slice(-(MAX - 1)), sig]);
          }
        } else {
          setMood(null);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); modelRef.current?.close(); }, []);

  const info = mood ? MOOD_INFO[mood] : null;
  const pts = trend.map((v, i) => `${(i / (MAX - 1)) * 200},${40 - v * 36}`).join(" ");

  return (
    <div className="demo">
      <div className="demo__stage">
        <div className="demo__video">
          <video ref={videoRef} playsInline muted />
          {!active && (
            <div className="demo__overlay">
              <button className="btn btn--lg" onClick={run} disabled={status === "loading"}>
                {status === "loading" ? "Loading model…" : "Start camera"}
              </button>
              <p>Runs fully in your browser. No video is uploaded or stored.</p>
            </div>
          )}
        </div>
        {active && <button className="btn demo__stop" onClick={halt}>Stop</button>}
      </div>

      <div className="demo__panel" aria-live="polite">
        <div>
          <p className="demo__eyebrow">Detected mood</p>
          <p className="demo__result">
            {info ? <><span aria-hidden="true">{info.emoji}</span> {info.label}</> : status === "running" ? "Look at the camera…" : "—"}
          </p>
          <p className="demo__sub">{info ? info.note : "Smile, relax, or furrow your brow to see live expression scoring."}</p>
          {(error || status === "failed") && (
            <p className="demo__error">{error ?? "Couldn’t load the face model. Check your connection and try again."}</p>
          )}
        </div>

        <div className="demo__meter-box">
          <div className="demo__meter-head">
            <span>Tension / Stress Signal</span>
            <strong>{active ? `${signalPct}%` : "Idle"}</strong>
          </div>
          <div className="demo__meter-bar" role="progressbar" aria-valuenow={signalPct} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${signalPct}%` }} />
          </div>
          <svg className="demo__trend" viewBox="0 0 200 44" preserveAspectRatio="none" role="img" aria-label="Stress signal over time">
            <line x1="0" y1="22" x2="200" y2="22" stroke="rgba(255,255,255,.08)" strokeDasharray="3 3" />
            <line x1="0" y1="42" x2="200" y2="42" stroke="rgba(255,255,255,.15)" />
            {trend.length > 1 && <polyline points={pts} fill="none" stroke="#a362ff" strokeWidth="2.2" strokeLinejoin="round" />}
          </svg>
        </div>

        <p className="demo__note">
          A lightweight browser take on my Serenity stress-detection project (smiling, neutral or sad from facial blendshapes). Demo only, not a medical tool.
        </p>
      </div>
    </div>
  );
}
