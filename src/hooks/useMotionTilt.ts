import { useEffect, type RefObject } from "react";

/**
 * Applies smooth 3D tilt (--rx, --ry, --tx, --ty, --scale, .is-near) from:
 * 1. Desktop mouse proximity (only the closest/active element)
 * 2. Mobile DeviceOrientation (gyroscope) with automatic baseline calibration
 * 3. Mobile DeviceMotion (accelerometer gravity) fallback for devices without gyro fusion
 * 4. iOS 13+ permission prompt on first tap (HTTPS)
 */
export function useMotionTilt(
  refs: RefObject<(HTMLElement | null)[]>,
  options: { maxDeg?: number; maxShift?: number; maxScale?: number; pad?: number } = {}
) {
  const { maxDeg = 16, maxShift = 9, maxScale = 0.06, pad = 90 } = options;

  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const fine = window.matchMedia?.("(pointer: fine)").matches;
    const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));

    const resetEl = (el: HTMLElement) => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
      el.style.setProperty("--tx", "0px");
      el.style.setProperty("--ty", "0px");
      el.style.setProperty("--scale", "1");
      el.classList.remove("is-near");
    };

    const resetAll = () => {
      for (const el of refs.current ?? []) if (el) resetEl(el);
    };

    // 1. Desktop mouse proximity (activates only the single nearest element)
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const list = refs.current ?? [];
      let activeEl: HTMLElement | null = null;
      let bestDist = Infinity;

      for (const el of list) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (
          e.clientX >= r.left - pad &&
          e.clientX <= r.right + pad &&
          e.clientY >= r.top - pad &&
          e.clientY <= r.bottom + pad
        ) {
          const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
          if (dist < bestDist) {
            bestDist = dist;
            activeEl = el;
          }
        }
      }

      for (const el of list) {
        if (!el) continue;
        if (el === activeEl) {
          const r = el.getBoundingClientRect();
          const halfW = r.width / 2 + pad;
          const halfH = r.height / 2 + pad;
          const nx = clamp((e.clientX - (r.left + r.width / 2)) / halfW, 1);
          const ny = clamp((e.clientY - (r.top + r.height / 2)) / halfH, 1);
          const s = Math.max(0, 1 - Math.hypot(nx, ny) * 0.55);
          el.style.setProperty("--rx", `${(-ny * maxDeg).toFixed(2)}deg`);
          el.style.setProperty("--ry", `${(nx * maxDeg).toFixed(2)}deg`);
          el.style.setProperty("--tx", `${(nx * maxShift * s).toFixed(2)}px`);
          el.style.setProperty("--ty", `${(ny * maxShift * s).toFixed(2)}px`);
          el.style.setProperty("--scale", `${(1 + maxScale * s).toFixed(3)}`);
          el.classList.add("is-near");
        } else {
          resetEl(el);
        }
      }
    };

    // 2. Mobile Gyroscope + Accelerometer fallback
    let gotOrientation = false;
    let baseBeta: number | null = null;
    let baseGamma: number | null = null;
    let baseAx: number | null = null;
    let baseAy: number | null = null;

    const applyVisibleTilt = (nx: number, ny: number) => {
      const mag = Math.min(1, Math.hypot(nx, ny));
      const vh = window.innerHeight || 800;
      for (const el of refs.current ?? []) {
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        el.style.setProperty("--rx", `${(-ny * maxDeg).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${(nx * maxDeg).toFixed(2)}deg`);
        el.style.setProperty("--tx", `${(nx * maxShift).toFixed(2)}px`);
        el.style.setProperty("--ty", `${(ny * maxShift).toFixed(2)}px`);
        el.style.setProperty("--scale", `${(1 + maxScale * 0.75 * mag).toFixed(3)}`);
        el.classList.toggle("is-near", mag > 0.14);
      }
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      gotOrientation = true;
      if (baseBeta === null) baseBeta = e.beta;
      if (baseGamma === null) baseGamma = e.gamma;
      const ny = clamp(e.beta - baseBeta, 28) / 28;
      const nx = clamp(e.gamma - baseGamma, 28) / 28;
      applyVisibleTilt(nx, ny);
    };

    const onMotion = (e: DeviceMotionEvent) => {
      if (gotOrientation) return;
      const g = e.accelerationIncludingGravity;
      if (!g || g.x == null || g.y == null) return;
      if (baseAx === null) baseAx = g.x;
      if (baseAy === null) baseAy = g.y;
      const nx = clamp(-(g.x - baseAx), 5) / 5;
      const ny = clamp(g.y - baseAy, 5) / 5;
      applyVisibleTilt(nx, ny);
    };

    let attached = false;
    const attachSensors = () => {
      if (attached) return;
      attached = true;
      window.addEventListener("deviceorientation", onOrientation, { passive: true });
      window.addEventListener("devicemotion", onMotion, { passive: true });
    };

    const DevOrient = window.DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;
    const DevMotion = window.DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> } | undefined;

    const onFirstTap = () => {
      if (DevOrient && typeof DevOrient.requestPermission === "function") {
        DevOrient.requestPermission().then((res) => { if (res === "granted") attachSensors(); }).catch(() => {});
      } else if (DevMotion && typeof DevMotion.requestPermission === "function") {
        DevMotion.requestPermission().then((res) => { if (res === "granted") attachSensors(); }).catch(() => {});
      } else {
        attachSensors();
      }
    };

    if (DevOrient && typeof DevOrient.requestPermission !== "function") {
      attachSensors();
    } else if (DevOrient || DevMotion) {
      window.addEventListener("touchend", onFirstTap, { once: true, passive: true });
      window.addEventListener("click", onFirstTap, { once: true, passive: true });
    }

    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerleave", resetAll);
    }

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", resetAll);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("devicemotion", onMotion);
      window.removeEventListener("touchend", onFirstTap);
      window.removeEventListener("click", onFirstTap);
    };
  }, [refs, maxDeg, maxShift, maxScale, pad]);
}
