# REZ

REZ is a customer-support agent a business installs with one script tag. Give it a website URL and it:

1. **Reads** the site with its own crawler (sitemap + links, respects robots.txt). Pages that arrive as an empty JavaScript shell are rendered in headless Chrome, so React/Vue/Angular sites work too.
2. **Extracts** small, single-topic answers with Gemini into structured Sanity documents. Every answer keeps its source URL. When two pages disagree, the answer is flagged for the business to review.
3. **Builds** a Sanity Context Knowledge Base from those documents (dataset source) and serves it to the agent through the Context MCP endpoint.
4. **Answers** customers in an embeddable widget, cites its source, and refuses to guess.
5. **Escalates** anything it can't resolve: a ticket document in Sanity plus an email to the business (SMTP) with the transcript and a drafted reply.
6. **Reports**: every conversation, including tool calls, is saved to Sanity Context Insights.

Businesses review and edit answers in the REZ dashboard (or Sanity Studio at `/studio`) and push edits to the Knowledge Base with one click.

## Architecture

```
Business website ──► Worker (Render, Docker + Chrome)
                       crawl → render JS → Gemini extract
                       └─► Sanity Content Lake  (business, sourcePage, knowledgeArticle, ticket)
                            └─► Sanity Context Knowledge Base  (dataset source, built via @sanity/client context API)

Customer ─► widget.js ─► /api/chat (Vercel) ─► Gemini + Context MCP tools (initial_context, knowledge_base_search, knowledge_base_read)
                                         └─► escalate_to_human → ticket in Sanity + SMTP email
                                         └─► conversation → Sanity Context Insights
```

* **Knowledge Bases** are created, sourced, built and refreshed with `client.context` from `@sanity/client`, so it works in serverless functions; no CLI at runtime.
* **One MCP endpoint serves every business**: the chat route selects the business's Knowledge Base per request with the `knowledgeBases` query parameter.
* **Plan limits**: the Sanity Free plan allows 2 Knowledge Bases per organization. Businesses beyond that still go live, served by a tenant-filtered GROQ search over the same structured articles.
* **Gemini free tier** allows ~5 requests/minute per model. REZ batches pages (5 per call) and rotates across several Gemini models, each with its own quota.

## Stack

Next.js 16 · Sanity (Content Lake, Studio, Context Knowledge Bases, MCP, Insights) · Vercel AI SDK 7 with `@ai-sdk/mcp` and Gemini · cheerio + turndown + Playwright crawler · nodemailer.

## Local setup

```bash
npm install
npx playwright install chromium   # only needed to crawl JavaScript-rendered sites locally
cp .env.example .env.local        # fill it in
npx sanity login
npx sanity schema deploy
npm run dev
```

Enable **Context** for your Sanity organization (Manage → organization → Labs), then create one MCP endpoint in Dashboard → Context and put its URL in `SANITY_CONTEXT_MCP_URL`.

Onboard from the home page, or from the command line:

```bash
npm run ingest -- "Acme Bikes" https://acmebikes.com support@acmebikes.com
npm run ingest -- "Acme Bikes" https://acmebikes.com support@acmebikes.com --kb-only   # rebuild the Knowledge Base only
```

## Deploy (free)

**Worker on Render** (crawling, Chrome, Knowledge Base builds; no time limit):
1. Push this repo to GitHub.
2. Render → New → Blueprint → select the repo. `render.yaml` defines a free Docker web service `rez-worker`.
3. Fill the env vars it asks for (Sanity IDs and tokens, Gemini key). Copy the generated `REZ_WORKER_SECRET`.

**App on Vercel** (dashboard, chat API, widget):
1. Vercel → Add New Project → import the repo.
2. Add every variable from `.env.example`, plus `REZ_WORKER_URL=https://rez-worker.onrender.com` and the same `REZ_WORKER_SECRET`.
3. Set `NEXT_PUBLIC_APP_URL` to the Vercel URL so the install snippet points at it.

The free Render instance sleeps after 15 minutes idle and wakes on the next onboarding request (~30–60 s). Chat and the widget run on Vercel and are always fast.

## Project layout

```
src/sanity/schema/      business, sourcePage, knowledgeArticle, ticket
src/lib/crawler.ts      sitemap + link crawler → Markdown, detects JavaScript shells
src/lib/render.ts       headless Chrome rendering (Playwright), loaded lazily
src/lib/extract.ts      batched Gemini extraction + duplicate/conflict merge
src/lib/ai.ts           Gemini model rotation for free-tier rate limits
src/lib/ingest.ts       crawl → extract → Sanity → Knowledge Base
src/lib/kb.ts           Sanity Context API: Knowledge Bases, builds, Insights
src/lib/jobs.ts         sends heavy jobs to the worker, or runs them locally
src/lib/agent.ts        agent tools (Context MCP + escalate) and system prompt
src/app/api/chat        streaming agent endpoint used by the widget
src/app/widget/[key]    iframe chat UI;  public/widget.js is the loader
src/app/dashboard       business dashboard: overview, knowledge, tickets, install, settings
worker/                 Render worker server + Dockerfile
```
