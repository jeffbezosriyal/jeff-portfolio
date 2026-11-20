import { useState } from "react";
import { featuredProjects } from "../content";
import SafeImg from "./SafeImg";
import { FlutterHmiPlaceholder, ScreenshotPlaceholder } from "./Placeholders";

const ClickIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
    <path d="M9 2v3M3.5 4.5l2 2M2 9h3M13 4.5l-2 2M5.2 12.8l2-2M9.5 9.5l11 4.2-4.7 1.6-1.6 4.7z"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M9.5 9.5l11 4.2-4.7 1.6-1.6 4.7z" />
  </svg>
);

const ESAB_PROMPT = "Tell me about the ESAB Transmax XP6 Flutter HMI app and how you improved efficiency by 30%.";

export default function Featured({ onAskChat }: { onAskChat: (draft: string) => void }) {
  const [esabView, setEsabView] = useState<"tablet" | "mobile">("tablet");

  return (
    <section id="featured" className="section container featured-list" aria-label="Featured Projects">
      {featuredProjects.map((proj, idx) => {
        const hasDual = Boolean(proj.secondaryImage);
        const activeImg = hasDual && esabView === "mobile" ? proj.secondaryImage! : proj.image;
        const isEsab = proj.id === "esab-flutter";

        return (
          <div key={proj.id} className={`featured${idx % 2 === 1 ? " featured--flip" : ""}`}>
            <div className="featured__text">
              <p className="featured__label">{proj.label}</p>
              <h2 className="featured__title">{proj.title}</h2>
              <div className="featured__card">
                <p>{proj.text}</p>
                <ul className="featured__metrics">
                  {proj.metrics.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </div>
              <div className="featured__actions">
                <div className="featured__links">
                  {proj.links.map((l) =>
                    isEsab ? (
                      <button
                        key={l.label}
                        type="button"
                        className="featured__link-btn"
                        aria-label={l.label}
                        data-tip={l.label}
                        onClick={() => onAskChat(ESAB_PROMPT)}
                      >
                        <ClickIcon />
                      </button>
                    ) : (
                      <a key={l.label} href={l.href} aria-label={l.label} data-tip={l.label}>
                        <ClickIcon />
                      </a>
                    )
                  )}
                </div>
                {hasDual && (
                  <div className="featured__switch" role="group" aria-label="Switch device view">
                    <button
                      type="button"
                      className={esabView === "tablet" ? "is-active" : undefined}
                      onClick={() => setEsabView("tablet")}
                    >
                      Tablet HMI
                    </button>
                    <button
                      type="button"
                      className={esabView === "mobile" ? "is-active" : undefined}
                      onClick={() => setEsabView("mobile")}
                    >
                      Mobile App
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="featured__media">
              <div className={`featured__panel${hasDual && esabView === "mobile" ? " featured__panel--contain" : ""}`}>
                <SafeImg
                  file={activeImg}
                  alt={`${proj.title} ${hasDual ? esabView : ""} preview`}
                  fallback={proj.placeholder === "flutter" ? <FlutterHmiPlaceholder /> : <ScreenshotPlaceholder />}
                />
              </div>
              {proj.secondaryImage && esabView === "tablet" && (
                <button
                  type="button"
                  className="featured__mobile-pip"
                  onClick={() => setEsabView("mobile")}
                  aria-label="Switch to ESAB Mobile App screenshot"
                  data-tip="View Mobile App UI"
                >
                  <SafeImg file={proj.secondaryImage} alt="ESAB Mobile HMI preview" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
