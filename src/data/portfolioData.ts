// SINGLE SOURCE OF TRUTH for all portfolio copy, work history, skills, and projects.
// Both the React frontend (src/content.ts) and the Gemini chatbot (functions/_lib/knowledge.ts)
// read directly from this file—add a new skill or job role here and everything updates automatically.

export const profile = {
  name: "Jeffry Raymond",
  location: "Chennai, India",
  education: "B.E. Computer Science, Sathyabama Institute of Science and Technology, Chennai (Aug 2022 – Apr 2026), CGPA 7.13/10",
  leadership: "ACM Design Team Lead; co-founder of Zuuce, a marketing company",
  email: "jeffryraymond2004@gmail.com",
  github: "https://github.com/jeffbezosriyal",
  linkedin: "https://www.linkedin.com/in/jeffryraymond",
  resumeUrl: "https://drive.google.com/file/d/16iSctku3-HkJWSo20ylZ3cPVb0eaQmZf/view?usp=sharing",
  heroLead: "Applied AI & Cloud Developer Who",
  heroLine1: "ships complete systems",
  heroLine2Pre: "from model to ",
  heroLine2Accent: "deployment…",
  heroSub: "ML models, APIs, interfaces & AWS cloud — engineered end to end, zero fluff.",
  role: "I’m an AI Solutions Engineer.",
  current: { pre: "Currently, I’m building at", company: "Wincy Software Solutions", logo: undefined as string | undefined },
  about:
    "I’m a full-stack developer working across AI, web and AWS cloud (B.E. CSE, Sathyabama Institute of Science and Technology, CGPA 7.13/10). I’ve shipped 5+ real-world projects — from an AI health chatbot (LLaMA + Pinecone) and a real-time stress detection pipeline to an industrial Flutter HMI app at ESAB. Outside code, I’ve led ACM Design and co-founded Zuuce.",
};

export const nav = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Work", href: "#work" },
  { label: "Skills", href: "#skills" },
  { label: "Lab", href: "#lab" },
];

export type Glyph = "web" | "cloud" | "mobile" | "chip";

export const experience: {
  title: string;
  org: string;
  period: string;
  text: string;
  details?: string;
  glyph: Glyph;
  icon?: string;
  href?: string;
  cta?: string;
}[] = [
  {
    title: "AI Solutions Engineer",
    org: "Wincy Software Solutions",
    period: "May 2026 – Present",
    text: "Engineered the company website with React 19, TypeScript, Vite and Tailwind (17 reusable components, 13 sections, Framer Motion, SEO) plus a Google Sheets lead pipeline on Cloudflare.",
    details: "Built with custom logo-based theming, email validation, spam protection via Google Apps Script to Google Sheets with auto-confirmation emails, deployed to Cloudflare with custom domain wincysoftwaresolutions.net.",
    glyph: "web",
    href: "https://wincysoftwaresolutions.net",
    cta: "VISIT SITE",
  },
  {
    title: "Cloud Engineering Intern",
    org: "Hitachi",
    period: "Feb 2026 – Apr 2026",
    text: "Architected AWS IAM & Organizations governance (STS, OUs, SCPs), multi-tier VPCs (EC2, EBS, RDS), and serverless backends with S3, Lambda, API Gateway and DynamoDB.",
    details: "Configured IAM users, roles, trust relationships, cross-account STS role assumption, VPC subnets, route tables, IGW, NAT, security groups, and S3 bucket policies with explicit deny.",
    glyph: "cloud",
  },
  {
    title: "Flutter App Developer Intern",
    org: "ESAB",
    period: "Sep 2025 – Jan 2026",
    text: "Built the Transmax XP6 industrial Flutter HMI app with 20+ responsive UI components, Clean Architecture & BLoC, boosting efficiency by 30% and monitoring accuracy by 25%.",
    details: "Implemented real-time bidirectional data communication with the industrial welding system on Android.",
    glyph: "mobile",
    href: "#featured",
    cta: "SEE SCREENS",
  },
  {
    title: "Final-Year Project: Stress Detection",
    org: "Sathyabama Institute of Science and Technology",
    period: "2025 – 2026",
    text: "Paired a CNN facial-expression classifier with behavioural text analysis for low-latency real-time inference, 5,000+ labelled samples, and a Flutter trend-monitoring app.",
    details: "Ongoing dataset expansion and augmentation (5,000+ labelled samples) with frame-wise low-latency inference.",
    glyph: "chip",
    href: "#lab",
    cta: "TRY THE DEMO",
  },
];

export type SkillCategory = "AI & ML" | "Cloud & AWS" | "Frontend & Mobile" | "Backend & Data";

export type SkillEntry = {
  name: string;
  category: SkillCategory;
  usage: number;
  usedIn: string[];
  impact: string;
  proofs: string[];
  tools: string[];
};

export const skillMatrix: SkillEntry[] = [
  {
    name: "Python & ML Pipelines",
    category: "AI & ML",
    usage: 94,
    usedIn: ["Serenity", "AI Health Chatbot", "ASL Interpreter"],
    impact: "Primary language for training CNN classifiers, orchestrating RAG pipelines, and serving low-latency inference.",
    proofs: [
      "Built frame-wise facial expression + behavioural text fusion pipeline",
      "Expanded & augmented Serenity dataset to 5,000+ labelled samples",
      "Served real-time ML endpoints via FastAPI and Flask",
    ],
    tools: ["Python", "TensorFlow Lite", "OpenCV", "EfficientNet-B2"],
  },
  {
    name: "LLaMA & RAG (Pinecone)",
    category: "AI & ML",
    usage: 86,
    usedIn: ["AI Health Chatbot", "Ask Jeffry"],
    impact: "Production RAG architectures with grounded retrieval, strict prompt guardrails, and zero-hallucination fallbacks.",
    proofs: [
      "Vector-indexed medical knowledge in Pinecone for semantic retrieval",
      "Integrated LLaMA inference with Flask REST orchestration",
      "Built edge-hosted Gemini chatbot with rate limiting & origin checks",
    ],
    tools: ["LLaMA", "Pinecone", "Gemini API", "NLP"],
  },
  {
    name: "Computer Vision (CNN / MediaPipe)",
    category: "AI & ML",
    usage: 90,
    usedIn: ["Serenity", "ASL Interpreter", "The Lab"],
    impact: "Real-time on-device vision pipelines engineered for low latency and high accuracy without server round-trips.",
    proofs: [
      "90%+ gesture accuracy across 15+ ASL signs on a custom dataset",
      "Zero-upload browser hand & face landmarking via MediaPipe WASM",
      "Real-time stress & mood scoring with exponential smoothing",
    ],
    tools: ["MediaPipe", "OpenCV", "CNN", "TFLite"],
  },
  {
    name: "AWS (IAM, VPC, Lambda, S3)",
    category: "Cloud & AWS",
    usage: 88,
    usedIn: ["Hitachi"],
    impact: "Enterprise-grade multi-account governance, isolated VPC networking, and event-driven serverless backends.",
    proofs: [
      "Configured IAM users, roles, trust policies, STS cross-account & SCPs",
      "Deployed multi-subnet VPCs with IGW, NAT, Security Groups, EC2, EBS & RDS",
      "Integrated S3 explicit-deny policies with Lambda, API Gateway & DynamoDB",
    ],
    tools: ["IAM", "VPC", "Lambda", "API Gateway", "ECS"],
  },
  {
    name: "Cloudflare Pages & Functions",
    category: "Cloud & AWS",
    usage: 85,
    usedIn: ["Wincy Software Solutions", "Portfolio"],
    impact: "Global edge deployment with custom domains, immutable asset caching, and secure server-side API proxies.",
    proofs: [
      "Deployed Wincy Software Solutions production site on custom domain",
      "Built Cloudflare Pages Function (/api/chat) keeping secrets server-side",
      "Configured strict security headers & Permissions-Policy",
    ],
    tools: ["Cloudflare Pages", "Wrangler", "Edge Functions"],
  },
  {
    name: "React 19 & TypeScript",
    category: "Frontend & Mobile",
    usage: 92,
    usedIn: ["Wincy Software Solutions", "Portfolio"],
    impact: "Modular, strictly typed web applications with custom design systems, responsive layouts, and SEO.",
    proofs: [
      "Architected 17 reusable components across 13 sections at Wincy",
      "Integrated Framer Motion animations & custom logo-based theming",
      "Built Google Apps Script -> Google Sheets lead pipeline with auto-email",
    ],
    tools: ["React 19", "TypeScript", "Vite", "Tailwind CSS"],
  },
  {
    name: "Flutter & Dart (BLoC)",
    category: "Frontend & Mobile",
    usage: 90,
    usedIn: ["ESAB Transmax XP6", "Serenity"],
    impact: "Industrial-grade Android HMI and companion mobile apps built with Clean Architecture and reactive streams.",
    proofs: [
      "Shipped 20+ responsive UI components for ESAB Transmax XP6 HMI",
      "Real-time bidirectional welding telemetry (+30% efficiency, +25% accuracy)",
      "Built Serenity Flutter app for live stress trend visualisation",
    ],
    tools: ["Flutter", "Dart", "BLoC", "Clean Architecture"],
  },
  {
    name: "FastAPI, Flask & REST APIs",
    category: "Backend & Data",
    usage: 87,
    usedIn: ["AI Health Chatbot", "Serenity", "Portfolio"],
    impact: "Clean, validated API layers connecting ML models, WebSocket streams, and frontend clients.",
    proofs: [
      "Designed REST & WebSocket streaming endpoints for live inference",
      "Implemented input validation, spam protection & rate limiting",
      "Connected mobile & web clients to serverless cloud backends",
    ],
    tools: ["FastAPI", "Flask", "REST", "WebSockets"],
  },
  {
    name: "DynamoDB & PostgreSQL",
    category: "Backend & Data",
    usage: 82,
    usedIn: ["Hitachi", "Backend Systems"],
    impact: "Balanced relational schema design and low-latency NoSQL data modelling for cloud workloads.",
    proofs: [
      "Provisioned & validated Amazon RDS connectivity inside private VPCs",
      "Built serverless DynamoDB persistence behind API Gateway & Lambda",
      "Designed relational schemas and SQL queries for structured apps",
    ],
    tools: ["DynamoDB", "PostgreSQL", "RDS", "Firebase"],
  },
];

export const workMetrics: { value: string; label: string; context: string }[] = [
  { value: "+30%", label: "Operational Efficiency", context: "ESAB Transmax XP6 Flutter HMI" },
  { value: "+25%", label: "Monitoring Accuracy", context: "Real-time bidirectional telemetry" },
  { value: "90%+", label: "Gesture Accuracy", context: "15+ ASL signs on custom dataset" },
  { value: "5,000+", label: "Labelled Samples", context: "Serenity stress dataset expansion" },
  { value: "17", label: "Reusable Components", context: "Wincy React 19 + TS (13 sections)" },
  { value: "7.13", label: "B.E. CSE CGPA", context: "Sathyabama (2022–2026) · ACM Lead" },
];

export const learnings: { title: string; detail: string; from: string }[] = [
  {
    title: "Architecture before UI",
    detail: "Clean Architecture + BLoC kept 20+ real-time industrial HMI screens predictable under live hardware streams.",
    from: "ESAB Internship",
  },
  {
    title: "Security by default in the cloud",
    detail: "Least-privilege IAM roles, STS cross-account trust, and explicit S3 deny policies prevent misconfigurations early.",
    from: "Hitachi Cloud",
  },
  {
    title: "Latency is a UX feature",
    detail: "Moving inference to frame-wise pipelines and on-device MediaPipe/TFLite keeps interactions snappy without server round-trips.",
    from: "Serenity & ASL",
  },
  {
    title: "Ship the full loop",
    detail: "Connecting frontend forms/chat directly to serverless edge functions and Sheets/Gemini turns prototypes into real products.",
    from: "Wincy & Portfolio",
  },
];

export const additionalProjects: string[] = [
  "AI health chatbot: built with Python, Flask, LLaMA and Pinecone (RAG).",
  "ASL Interpreter: Android app using CNN-based computer vision and OpenCV hand landmark detection recognising 15+ gestures with 90%+ accuracy on a custom dataset, plus a newer production-grade sign language project in progress.",
  "Grocery Shopping App UI/UX: mobile app design in Figma focused on user flows and information hierarchy.",
  "This portfolio: React + Vite + TypeScript, with in-browser MediaPipe sign language and mood demos and an edge-hosted Gemini chatbot.",
];

export const skills = {
  lead: "Looking to join a ",
  accent: "cross-functional",
  tail: " team",
  sub: "that loves turning ambitious AI ideas into reliable, shipped products",
  list: ["Python", "FastAPI", "React", "TypeScript", "Flutter", "Dart", "LLaMA and RAG", "TensorFlow Lite", "AWS", "PostgreSQL", "DynamoDB", "Git", "Figma"],
};

export const featured = {
  label: "Featured Project",
  title: "Serenity: AI Stress Detection",
  text:
    "A CNN-based facial expression classifier fused with behavioural text analysis to detect stress from live video — featuring a low-latency frame-wise inference pipeline and a Flutter app for trend monitoring.",
  image: "featured.png",
  links: [{ label: "Try the live mood demo", href: "#lab" }] as { label: string; href: string }[],
};

export const featuredProjects: {
  id: string;
  label: string;
  title: string;
  text: string;
  metrics: string[];
  image: string;
  secondaryImage?: string;
  placeholder: "serenity" | "flutter";
  links: { label: string; href: string }[];
}[] = [
  {
    id: "serenity",
    label: "Featured AI Project",
    title: "Serenity: AI Stress Detection",
    text:
      "A CNN-based facial expression classifier fused with behavioural text analysis to detect stress from live video — featuring a low-latency frame-wise inference pipeline and a Flutter app for trend monitoring.",
    metrics: ["CNN + NLP Fusion", "5,000+ Labelled Samples", "Flutter Companion App"],
    image: "featured.png",
    placeholder: "serenity",
    links: [{ label: "Try the live mood demo", href: "#lab" }],
  },
  {
    id: "esab-flutter",
    label: "Featured Flutter Project",
    title: "ESAB Transmax XP6 — Industrial HMI",
    text:
      "Production Flutter & Dart Android HMI built during my ESAB internship for an industrial welding system — featuring Clean Architecture, BLoC state management, 20+ responsive UI components, and real-time bidirectional telemetry.",
    metrics: ["+30% Efficiency", "+25% Accuracy", "20+ UI Components", "Clean Architecture + BLoC"],
    image: "esab-hmi.png",
    secondaryImage: "esab-hmi-mobile.png",
    placeholder: "flutter",
    links: [{ label: "Ask Jeffry about ESAB", href: "#contact" }],
  },
];

export const contact = {
  title: "Let’s Build Something",
  text: "Open to roles in applied AI, cloud engineering, and full-stack development. Have an interesting problem or team in mind? Drop a line.",
  socials: [
    { label: "GitHub", href: "https://github.com/jeffbezosriyal" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/jeffryraymond" },
    { label: "Email", href: "mailto:jeffryraymond2004@gmail.com" },
  ],
};
