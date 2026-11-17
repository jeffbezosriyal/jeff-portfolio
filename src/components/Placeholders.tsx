import type { Glyph } from "../content";

/** Minimal vector icons for the 4 experience cards, shown until real PNGs are added to /public/assets. */
export function GlyphTile({ glyph }: { glyph: Glyph }) {
  const paths: Record<Glyph, JSX.Element> = {
    web: <><rect x="3" y="4" width="18" height="15" rx="2" /><path d="M3 9h18M8 14h4" /></>,
    cloud: <path d="M7 18h10a4 4 0 0 0 .5-8 5.5 5.5 0 0 0-10.6-1A3.5 3.5 0 0 0 7 18z" />,
    mobile: <><rect x="6" y="2" width="12" height="20" rx="2" /><circle cx="12" cy="18" r="1" fill="currentColor" /></>,
    chip: <><rect x="7" y="7" width="10" height="10" rx="2" /><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4" /></>,
  };
  return (
    <svg className="ph ph--tile" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[glyph]}
    </svg>
  );
}

/** Placeholder avatar shown until me.png is added to /public/assets. */
export function AvatarPlaceholder() {
  return (
    <svg className="ph ph--avatar" viewBox="0 0 165 165" aria-hidden="true">
      <defs>
        <radialGradient id="av" cx="35%" cy="30%">
          <stop offset="0" stopColor="#a362ff" />
          <stop offset="1" stopColor="#2c1250" />
        </radialGradient>
      </defs>
      <circle cx="82.5" cy="82.5" r="82.5" fill="url(#av)" />
      <text x="82.5" y="96" textAnchor="middle" fill="#fff" fontSize="52" fontFamily="Preahvihear, sans-serif">JR</text>
    </svg>
  );
}

/** Placeholder featured-project graphic shown until featured.png is added to /public/assets. */
export function ScreenshotPlaceholder() {
  return (
    <svg className="ph ph--shot" viewBox="0 0 541 306" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#230b46" />
          <stop offset="1" stopColor="#130428" />
        </linearGradient>
      </defs>
      <rect width="541" height="306" fill="url(#bg)" />
      <rect x="34" y="28" width="210" height="155" rx="10" fill="rgba(163,98,255,.15)" stroke="rgba(163,98,255,.45)" />
      <circle cx="139" cy="95" r="34" fill="none" stroke="#a362ff" strokeWidth="2" strokeDasharray="6 4" />
      <text x="139" y="156" textAnchor="middle" fill="#ccd6f6" fontSize="13" fontFamily="Poppins, sans-serif">CNN + NLP Pipeline</text>
      <rect x="268" y="28" width="239" height="155" rx="10" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.12)" />
      <polyline points="290,145 335,120 380,132 425,84 475,96" fill="none" stroke="#a362ff" strokeWidth="3" strokeLinecap="round" />
      <text x="290" y="56" fill="#9857d3" fontSize="12" fontFamily="Poppins, sans-serif">Stress trend</text>
      <rect x="34" y="204" width="473" height="72" rx="10" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.1)" />
      <text x="54" y="246" fill="#fff" fontSize="15" fontFamily="Poppins, sans-serif">Serenity · Real-time expression + text inference</text>
    </svg>
  );
}

/** Placeholder graphic for the ESAB Flutter Industrial HMI project. */
export function FlutterHmiPlaceholder() {
  return (
    <svg className="ph ph--shot" viewBox="0 0 541 306" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1b0938" />
          <stop offset="1" stopColor="#0f0322" />
        </linearGradient>
      </defs>
      <rect width="541" height="306" fill="url(#bg2)" />
      <rect x="28" y="24" width="150" height="258" rx="14" fill="rgba(163,98,255,.12)" stroke="rgba(163,98,255,.45)" />
      <text x="46" y="54" fill="#a362ff" fontSize="11" fontFamily="Poppins, sans-serif">BLoC Telemetry</text>
      <text x="46" y="96" fill="#fff" fontSize="24" fontFamily="Poppins, sans-serif">+30%</text>
      <text x="46" y="116" fill="#ccd6f6" fontSize="11" fontFamily="Poppins, sans-serif">Efficiency</text>
      <text x="46" y="168" fill="#fff" fontSize="24" fontFamily="Poppins, sans-serif">+25%</text>
      <text x="46" y="188" fill="#ccd6f6" fontSize="11" fontFamily="Poppins, sans-serif">Accuracy</text>
      <rect x="196" y="24" width="316" height="122" rx="12" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.14)" />
      <polyline points="218,112 268,94 318,104 368,62 428,74 486,48" fill="none" stroke="#6ebff4" strokeWidth="3" strokeLinecap="round" />
      <text x="218" y="48" fill="#6ebff4" fontSize="12" fontFamily="Poppins, sans-serif">Bidirectional Welding Stream</text>
      <rect x="196" y="162" width="316" height="120" rx="12" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.14)" />
      <text x="218" y="200" fill="#fff" fontSize="15" fontFamily="Poppins, sans-serif">ESAB Flutter HMI · 20+ Responsive Components</text>
      <text x="218" y="226" fill="#ccd6f6" fontSize="12" fontFamily="Poppins, sans-serif">Clean Architecture · Real-time Android Tablet UI</text>
    </svg>
  );
}
