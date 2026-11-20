import {
  additionalProjects,
  experience,
  featuredProjects,
  workMetrics,
  learnings,
  profile,
  skillMatrix,
  skills,
} from "../../src/data/portfolioData";

export type KnowledgeChunk = {
  id: string;
  title: string;
  sectionId: string;
  tags: string[];
  content: string;
};

export type Citation = {
  id: string;
  label: string;
  sectionId: string;
};

const CHUNKS: KnowledgeChunk[] = [
  {
    id: "profile",
    title: "Profile & Education",
    sectionId: "#about",
    tags: ["jeffry", "raymond", "education", "cgpa", "sathyabama", "chennai", "acm", "zuuce", "contact", "email"],
    content: `${profile.name} (${profile.role}) in ${profile.location}. ${profile.education}. ${profile.leadership}. ${profile.about} Email: ${profile.email}. GitHub: ${profile.github}. LinkedIn: ${profile.linkedin}.`,
  },
  ...experience.map((e, idx) => ({
    id: `exp-${idx}`,
    title: `${e.title} — ${e.org}`,
    sectionId: e.href?.startsWith("#") ? e.href : "#work",
    tags: [e.org.toLowerCase(), e.title.toLowerCase(), e.glyph, "experience", "work"],
    content: `${e.title} at ${e.org} (${e.period}): ${e.text}${e.details ? ` Details: ${e.details}` : ""}${e.href && !e.href.startsWith("#") ? ` Live URL: ${e.href}` : ""}`,
  })),
  ...featuredProjects.map((p) => ({
    id: `feat-${p.id}`,
    title: p.title,
    sectionId: "#featured",
    tags: [p.id, p.title.toLowerCase(), ...p.metrics.map((m) => m.toLowerCase()), "featured", "project"],
    content: `${p.title} (${p.label}): ${p.text} Key metrics: ${p.metrics.join(", ")}.`,
  })),
  ...skillMatrix.map((s) => ({
    id: `skill-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: `${s.name} (${s.category})`,
    sectionId: "#skills",
    tags: [s.name.toLowerCase(), s.category.toLowerCase(), ...s.tools.map((t) => t.toLowerCase()), ...s.usedIn.map((u) => u.toLowerCase())],
    content: `${s.name} [${s.category}, ${s.usage}% usage]: ${s.impact} Used in: ${s.usedIn.join(", ")}. Tools: ${s.tools.join(", ")}. Proof points: ${s.proofs.join("; ")}.`,
  })),
  {
    id: "additional-projects",
    title: "Additional AI & Mobile Projects",
    sectionId: "#lab",
    tags: ["asl", "sign language", "health chatbot", "llama", "pinecone", "rag", "mediapipe", "figma", "portfolio"],
    content: `Additional shipped projects: ${additionalProjects.join(" ")} Core toolkit: ${skills.list.join(", ")}.`,
  },
  {
    id: "metrics-learnings",
    title: "Engineering Metrics & Principles",
    sectionId: "#work",
    tags: ["metrics", "impact", "architecture", "security", "latency", "principles"],
    content: `Impact highlights: ${workMetrics.map((m) => `${m.value} ${m.label} (${m.context})`).join("; ")}. Engineering learnings: ${learnings.map((l) => `${l.title}: ${l.detail}`).join(" ")}`,
  },
];

const SYNONYMS: Record<string, string[]> = {
  ai: ["ml", "llm", "gemini", "llama", "rag", "cnn", "nlp", "mediapipe", "tensorflow"],
  cloud: ["aws", "iam", "vpc", "lambda", "s3", "ec2", "rds", "dynamodb", "cloudflare", "serverless"],
  mobile: ["flutter", "dart", "android", "bloc", "hmi", "esab"],
  web: ["react", "typescript", "vite", "tailwind", "frontend", "wincy", "fullstack"],
  rag: ["pinecone", "vector", "retrieval", "llama", "chatbot", "gemini"],
  vision: ["cnn", "opencv", "mediapipe", "asl", "sign", "stress", "serenity", "mood"],
};

function tokenize(text: string): string[] {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9+.#-]+/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
  const expanded = new Set(base);
  for (const token of base) {
    for (const [k, syns] of Object.entries(SYNONYMS)) {
      if (token === k || syns.includes(token)) {
        expanded.add(k);
        syns.forEach((s) => expanded.add(s));
      }
    }
  }
  return Array.from(expanded);
}

export function retrieveChunks(query: string, topK = 5): { chunks: KnowledgeChunk[]; citations: Citation[] } {
  const qTokens = tokenize(query);
  if (!qTokens.length) {
    const fallback = CHUNKS.slice(0, topK);
    return {
      chunks: fallback,
      citations: fallback.map((c) => ({ id: c.id, label: c.title, sectionId: c.sectionId })),
    };
  }

  const scored = CHUNKS.map((chunk) => {
    const hay = `${chunk.title} ${chunk.tags.join(" ")} ${chunk.content}`.toLowerCase();
    let score = 0;
    for (const tok of qTokens) {
      if (chunk.title.toLowerCase().includes(tok)) score += 4;
      if (chunk.tags.some((t) => t.includes(tok))) score += 3;
      if (hay.includes(tok)) score += 1.5;
    }
    return { chunk, score };
  })
    .filter((x) => x.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  const selected = scored.map((s) => s.chunk);
  const seenSections = new Set<string>();
  const citations: Citation[] = [];
  for (const c of selected) {
    const key = `${c.title}|${c.sectionId}`;
    if (!seenSections.has(key)) {
      seenSections.add(key);
      citations.push({ id: c.id, label: c.title, sectionId: c.sectionId });
    }
  }
  return { chunks: selected, citations };
}
