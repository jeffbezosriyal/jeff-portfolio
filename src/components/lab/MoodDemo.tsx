import { useEffect, useRef, useState } from "react";
import { useWebcam } from "../../hooks/useWebcam";
import { classifyMood, MOOD_INFO, readFace, stressSignal, type FaceSignals, type Mood } from "../../lib/mood";
import { createFaceLandmarker } from "../../lib/vision";
import LabLoader from "./LabLoader";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";

const MAX = 60;

export default function MoodDemo() {
  const { videoRef, active, error, start, stop } = useWebcam();
  const modelRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef(0);
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "failed">("idle");
  const [mood, setMood] = useState<Mood | null>(null);
  const [signalPct, setSignalPct] = useState(0);
  const [smilePct, setSmilePct] = useState(0);
  const [focusPct, setFocusPct] = useState(0);
  const [trend, setTrend] = useState<number[]>([]);

  const halt = () => {
    cancelAnimationFrame(rafRef.current);
    stop();
    setStatus("idle");
    setMood(null);
    setSignalPct(0);
    setSmilePct(0);
    setFocusPct(0);
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

    // Smoothed scores + 3-frame stability buffer so emotion labels never flicker.
    let s: FaceSignals = { smile: 0, frown: 0, browUp: 0, browDown: 0, squint: 0, jawOpen: 0 };
    let lastTime = -1, lastPush = 0;
    let candidate: Mood | null = null;
    let streak = 0;

    const loop = () => {
      const v = videoRef.current, m = modelRef.current;
      if (!v || !m) return;
      if (v.readyState >= 2 && v.currentTime !== lastTime) {
        lastTime = v.currentTime;
        const res = m.detectForVideo(v, performance.now());
        const cats = res.faceBlendshapes?.[0]?.categories;
        if (cats) {
          const raw = readFace(cats);
          const a = 0.28;
          s = {
            smile: s.smile + (raw.smile - s.smile) * a,
            frown: s.frown + (raw.frown - s.frown) * a,
            browUp: s.browUp + (raw.browUp - s.browUp) * a,
            browDown: s.browDown + (raw.browDown - s.browDown) * a,
            squint: s.squint + (raw.squint - s.squint) * a,
            jawOpen: s.jawOpen + (raw.jawOpen - s.jawOpen) * a,
          };

          const nextMood = classifyMood(s);
          if (nextMood === candidate) streak++;
          else { candidate = nextMood; streak = 1; }
          if (streak >= 3) setMood(nextMood);

          const sig = stressSignal(s);
          setSignalPct(Math.round(sig * 100));
          setSmilePct(Math.min(100, Math.round(s.smile * 140)));
          setFocusPct(Math.min(100, Math.round((s.browDown * 0.6 + s.squint * 0.4) * 160)));

          const now = performance.now();
          if (now - lastPush > 450) {
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
              {status === "loading" ? (
                <LabLoader label="BOOTING FACE BLENDSHAPE ENGINE" />
              ) : (
                <>
                  <button
                    className="btn btn--lg"
                    onClick={run}
                    data-tip="Runs 100% on-device via MediaPipe"
                  >
                    Start camera
                  </button>
                  <p>Runs fully in your browser. No video is uploaded or stored.</p>
                </>
              )}
            </div>
          )}
          {active && <button className="btn demo__stop" onClick={halt} data-tip="Stop camera stream">Stop</button>}
        </div>
      </div>

      <div className="demo__panel" aria-live="polite">
        <div>
          <p className="demo__eyebrow">Detected emotion</p>
          <p className="demo__result">
            {info ? <><span aria-hidden="true">{info.emoji}</span> {info.label}</> : status === "running" ? "Look at the camera…" : "—"}
          </p>
          <p className="demo__sub">{info ? info.note : "Tracks smile, brow furrow, squint, and jaw blendshapes in real time."}</p>
          {(error || status === "failed") && (
            <p className="demo__error">{error ?? "Couldn’t load the face model. Check your connection and try again."}</p>
          )}
        </div>

        <div className="demo__meter-box">
          <div className="demo__meter-head" data-tip="Combined brow tension & frown offset by smiling">
            <span>Tension / Stress Signal</span>
            <strong>{active ? `${signalPct}%` : "Idle"}</strong>
          </div>
          <div className="demo__meter-bar" role="progressbar" aria-valuenow={signalPct} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${signalPct}%` }} />
          </div>
          <div className="demo__sub-meters">
            <span data-tip="Mouth smile + cheek squint">Smile: <strong>{active ? `${smilePct}%` : "—"}</strong></span>
            <span data-tip="Brow down + eye squint">Focus: <strong>{active ? `${focusPct}%` : "—"}</strong></span>
          </div>
          <svg className="demo__trend" viewBox="0 0 200 44" preserveAspectRatio="none" role="img" aria-label="Stress signal over time">
            <line x1="0" y1="22" x2="200" y2="22" stroke="rgba(255,255,255,.08)" strokeDasharray="3 3" />
            <line x1="0" y1="42" x2="200" y2="42" stroke="rgba(255,255,255,.15)" />
            {trend.length > 1 && <polyline points={pts} fill="none" stroke="#a362ff" strokeWidth="2.2" strokeLinejoin="round" />}
          </svg>
        </div>

        <p className="demo__note">
          5-state smoothed blendshape classifier (Happy, Focused, Neutral, Stressed, Surprised) inspired by Serenity. Demo only, not a medical tool.
        </p>
      </div>
    </div>
  );
}
