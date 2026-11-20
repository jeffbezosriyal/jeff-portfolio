import { experience, featuredProjects, profile, skillMatrix, skills } from "../../src/data/portfolioData";
import { Citation, retrieveChunks } from "./rag";

export interface AgentEnv {
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
  ALLOWED_ORIGINS?: string;
  GITHUB_TOKEN?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REFRESH_TOKEN?: string;
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
  TURNSTILE_SECRET_KEY?: string;
  SITE_URL?: string;
  RESUME_URL?: string;
}

export type SlotOption = {
  iso: string;
  label: string;
};

export type JdScorecard = {
  roleTitle: string;
  overallMatch: number;
  matchedSkills: string[];
  relevantProjects: { title: string; reason: string; sectionId: string }[];
  gaps: string[];
  summary: string;
};

export type GitHubRepoCard = {
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  language: string;
  languages: string[];
  updatedAt: string;
};

export type PendingBooking = {
  recruiterName: string;
  recruiterEmail: string;
  slotIso: string;
  slotLabel: string;
  notes?: string;
};

export type ConfirmedBooking = PendingBooking & {
  meetLink?: string;
  calendarUpdated: boolean;
  emailSent: boolean;
  resumeIncluded: boolean;
  resumeUrl?: string;
};

export type NavAction = {
  sectionId: string;
  skillName?: string;
  labTab?: "asl" | "mood";
};

export type ToolSideEffects = {
  citations: Citation[];
  slots?: SlotOption[];
  jdScorecard?: JdScorecard;
  githubRepo?: GitHubRepoCard;
  pendingBooking?: PendingBooking;
  navAction?: NavAction;
};

export const FUNCTION_DECLARATIONS = [
  {
    name: "search_portfolio_knowledge",
    description:
      "Search Jeffry Raymond's indexed portfolio knowledge base (projects, metrics, internships, skills, education) to ground technical or experience answers with citations.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query covering the topic, project, or skill." },
      },
      required: ["query"],
    },
  },
  {
    name: "analyze_jd_fit",
    description:
      "Compare a Job Description (JD) or role requirements pasted by a recruiter against Jeffry's skills, projects, and experience to produce a structured fit scorecard.",
    parameters: {
      type: "object",
      properties: {
        role_title: { type: "string", description: "Target job title, e.g. 'Applied AI Engineer'." },
        requirements: { type: "string", description: "Job description text or key requirements." },
      },
      required: ["role_title", "requirements"],
    },
  },
  {
    name: "inspect_github_repo",
    description:
      "Fetch live repository details (description, primary language, stars, last updated) from Jeffry's GitHub account (jeffbezosriyal).",
    parameters: {
      type: "object",
      properties: {
        repo_name: {
          type: "string",
          description: "Repository name under jeffbezosriyal (e.g. 'jeff-portfolio') or 'list' to see top repos.",
        },
      },
      required: ["repo_name"],
    },
  },
  {
    name: "navigate_portfolio",
    description:
      "Scroll the portfolio page to a relevant section (#about, #work, #skills, #featured, #lab, #contact) and optionally highlight a skill or open the ASL/Mood lab tab.",
    parameters: {
      type: "object",
      properties: {
        section_id: {
          type: "string",
          enum: ["#about", "#work", "#skills", "#featured", "#lab", "#contact"],
          description: "Target section anchor ID.",
        },
        skill_name: { type: "string", description: "Optional skill name to highlight in Strategic Skill Explorer." },
        lab_tab: { type: "string", enum: ["asl", "mood"], description: "Optional tab to open in The Lab." },
      },
      required: ["section_id"],
    },
  },
  {
    name: "check_availability",
    description:
      "Check Jeffry's upcoming 30-minute meeting availability (in IST) from Google Calendar when a recruiter wants to schedule a call or interview.",
    parameters: {
      type: "object",
      properties: {
        days_ahead: { type: "integer", description: "Number of upcoming days to check (1 to 7, default 5)." },
      },
    },
  },
  {
    name: "prepare_meeting_booking",
    description:
      "Prepare a meeting booking + resume email confirmation card for a recruiter AFTER they have chosen a slot and provided their name and email. Never invent an email or slot.",
    parameters: {
      type: "object",
      properties: {
        recruiter_name: { type: "string", description: "Recruiter's full name." },
        recruiter_email: { type: "string", description: "Recruiter's valid email address." },
        slot_iso: { type: "string", description: "Chosen slot start time in ISO-8601 format." },
        notes: { type: "string", description: "Optional interview topic or role note." },
      },
      required: ["recruiter_name", "recruiter_email", "slot_iso"],
    },
  },
];

// Lightweight strict input validators (no external schema dependency needed at edge)
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)$/;
const REPO_RE = /^[a-zA-Z0-9._-]{1,80}$/;
const INJECTION_RE = /(ignore\s+previous|system\s+prompt|<script|javascript:|\r|\n)/i;

function cleanStr(val: unknown, maxLen: number): string {
  if (typeof val !== "string") return "";
  return val.trim().slice(0, maxLen);
}

function formatSlotIST(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d) + " IST";
}

function generateWorkingSlots(daysAhead: number, busyRanges: { start: number; end: number }[]): SlotOption[] {
  const slots: SlotOption[] = [];
  const now = Date.now();
  const base = new Date(now);
  // Step day by day in IST (+05:30)
  for (let dOffset = 1; dOffset <= daysAhead && slots.length < 6; dOffset++) {
    const dayDate = new Date(base.getTime() + dOffset * 86_400_000);
    const istParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    }).formatToParts(dayDate);
    const weekday = istParts.find((p) => p.type === "weekday")?.value ?? "";
    if (weekday === "Sun" || weekday === "Sat") continue;
    const yyyy = istParts.find((p) => p.type === "year")?.value;
    const mm = istParts.find((p) => p.type === "month")?.value;
    const dd = istParts.find((p) => p.type === "day")?.value;
    if (!yyyy || !mm || !dd) continue;

    for (const hour of ["11:00", "15:00", "17:30"]) {
      const iso = `${yyyy}-${mm}-${dd}T${hour}:00+05:30`;
      const startMs = new Date(iso).getTime();
      const endMs = startMs + 30 * 60_000;
      const overlaps = busyRanges.some((b) => startMs < b.end && endMs > b.start);
      if (!overlaps && startMs > now + 3600_000) {
        slots.push({ iso, label: formatSlotIST(iso) });
      }
      if (slots.length >= 6) break;
    }
  }
  return slots;
}

let cachedGoogleToken: { token: string; exp: number } | null = null;

async function getGoogleAccessToken(env: AgentEnv): Promise<{ token: string | null; reason?: string }> {
  const missing = [
    !env.GOOGLE_CLIENT_ID && "GOOGLE_CLIENT_ID",
    !env.GOOGLE_CLIENT_SECRET && "GOOGLE_CLIENT_SECRET",
    !env.GOOGLE_REFRESH_TOKEN && "GOOGLE_REFRESH_TOKEN",
  ].filter(Boolean);
  if (missing.length) return { token: null, reason: `Missing env vars: ${missing.join(", ")}` };
  if (cachedGoogleToken && Date.now() < cachedGoogleToken.exp) {
    return { token: cachedGoogleToken.token };
  }
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID!.trim(),
      client_secret: env.GOOGLE_CLIENT_SECRET!.trim(),
      refresh_token: env.GOOGLE_REFRESH_TOKEN!.trim(),
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("Google OAuth token error:", res.status, errText);
    return { token: null, reason: `Google OAuth error (${res.status}): ${errText.slice(0, 180)}` };
  }
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (data.access_token) {
    cachedGoogleToken = { token: data.access_token, exp: Date.now() + Math.max(60, (data.expires_in ?? 3600) - 300) * 1000 };
  }
  return { token: data.access_token ?? null, reason: data.access_token ? undefined : "No access_token in OAuth response" };
}

export async function verifyTurnstile(token: string | undefined, ip: string, env: AgentEnv): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true; // Not configured -> skip check gracefully
  if (!token || token.length > 2048) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip,
    }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return Boolean(data.success);
}

export async function executeBookingAndEmail(
  booking: PendingBooking,
  env: AgentEnv
): Promise<ConfirmedBooking> {
  const name = cleanStr(booking.recruiterName, 80);
  const email = cleanStr(booking.recruiterEmail, 120);
  const iso = cleanStr(booking.slotIso, 40);
  const notes = cleanStr(booking.notes, 300);

  if (!name || !EMAIL_RE.test(email) || !ISO_RE.test(iso) || INJECTION_RE.test(name) || INJECTION_RE.test(email)) {
    throw new Error("Invalid booking details. Please verify your name, email, and time slot.");
  }

  const startMs = new Date(iso).getTime();
  if (Number.isNaN(startMs) || startMs < Date.now()) {
    throw new Error("Selected time slot is in the past or invalid.");
  }
  const endIso = new Date(startMs + 30 * 60_000).toISOString();
  const slotLabel = formatSlotIST(iso);
  const siteUrl = (env.SITE_URL || "https://jeff-portfolio-2gx.pages.dev").replace(/\/$/, "");
  const resumeUrl = env.RESUME_URL || profile.resumeUrl;

  let meetLink: string | undefined;
  let calendarUpdated = false;
  let emailSent = false;

  const auth = await getGoogleAccessToken(env);
  const accessToken = auth.token;
  if (accessToken) {
    // Create Google Calendar event with Google Meet link
    const calRes = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `Intro Call: ${name} × Jeffry Raymond`,
          description: `Scheduled via Jeffry's Portfolio AI Agent.\nRecruiter: ${name} (${email})${notes ? `\nNotes: ${notes}` : ""}`,
          start: { dateTime: iso, timeZone: "Asia/Kolkata" },
          end: { dateTime: endIso, timeZone: "Asia/Kolkata" },
          attendees: [{ email, displayName: name }],
          conferenceData: {
            createRequest: {
              requestId: `jr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        }),
      }
    );
    if (calRes.ok) {
      const calData = (await calRes.json()) as {
        hangoutLink?: string;
        conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
      };
      meetLink =
        calData.hangoutLink ||
        calData.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri;
      calendarUpdated = true;
    } else {
      const calErr = await calRes.text().catch(() => '');
      console.error('Google Calendar create error:', calRes.status, calErr);
      auth.reason = auth.reason || `Calendar API (${calRes.status}): ${calErr.slice(0, 160)}`;
    }
  }

  // Send follow-up email with Meet link + Resume link via Resend (preferred) or Gmail API
  const emailSubject = `Confirmed: Intro Call with Jeffry Raymond (${slotLabel})`;
  const emailBody = [
    `Hi ${name},`,
    ``,
    `Thanks for connecting through my portfolio! Looking forward to speaking with you on ${slotLabel}.`,
    meetLink ? `Google Meet Link: ${meetLink}` : `Calendar invite details will follow shortly from ${profile.email}.`,
    ``,
    `Resume: ${resumeUrl}`,
    `Portfolio: ${siteUrl}`,
    `GitHub: ${profile.github}`,
    ``,
    `Best,`,
    `Jeffry Raymond`,
  ].join("\n");

  if (env.RESEND_API_KEY) {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || `Jeffry Raymond <onboarding@resend.dev>`,
        to: [email],
        cc: [profile.email],
        subject: emailSubject,
        text: emailBody,
      }),
    });
    emailSent = resendRes.ok;
  } else if (accessToken) {
    const raw = btoa(
      unescape(
        encodeURIComponent(
          `To: ${email}\r\nSubject: ${emailSubject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${emailBody}`
        )
      )
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });
    emailSent = gmailRes.ok;
    if (!gmailRes.ok) {
      const gmErr = await gmailRes.text().catch(() => '');
      console.error('Gmail send error:', gmailRes.status, gmErr);
      auth.reason = auth.reason || `Gmail API (${gmailRes.status}): ${gmErr.slice(0, 160)}`;
    }
  }

  if (!calendarUpdated && !emailSent) {
    const detail = auth.reason ? ` [${auth.reason}]` : '';
    throw new Error(
      `Live Calendar/Email API credentials aren't connected on this server yet${detail}. Please email ${profile.email} directly with your preferred slot (${slotLabel}).`
    );
  }

  return {
    recruiterName: name,
    recruiterEmail: email,
    slotIso: iso,
    slotLabel,
    notes,
    meetLink,
    calendarUpdated,
    emailSent,
    resumeIncluded: true,
    resumeUrl,
  };
}

export async function runAgentTool(
  name: string,
  args: Record<string, unknown>,
  env: AgentEnv,
  effects: ToolSideEffects
): Promise<unknown> {
  if (name === "search_portfolio_knowledge") {
    const query = cleanStr(args.query, 240);
    const { chunks, citations } = retrieveChunks(query, 5);
    for (const c of citations) {
      if (!effects.citations.some((x) => x.id === c.id)) effects.citations.push(c);
    }
    return {
      results: chunks.map((c) => ({ title: c.title, sectionId: c.sectionId, content: c.content })),
    };
  }

  if (name === "analyze_jd_fit") {
    const roleTitle = cleanStr(args.role_title, 100) || "Target Role";
    const reqText = cleanStr(args.requirements, 2000).toLowerCase();
    const matchedSkills = skills.list.filter((s) =>
      s.toLowerCase().split(/\s+and\s+|\s+/).some((part) => part.length > 1 && reqText.includes(part))
    );
    const matrixMatches = skillMatrix.filter(
      (m) =>
        reqText.includes(m.category.toLowerCase().split(" ")[0]) ||
        m.tools.some((t) => reqText.includes(t.toLowerCase())) ||
        reqText.includes(m.name.toLowerCase().split(" ")[0])
    );

    const relevantProjects: { title: string; reason: string; sectionId: string }[] = [];
    for (const fp of featuredProjects) {
      const hay = `${fp.title} ${fp.text} ${fp.metrics.join(" ")}`.toLowerCase();
      if (matchedSkills.some((s) => hay.includes(s.toLowerCase())) || /ai|ml|flutter|mobile|stress|cnn|nlp|hmi/.test(reqText)) {
        relevantProjects.push({ title: fp.title, reason: fp.metrics.join(" · "), sectionId: "#featured" });
      }
    }
    for (const ex of experience) {
      const hay = `${ex.title} ${ex.org} ${ex.text}`.toLowerCase();
      if (/aws|cloud|vpc|iam|lambda|serverless/.test(reqText) && hay.includes("aws")) {
        relevantProjects.push({ title: `${ex.title} @ ${ex.org}`, reason: "AWS IAM, VPC, Lambda, DynamoDB", sectionId: "#work" });
      }
      if (/react|typescript|vite|frontend|full.?stack|web/.test(reqText) && hay.includes("react")) {
        relevantProjects.push({ title: `${ex.title} @ ${ex.org}`, reason: "React 19, TypeScript, Vite, Cloudflare", sectionId: "#work" });
      }
    }

    const commonGaps: string[] = [];
    if (/kubernetes|k8s|terraform/.test(reqText)) commonGaps.push("Production Kubernetes / Terraform at large scale (has AWS VPC/IAM/Lambda experience)");
    if (/java|spring|c\+\+|rust|golang|\bgo\b/.test(reqText)) commonGaps.push("Primary backend stack is Python (FastAPI/Flask) & TypeScript rather than Java/Go/C++");
    if (/5\+\s*years|senior|staff|lead/.test(reqText)) commonGaps.push("2026 B.E. CSE graduate with internships & shipped projects rather than 5+ years tenure");

    const uniqueSkills = Array.from(new Set([...matchedSkills, ...matrixMatches.map((m) => m.name)])).slice(0, 8);
    const rawScore = 58 + uniqueSkills.length * 6 + Math.min(relevantProjects.length, 3) * 5 - commonGaps.length * 7;
    const overallMatch = Math.max(45, Math.min(96, rawScore));

    const scorecard: JdScorecard = {
      roleTitle,
      overallMatch,
      matchedSkills: uniqueSkills.length ? uniqueSkills : ["Python", "AWS", "React", "TypeScript"],
      relevantProjects: relevantProjects.slice(0, 3),
      gaps: commonGaps,
      summary: `Strong alignment across ${uniqueSkills.slice(0, 3).join(", ") || "Applied AI & Full-Stack"} with ${relevantProjects.length || 2} directly relevant shipped builds.`,
    };
    effects.jdScorecard = scorecard;
    return scorecard;
  }

  if (name === "inspect_github_repo") {
    const repoInput = cleanStr(args.repo_name, 80);
    const repo = repoInput === "list" || !REPO_RE.test(repoInput) ? "jeff-portfolio" : repoInput;
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "jeffry-portfolio-agent",
    };
    if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;

    try {
      const res = await fetch(`https://api.github.com/repos/jeffbezosriyal/${encodeURIComponent(repo)}`, { headers });
      if (res.ok) {
        const data = (await res.json()) as {
          name: string;
          full_name: string;
          description: string | null;
          html_url: string;
          stargazers_count: number;
          language: string | null;
          updated_at: string;
        };
        let languages: string[] = data.language ? [data.language] : [];
        const langRes = await fetch(`https://api.github.com/repos/jeffbezosriyal/${encodeURIComponent(repo)}/languages`, { headers }).catch(() => null);
        if (langRes?.ok) {
          const langJson = (await langRes.json()) as Record<string, number>;
          languages = Object.keys(langJson).slice(0, 5);
        }
        const card: GitHubRepoCard = {
          name: data.name,
          fullName: data.full_name,
          description: data.description || "Portfolio & production engineering repository.",
          url: data.html_url,
          stars: data.stargazers_count ?? 0,
          language: data.language || "TypeScript",
          languages,
          updatedAt: data.updated_at?.slice(0, 10) || "2026",
        };
        effects.githubRepo = card;
        return card;
      }
    } catch {
      // Fall through to grounded fallback
    }
    const fallback: GitHubRepoCard = {
      name: repo,
      fullName: `jeffbezosriyal/${repo}`,
      description: "Jeffry Raymond's GitHub repository (live GitHub API rate-limited or private; view profile on GitHub).",
      url: `${profile.github}/${repo}`,
      stars: 0,
      language: "TypeScript",
      languages: ["TypeScript", "React", "Python"],
      updatedAt: "2026",
    };
    effects.githubRepo = fallback;
    return fallback;
  }

  if (name === "navigate_portfolio") {
    const allowedSections = new Set(["#about", "#work", "#skills", "#featured", "#lab", "#contact"]);
    const sectionId = cleanStr(args.section_id, 20);
    if (!allowedSections.has(sectionId)) return { ok: false, error: "Invalid section" };
    const labTabRaw = cleanStr(args.lab_tab, 10);
    const labTab = labTabRaw === "asl" || labTabRaw === "mood" ? labTabRaw : undefined;
    const skillName = cleanStr(args.skill_name, 60) || undefined;
    effects.navAction = { sectionId, skillName, labTab };
    return { ok: true, navigatedTo: sectionId, skillName, labTab };
  }

  if (name === "check_availability") {
    const days = Math.max(1, Math.min(7, Number(args.days_ahead) || 5));
    let busyRanges: { start: number; end: number }[] = [];
    let liveCalendarConnected = false;

    const auth = await getGoogleAccessToken(env);
  const accessToken = auth.token;
    if (accessToken) {
      const timeMin = new Date().toISOString();
      const timeMax = new Date(Date.now() + (days + 1) * 86_400_000).toISOString();
      const fbRes = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ timeMin, timeMax, timeZone: "Asia/Kolkata", items: [{ id: "primary" }] }),
      });
      if (fbRes.ok) {
        const fbData = (await fbRes.json()) as {
          calendars?: { primary?: { busy?: { start: string; end: string }[] } };
        };
        busyRanges = (fbData.calendars?.primary?.busy ?? []).map((b) => ({
          start: new Date(b.start).getTime(),
          end: new Date(b.end).getTime(),
        }));
        liveCalendarConnected = true;
      }
    }

    const slots = generateWorkingSlots(days, busyRanges);
    effects.slots = slots;
    return {
      liveCalendarConnected,
      timezone: "Asia/Kolkata (IST)",
      slots,
      note: liveCalendarConnected
        ? "Live Google Calendar slots fetched."
        : "Showing Jeffry's standard IST availability windows; confirmation will check or prompt direct email if OAuth secrets aren't set yet.",
    };
  }

  if (name === "prepare_meeting_booking") {
    const recruiterName = cleanStr(args.recruiter_name, 80);
    const recruiterEmail = cleanStr(args.recruiter_email, 120);
    const slotIso = cleanStr(args.slot_iso, 40);
    const notes = cleanStr(args.notes, 300) || undefined;

    if (!recruiterName || !EMAIL_RE.test(recruiterEmail) || !ISO_RE.test(slotIso)) {
      return { ok: false, error: "Need a valid recruiter name, email address, and ISO time slot." };
    }
    if (INJECTION_RE.test(recruiterName) || INJECTION_RE.test(recruiterEmail)) {
      return { ok: false, error: "Invalid characters in name or email." };
    }

    const pending: PendingBooking = {
      recruiterName,
      recruiterEmail,
      slotIso,
      slotLabel: formatSlotIST(slotIso),
      notes,
    };
    effects.pendingBooking = pending;
    return {
      ok: true,
      awaitingUserConfirmation: true,
      booking: pending,
      instruction: "Tell the user to review and click the Confirm & Book Meet button below to finalize the invite and send the resume.",
    };
  }

  return { error: `Unknown tool: ${name}` };
}
