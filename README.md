# Jeffry Raymond — Portfolio (React + Vite + TypeScript)

Responsive build of the Figma design (frame 16:6, "Portfolio Design (Community)"), plus:
- **Ask Jeffry** chatbot (Gemini API behind a Cloudflare Pages Function)
- **The Lab**: in-browser Sign Language demo and Mood Detector (MediaPipe, camera never leaves the browser)
- Short intro loading screen (once per session)

## Run
    npm install
    npm run dev          # site + demos (chat needs the function, see below)
    npm run build        # production build -> dist/

## Chatbot (free Gemini API key, kept server-side)
1. Get a free API key in Google AI Studio: https://aistudio.google.com/app/apikey
2. Local test: copy `.dev.vars.example` to `.dev.vars`, paste your key as `GEMINI_API_KEY=...`, and run `npm run preview:cf`.
3. Production: Cloudflare Pages project -> Settings -> Variables and Secrets -> add secret `GEMINI_API_KEY`.
4. Optional: `GEMINI_MODEL` (defaults to `gemini-flash-latest`; or set e.g. `gemini-3.5-flash-lite`), `ALLOWED_ORIGINS` (extra allowed site origins).
5. In the Cloudflare dashboard add a Rate Limiting rule on `/api/chat`, and set a quota cap in Google AI Studio.
The facts the bot may use are in `functions/_lib/knowledge.ts` — keep them accurate.

## Images from Figma
Run `./scripts/download-assets.sh` to pull the avatar, ESAB logo and experience-card icons into `public/assets/`
(Figma links expire ~7 days after generation; otherwise export them from Figma with the same filenames).
Add `public/assets/featured.png` for the featured-project screenshot.
Skill icons are inline SVGs (`src/icons.ts`, regenerate with `npm run icons`).

## Editing content
Text, links and card data: `src/content.ts`.

## Deploy (Cloudflare Pages)
Build command `npm run build`, output directory `dist`. The `functions/` folder deploys automatically.

## If it won't start
1. Install Node.js 18 or newer (`node -v`), then run `npm install` inside this folder (not the parent).
2. Start with `npm run dev` and open the URL it prints (usually http://localhost:5173).
3. Missing images are fine: placeholders show until you add the real files to `public/assets/`.
4. The chatbot only works with Cloudflare Functions (`npm run preview:cf`); in plain `npm run dev` it shows a friendly error.
