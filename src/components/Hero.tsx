import { useEffect, useRef, useState } from "react";
import { profile } from "../content";
import SafeImg from "./SafeImg";
import { AvatarPlaceholder } from "./Placeholders";

const ROLES = [
  profile.role,
  "I’m an Applied AI Developer.",
  "I’m a Cloud Systems Builder.",
];

export default function Hero() {
  const [roleIdx, setRoleIdx] = useState(0);
  const [typed, setTyped] = useState(profile.role);
  const [deleting, setDeleting] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const full = ROLES[roleIdx];
    let timer: number;

    if (!deleting && typed === full) {
      timer = window.setTimeout(() => setDeleting(true), 2400);
    } else if (deleting && typed === "") {
      timer = window.setTimeout(() => {
        setDeleting(false);
        setRoleIdx((i) => (i + 1) % ROLES.length);
      }, 280);
    } else {
      const speed = deleting ? 28 : 48;
      timer = window.setTimeout(() => {
        setTyped(deleting ? full.slice(0, typed.length - 1) : full.slice(0, typed.length + 1));
      }, speed);
    }

    return () => window.clearTimeout(timer);
  }, [typed, deleting, roleIdx]);

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const el = avatarRef.current;
    if (reduced || !el) return;

    const applyTilt = (rx: number, ry: number, tx: number, ty: number, scale: number, active: boolean) => {
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      el.style.setProperty("--tx", `${tx.toFixed(2)}px`);
      el.style.setProperty("--ty", `${ty.toFixed(2)}px`);
      el.style.setProperty("--scale", `${scale.toFixed(3)}`);
      el.classList.toggle("is-near", active);
    };

    const resetTilt = () => applyTilt(0, 0, 0, 0, 1, false);

    // Desktop mouse proximity tilt
    const fine = window.matchMedia?.("(pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      if (!fine) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      const radius = Math.max(r.width * 1.45, 280);

      if (dist < radius) {
        const s = 1 - dist / radius;
        applyTilt((-dy / radius) * 22 * (0.5 + s), (dx / radius) * 22 * (0.5 + s), (dx / radius) * 10 * s, (dy / radius) * 10 * s, 1 + 0.08 * s, true);
      } else {
        resetTilt();
      }
    };

    // Mobile gyroscope tilt (Android + iOS 13+ permission on tap)
    let baseBeta: number | null = null;
    let baseGamma: number | null = null;
    const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      if (baseBeta === null) baseBeta = e.beta;
      if (baseGamma === null) baseGamma = e.gamma;
      const db = clamp(e.beta - baseBeta, 30);
      const dg = clamp(e.gamma - baseGamma, 30);
      const mag = Math.min(1, Math.hypot(db, dg) / 25);
      applyTilt((-db / 30) * 18, (dg / 30) * 18, (dg / 30) * 10, (db / 30) * 10, 1 + 0.06 * mag, mag > 0.12);
    };

    let gyroAttached = false;
    const attachGyro = () => {
      if (gyroAttached) return;
      gyroAttached = true;
      window.addEventListener("deviceorientation", onOrientation, { passive: true });
    };

    const DevOrient = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
    const onFirstTap = () => {
      if (DevOrient && typeof DevOrient.requestPermission === "function") {
        DevOrient.requestPermission().then((res) => { if (res === "granted") attachGyro(); }).catch(() => {});
      } else {
        attachGyro();
      }
    };

    if (DevOrient && typeof DevOrient.requestPermission !== "function") {
      attachGyro();
    } else if (DevOrient) {
      window.addEventListener("touchend", onFirstTap, { once: true, passive: true });
    }

    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", resetTilt);
    }

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", resetTilt);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("touchend", onFirstTap);
    };
  }, []);

  return (
    <section id="home" className="hero container">
      <div className="hero__top">
        <div className="hero__me">
          <div className="hero__hello">
            <svg className="hero__arrow" viewBox="0 0 92 48" fill="none" aria-hidden="true">
              <path
                d="M84 10 C 56 2, 28 12, 16 40"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <path
                d="M12 31 L15.5 41.5 L25.5 36.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Hello! I Am <strong>{profile.name}</strong></span>
          </div>
          <div ref={avatarRef} className="hero__avatar">
            <SafeImg file="me-ring.svg" eager className="hero__ring" />
            <SafeImg file="me.png" eager alt={profile.name} className="hero__photo" width={310} height={310}
              fallback={<AvatarPlaceholder />} />
          </div>
        </div>
        <div className="hero__pitch">
          <p className="hero__lead">{profile.heroLead}</p>
          <h1 className="hero__title">
            {profile.heroLine1}
            <br />
            {profile.heroLine2Pre}
            <span className="hero__accent">{profile.heroLine2Accent}</span>
          </h1>
          <p className="hero__sub">{profile.heroSub}</p>
        </div>
      </div>

      <div id="about" className="hero__about">
        <h2 className="hero__role" aria-label={profile.role}>{typed}<span className="caret" aria-hidden="true" /></h2>
        <p className="hero__current">
          {profile.current.pre}{" "}
          <span className="hero__company">
            {profile.current.logo && <SafeImg file={profile.current.logo} className="hero__company-logo" />}
            {profile.current.company}
          </span>
        </p>
        <p className="hero__text">{profile.about}</p>
      </div>
    </section>
  );
}
