// Facts the chatbot may use. Keep this accurate; the assistant is told not to go beyond it.
export const KNOWLEDGE = `
NAME: Jeffry Raymond. Based in Chennai, India. Email: jeffryraymond2004@gmail.com. GitHub: github.com/jeffbezosriyal. LinkedIn: linkedin.com/in/jeffryraymond.
HEADLINE: Applied AI & Cloud Developer (LLM systems, AWS, React, full-stack deployment).
EDUCATION: B.E. Computer Science, Sathyabama Institute of Science and Technology, Chennai (Aug 2022 - Apr 2026), CGPA 7.13/10.

EXPERIENCE:
- AI Solutions Engineer, Wincy Software Solutions (May 2026 - present): built the company website with React 19, TypeScript, Vite and Tailwind CSS (17 reusable components, 13 sections, Framer Motion animations, SEO, custom logo-based theme). Built a contact form with email validation and spam protection connected through Google Apps Script to Google Sheets, with an automatic confirmation email. Deployed to Cloudflare with a custom domain (wincysoftwaresolutions.net).
- Cloud Engineering Intern, Hitachi (Feb 2026 - Apr 2026): AWS identity infrastructure (IAM users, roles, policies, trust relationships, STS cross-account role assumption, AWS Organizations, OUs, SCPs); deployed a VPC (subnets, route tables, IGW, NAT, security groups) with EC2, EBS and RDS and validated connectivity; integrated S3 (bucket policies, IAM conditions, explicit deny), Lambda, API Gateway and DynamoDB into serverless multi-service backends.
- Flutter App Developer Intern, ESAB (Sep 2025 - Jan 2026): built a Flutter/Dart Android HMI app for an industrial welding system with 20+ responsive UI components, Clean Architecture and BLoC state management; real-time bidirectional data communication with the welding system, improving operational efficiency by 30% and monitoring accuracy by 25%.
- Also listed on this portfolio: ACM Design Team Lead; co-founder of Zuuce, a marketing company.

PROJECTS:
- AI-Based Stress Detection System (final-year project, "Serenity"): CNN-based facial expression classifier combined with behavioural text analysis to detect stress from real-time video; low-latency frame-wise inference; Flutter app for stress trend monitoring and visualisation; dataset expansion and augmentation (about 5,000+ labelled samples) ongoing.
- AI health chatbot: built with Python, Flask, LLaMA and Pinecone (RAG).
- ASL Interpreter: Android app using CNN-based computer vision and hand landmark detection (OpenCV) recognising 15+ gestures with 90%+ accuracy on a custom dataset, with real-time on-device inference and an Android UI in Java/XML. He is now working on a new, more production-grade sign language recognition project.
- Grocery Shopping App UI/UX: mobile app design in Figma focused on user flows and information hierarchy.
- This portfolio: React + Vite + TypeScript, with in-browser sign language and mood demos (MediaPipe) and this chatbot (Gemini API behind a Cloudflare Function).

SKILLS: Python, FastAPI, Flask, JavaScript (ES6+), TypeScript, Dart, HTML5, CSS3, SQL; React, Flutter, BLoC, REST APIs, Firebase; LLM engineering (LLaMA, RAG pipelines), real-time inference (EfficientNet-B2, WebSocket streaming), NLP, TensorFlow Lite; AWS (IAM, EC2, EBS, S3, RDS, VPC, Lambda, API Gateway, DynamoDB, ECS task definitions, basic load balancing); PostgreSQL, DynamoDB, relational schema design; Git, Android Studio, VS Code, Docker (basic), n8n, Power BI, Google Sheets, Excel, Figma.
`.trim();
