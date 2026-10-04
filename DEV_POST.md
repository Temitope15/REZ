---
title: REZ: give it your website, get a support agent that cites its sources and knows when to call a human
published: false
tags: devchallenge, sanitychallenge, ai, nextjs
---

*This is a submission for the [Sanity Challenge](https://dev.to/challenges/sanity-2026-09-16): Ship an agent that queries real content.*

## What I Built

Small businesses answer the same questions all day: where is my order, can I return this, do you ship to Canada. Someone sits in the inbox from morning to night answering them.

**REZ** is a support agent a business sets up with one input, its website URL, and installs with one script tag.

1. **It reads the site.** A crawler I wrote follows the sitemap and links, respects `robots.txt`, and visits support pages first. If a page arrives as an empty JavaScript shell (a React app showing "Loading..."), REZ renders it in headless Chrome and reads the real content.
2. **It structures what it read.** Gemini turns each page into small, single-topic answers (FAQ, policy, how-to, troubleshooting, product, contact) stored as Sanity documents. Every answer keeps the URL it came from. When two pages disagree, the answer is flagged for a human to decide.
3. **It builds a Sanity Context Knowledge Base** from those documents and serves it to the agent through the Context MCP endpoint.
4. **It answers customers** in a chat widget, cites the entry it used, and says so when the knowledge base doesn't cover a question.
5. **It escalates instead of guessing.** Refunds, account changes, complaints, or anything it can't answer become a ticket in Sanity and an email to the business with the transcript and a drafted reply.

The business owner gets a dashboard to review answers, resolve conflicts, add what the website doesn't say, and push edits back to the Knowledge Base in one click.

## Demo

- **Live app:** <!-- TODO: Vercel URL -->
- **Try the agent:** <!-- TODO: Vercel URL -->/demo.html (a stand-in business website with the widget installed)
- **Video:** <!-- TODO: 2-minute walkthrough link -->

Things to ask the Death Wish Coffee demo agent:

| Ask | What happens |
|---|---|
| "What's your return policy if I don't like the coffee?" | Answers with the exact 30-day / $40 rule and notes coffee isn't returnable. Cites *Returns, Refunds & Exchanges*. |
| "Do you ship internationally?" | Answers from the shipping entry. |
| "What's the weather today?" | Says it doesn't know. No guessing. |
| "My bag arrived torn, I want a refund. I'm Ada, ada@example.com" | Can't issue refunds, so it opens a ticket and emails the team with a suggested reply. |

<!-- TODO: screenshots: widget answering with a source, dashboard overview, a ticket -->

## Code

<!-- TODO: GitHub repo URL -->

Next.js 16 · Sanity Content Lake, Studio, Context (Knowledge Bases, MCP, Insights) · Vercel AI SDK 7 with `@ai-sdk/mcp` · Gemini · cheerio, turndown, Playwright · nodemailer.

## How I Used Sanity

**Structured content first, Knowledge Base second.** REZ doesn't dump pages into an index. It writes typed documents: `business`, `sourcePage`, `knowledgeArticle` (kind, customer question, short answer, full answer, keywords, source references, confidence, review flag), and `ticket`. That structure is what makes the rest possible:

- The **Knowledge Base uses a dataset source** with a GROQ query that selects one business's enabled articles. When the owner edits or disables an answer, a refresh picks it up. The owner never touches a vector index.
- Sanity's build organized 41 articles from 15 pages into a topic tree (`returns_refunds`, `shipping/domestic`, `orders`, `subscriptions`, ...), and the agent navigates it with `initial_context` → `knowledge_base_search` → `knowledge_base_read`.
- **Conflicts surface where a human can fix them.** If the shipping page says 3–5 days and the FAQ says 2–4, the article is flagged with a note, shown in the dashboard, and fixed at the source.

**Context MCP as the only retrieval path.** The agent's tools are the Context MCP tools plus one of mine, `escalate_to_human`. One MCP endpoint serves every business: the chat route selects the right Knowledge Base per request with the `knowledgeBases` parameter, so adding a business needs no endpoint changes.

**Knowledge Bases from code, not the CLI.** Onboarding creates the Knowledge Base, attaches the dataset source, builds it, and polls the job with `client.context` from `@sanity/client`. It runs in a worker and would run in a serverless function. No CLI at runtime.

**Insights.** Every conversation, tool calls included, is saved with `client.context.conversations.save`, so the owner can see where the agent struggles and what content is missing.

**What happens without structure:** a keyword search over raw pages would return a whole help-center page for "can I return coffee?". REZ returns the one rule that applies, with the exception ("coffee and grocery items are not eligible"), and links to its source.

### Honest limits

- The Sanity Free plan allows 2 Knowledge Bases per organization. Businesses beyond that still go live on a tenant-filtered GROQ search over the same articles. They just don't get the Knowledge Base topic tree.
- The Gemini free tier allows about 5 requests a minute per model, so REZ batches 5 pages per call and rotates between models. Onboarding a 40-page site takes a few minutes.
- Pages behind a login aren't crawled, by design.
- Business replies to escalation emails don't thread back into the widget yet. The team replies to the customer by email directly.

## Sanity Project Details

- **Project ID:** `wtwf6oam`
- **Dataset:** `production` (public)
- **Knowledge Base:** Death Wish Coffee support (`kb9xFlYaxFwv`), dataset source over `knowledgeArticle` documents
- **Context MCP endpoint:** `rez`

<!-- Team: list all DEV handles here if submitting as a team -->
