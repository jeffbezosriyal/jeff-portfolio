import { lazy, Suspense, useEffect, useState } from "react";

const AslDemo = lazy(() => import("./lab/AslDemo"));
const MoodDemo = lazy(() => import("./lab/MoodDemo"));

const tabs = [
  { id: "asl", label: "Sign Language", blurb: "Real-time hand tracking that recognises signs, running on your device." },
  { id: "mood", label: "Mood Detector", blurb: "Smiling, neutral or sad from your facial expression, in real time." },
] as const;

export default function Lab() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("asl");
  const current = tabs.find((t) => t.id === tab)!;
  useEffect(() => {
    const onNav = (e: Event) => {
      const d = (e as CustomEvent<{ labTab?: "asl" | "mood" }>).detail;
      if (d?.labTab === "asl" || d?.labTab === "mood") setTab(d.labTab);
    };
    window.addEventListener("portfolio:navigate", onNav);
    return () => window.removeEventListener("portfolio:navigate", onNav);
  }, []);
  return (
    <section id="lab" className="section container" aria-labelledby="lab-title">
      <h2 id="lab-title" className="section__title">The Lab</h2>
      <p className="lab__intro">Try my work instead of just reading about it. Pick a demo and start your camera.</p>
      <div className="tabs" role="tablist" aria-label="Demos">
        {tabs.map((t) => (
          <button key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`}
            className={`tabs__btn${tab === t.id ? " is-active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        <p className="lab__blurb">{current.blurb}</p>
        <Suspense fallback={<p className="lab__blurb">Loading demo…</p>}>
          {/* key remounts the demo on tab change, which stops the camera of the previous one */}
          {tab === "asl" ? <AslDemo key="asl" /> : <MoodDemo key="mood" />}
        </Suspense>
      </div>
    </section>
  );
}
