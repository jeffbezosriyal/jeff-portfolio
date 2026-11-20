// Auto-generated from the single source of truth in src/data/portfolioData.ts.
// Adding a new skill or job role there automatically updates both the UI and the Gemini chatbot!
import {
  additionalProjects,
  experience,
  featuredProjects,
  profile,
  skillMatrix,
  skills,
} from "../../src/data/portfolioData";

const expLines = experience
  .map((e) => `- ${e.title}, ${e.org} (${e.period}): ${e.text}${e.details ? ` ${e.details}` : ""}`)
  .join("\n");

const featLines = featuredProjects
  .map((p) => `- ${p.title}: ${p.text} (${p.metrics.join(", ")})`)
  .join("\n");

const skillLines = skillMatrix
  .map((s) => `- ${s.name} [${s.category}, ${s.usage}%]: ${s.impact} Used in: ${s.usedIn.join(", ")}. Tools: ${s.tools.join(", ")}.`)
  .join("\n");

export const KNOWLEDGE = `
NAME: ${profile.name}. Based in ${profile.location}. Email: ${profile.email}. GitHub: ${profile.github}. LinkedIn: ${profile.linkedin}.
HEADLINE: Applied AI & Cloud Developer (LLM systems, AWS, React, Flutter, full-stack deployment).
EDUCATION: ${profile.education}.
LEADERSHIP: ${profile.leadership}.

EXPERIENCE:
${expLines}

FEATURED & OTHER PROJECTS:
${featLines}
${additionalProjects.map((p) => `- ${p}`).join("\n")}

SKILLS & WHERE USED:
${skillLines}
CORE TOOLKIT: ${skills.list.join(", ")}.
`.trim();
