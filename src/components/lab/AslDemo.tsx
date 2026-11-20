import { useEffect, useRef, useState } from "react";
import { useWebcam } from "../../hooks/useWebcam";
import { classifySign, SIGN_GUIDES, Smoother } from "../../lib/gestures";
import { createHandLandmarker, HAND_CONNECTIONS } from "../../lib/vision";
import LabLoader from "./LabLoader";
import type { HandLandmarker } from "@mediapipe/tasks-vision";

export default function AslDemo() {
  const { videoRef, active, error, start, stop } = useWebcam();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelRef = useRef<HandLandmarker | null>(null);
  const rafRef = useRef(0);
  const [status, setStatus] = useState<"idle" | "loading" | "running" | "failed">("idle");
  const [sign, setSign] = useState<string | null>(null);
  const [selectedGuide, setSelectedGuide] = useState(SIGN_GUIDES[0]);

  const halt = () => {
    cancelAnimationFrame(rafRef.current);
    stop();
    setStatus("idle");
    setSign(null);
  };

  const run = async () => {
    setStatus("loading");
    try {
      modelRef.current ??= await createHandLandmarker();
    } catch {
      setStatus("failed");
      return;
    }
    if (!(await start())) { setStatus("idle"); return; }
    setStatus("running");

    const smoother = new Smoother();
    let lastTime = -1;
    const loop = () => {
      const v = videoRef.current, c = canvasRef.current, m = modelRef.current;
      if (!v || !c || !m) return;
      if (v.readyState >= 2 && v.currentTime !== lastTime) {
        lastTime = v.currentTime;
        if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; }
        const res = m.detectForVideo(v, performance.now());
        const ctx = c.getContext("2d")!;
        ctx.clearRect(0, 0, c.width, c.height);
        const hand = res.landmarks[0];
        if (hand) {
          ctx.lineWidth = 3; ctx.strokeStyle = "rgba(163,98,255,.95)";
          for (const [a, b] of HAND_CONNECTIONS) {
            ctx.beginPath();
            ctx.moveTo(hand[a].x * c.width, hand[a].y * c.height);
            ctx.lineTo(hand[b].x * c.width, hand[b].y * c.height);
            ctx.stroke();
          }
          ctx.fillStyle = "#fff";
          for (const p of hand) { ctx.beginPath(); ctx.arc(p.x * c.width, p.y * c.height, 3.5, 0, 7); ctx.fill(); }
          setSign(smoother.push(classifySign(hand)));
        } else {
          smoother.clear();
          setSign(null);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => () => { cancelAnimationFrame(rafRef.current); modelRef.current?.close(); }, []);

  const activeGuide = SIGN_GUIDES.find((g) => g.label === sign) ?? selectedGuide;

  return (
    <div className="demo">
      <div className="demo__stage">
        <div className="demo__video">
          <video ref={videoRef} playsInline muted />
          <canvas ref={canvasRef} />
          {!active && (
            <div className="demo__overlay">
              {status === "loading" ? (
                <LabLoader label="BOOTING HAND LANDMARK ENGINE" />
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
          <p className="demo__eyebrow">Detected sign</p>
          <p className="demo__result">
            {sign ? `${SIGN_GUIDES.find((g) => g.label === sign)?.emoji ?? ""} ${sign}` : (status === "running" ? "Show a hand…" : "—")}
          </p>
          {(error || status === "failed") && (
            <p className="demo__error">{error ?? "Couldn’t load the hand model. Check your connection and try again."}</p>
          )}
          <div className="demo__cue">
            <span className="demo__cue-emoji" aria-hidden="true">{activeGuide.emoji}</span>
            <div>
              <strong>Try “{activeGuide.label}”</strong>
              <p>{activeGuide.cue}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="demo__note">
            Tap any sign below to see its hand cue, or show it to the camera:
          </p>
          <ul className="demo__chips demo__chips--grid" aria-label="Signs this demo knows">
            {SIGN_GUIDES.map((g) => (
              <li key={g.label}>
                <button
                  type="button"
                  className={g.label === sign ? "is-on" : g.label === selectedGuide.label ? "is-picked" : undefined}
                  onClick={() => setSelectedGuide(g)}
                  data-tip={g.cue}
                >
                  <span aria-hidden="true">{g.emoji}</span> {g.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
