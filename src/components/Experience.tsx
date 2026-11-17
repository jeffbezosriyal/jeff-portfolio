import { experience } from "../content";
import SafeImg from "./SafeImg";
import { GlyphTile } from "./Placeholders";

export default function Experience() {
  return (
    <section id="work" className="section container" aria-labelledby="exp-title">
      <h2 id="exp-title" className="section__title">Experience &amp; Projects</h2>
      <ul className="exp-grid">
        {experience.map((e) => {
          const external = e.href?.startsWith("http");
          return (
            <li key={e.title}>
              <article className="exp-card">
                <div className="exp-card__icon">
                  {e.icon
                    ? <SafeImg file={e.icon} width={115} height={115} fallback={<GlyphTile glyph={e.glyph} />} />
                    : <GlyphTile glyph={e.glyph} />}
                </div>
                <div className="exp-card__body">
                  <h3>{e.title}</h3>
                  <p className="exp-card__meta">{e.org} · <time>{e.period}</time></p>
                  <p>{e.text}</p>
                  {e.href && (
                    <a className="btn" href={e.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {e.cta ?? "LEARN MORE"}
                    </a>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
