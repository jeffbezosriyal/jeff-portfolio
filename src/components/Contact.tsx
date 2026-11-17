import { contact, profile } from "../content";

export default function Contact() {
  return (
    <footer id="contact" className="section container contact">
      <div className="contact__grid">
        <div>
          <h2>{contact.title}</h2>
          <p>{contact.text}</p>
          <a className="contact__mail" href={`mailto:${profile.email}`}>{profile.email}</a>
        </div>
        <div className="contact__aside">
          <p className="contact__badge"><span aria-hidden="true" /> Open to Applied AI &amp; Cloud roles</p>
          <ul className="contact__social">
            {contact.socials.map((s) => (
              <li key={s.label}><a href={s.href} target={s.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{s.label}</a></li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
