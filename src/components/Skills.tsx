import { skills } from "../content";
import { skillIcons } from "../icons";
import LogoMark from "./LogoMark";

export default function Skills() {
  return (
    <section className="section container skills" aria-labelledby="skills-title">
      <h2 id="skills-title" className="skills__lead">
        {skills.lead}
        <span className="skills__accent">{skills.accent}</span>
        {skills.tail}
        <small>{skills.sub}</small>
      </h2>

      <ul className="skills__icons" aria-label="Technologies">
        {skillIcons.map((i) => (
          <li key={i.label} title={i.label}>
            <svg viewBox="0 0 24 24" fill={i.color} role="img" aria-label={i.label}><path d={i.path} /></svg>
          </li>
        ))}
      </ul>

      <svg className="skills__fan" viewBox="0 0 600 200" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="fan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a362ff" stopOpacity="0" />
            <stop offset="1" stopColor="#a362ff" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {[40, 110, 180, 250, 300, 350, 420, 490, 560].map((x) => (
          <path key={x} d={`M${x} 0 C ${x} 110, 300 90, 300 200`} fill="none" stroke="url(#fan)" strokeWidth="1.2" />
        ))}
      </svg>

      <div className="orbit" aria-hidden="true">
        <span className="orbit__ring orbit__ring--1" />
        <span className="orbit__ring orbit__ring--2" />
        <span className="orbit__ring orbit__ring--3" />
        <div className="orbit__core"><LogoMark /></div>
      </div>
    </section>
  );
}
