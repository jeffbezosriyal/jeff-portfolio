import { useEffect, useRef, useState } from "react";
import { profile } from "../content";
import { useMotionTilt } from "../hooks/useMotionTilt";
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
  const avatarRefs = useRef<(HTMLElement | null)[]>([]);

  useMotionTilt(avatarRefs, { maxDeg: 20, maxShift: 10, maxScale: 0.08, pad: 140 });

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
          <div ref={(el) => { avatarRefs.current[0] = el; }} className="hero__avatar">
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
