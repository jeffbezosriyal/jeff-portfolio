import { useState } from "react";
import { learnings, skillMatrix, workMetrics, type SkillCategory } from "../content";

const CATEGORIES: ("All" | SkillCategory)[] = [
  "All",
  "AI & ML",
  "Cloud & AWS",
  "Frontend & Mobile",
  "Backend & Data",
];

export default function SkillMatrix() {
  const [cat, setCat] = useState<"All" | SkillCategory>("All");
  const visible = cat === "All" ? skillMatrix : skillMatrix.filter((s) => s.category === cat);
  const [selectedName, setSelectedName] = useState(skillMatrix[0].name);
  const active = visible.find((s) => s.name === selectedName) ?? visible[0];

  const R = 34;
  const C = 2 * Math.PI * R;
  const offset = C - (active.usage / 100) * C;

  return (
    <section id="skills" className="section container" aria-labelledby="matrix-title">
      <div className="matrix__head">
        <div>
          <h2 id="matrix-title" className="section__title">Strategic Skill Explorer</h2>
          <p className="matrix__sub">Select any capability to inspect usage depth, production proof points, and business impact.</p>
        </div>
        <div className="tabs" role="tablist" aria-label="Filter skills by domain">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={cat === c}
              className={`tabs__btn${cat === c ? " is-active" : ""}`}
              onClick={() => {
                setCat(c);
                const first = c === "All" ? skillMatrix[0] : skillMatrix.find((s) => s.category === c);
                if (first) setSelectedName(first.name);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="explorer">
        <ul className="explorer__list" role="listbox" aria-label="Skills list">
          {visible.map((s) => {
            const isOn = s.name === active.name;
            return (
              <li key={s.name}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isOn}
                  className={`explorer__item${isOn ? " is-active" : ""}`}
                  onClick={() => setSelectedName(s.name)}
                >
                  <span className="explorer__name">{s.name}</span>
                  <span className="explorer__meter">
                    <span className="explorer__bar"><i style={{ width: `${s.usage}%` }} /></span>
                    <small>{s.usage}%</small>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <article className="explorer__detail" aria-live="polite">
          <div className="explorer__detail-top">
            <div>
              <span className="matrix-card__cat">{active.category}</span>
              <h3>{active.name}</h3>
            </div>
            <div className="gauge" data-tip="Production usage & proficiency" aria-label={`${active.usage}% usage depth`}>
              <svg viewBox="0 0 84 84">
                <circle cx="42" cy="42" r={R} className="gauge__bg" />
                <circle
                  cx="42"
                  cy="42"
                  r={R}
                  className="gauge__fill"
                  strokeDasharray={C}
                  strokeDashoffset={offset}
                />
              </svg>
              <span>{active.usage}%</span>
            </div>
          </div>

          <p className="explorer__impact">{active.impact}</p>

          <div className="explorer__proofs">
            <span className="explorer__where-label">Key Deliverables &amp; Proof Points</span>
            <ul>
              {active.proofs.map((pt) => (
                <li key={pt}>{pt}</li>
              ))}
            </ul>
          </div>

          <div className="explorer__footer">
            <div>
              <span className="explorer__where-label">Deployed &amp; Applied In</span>
              <div className="matrix-card__tags">
                {active.usedIn.map((p) => (
                  <span key={p}>{p}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="explorer__where-label">Core Stack</span>
              <div className="explorer__tools">
                {active.tools.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </article>
      </div>

      <div className="impact-block">
        <div className="metrics-strip" aria-label="Work metrics">
          {workMetrics.map((m) => (
            <div key={m.label} className="metric-item">
              <strong>{m.value}</strong>
              <span>{m.label}</span>
              <small>{m.context}</small>
            </div>
          ))}
        </div>

        <h3 className="impact-block__title">Engineering Playbook &amp; Key Learnings</h3>
        <div className="learnings-grid">
          {learnings.map((l) => (
            <article key={l.title} className="learning-card">
              <span className="learning-card__from">{l.from}</span>
              <h4>{l.title}</h4>
              <p>{l.detail}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
