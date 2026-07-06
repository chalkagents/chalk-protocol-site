---
generator: chalk-protocol
id: "task-9c9377a6"
name: "chore(security): safe Vercel wiring for a public repo — main-only production, fork-approval previews, zero secrets"
overview: "Vercel project connected to `chalkagents/chalk-protocol-site`, framework=Astro, production branch = `main` ONLY."
created: "2026-07-06T09:49:31.663Z"
todos:
  - id: "task-9c9377a6-c1"
    content: "Vercel project connected to `chalkagents/chalk-protocol-site`, framework=Astro, production branch = `main` ONLY."
    status: pending
  - id: "task-9c9377a6-c2"
    content: "Fork safety: \"Require authorization for deployments from forked repositories\" enabled (member approval before a fork PR gets a preview); no env vars configured at all (the site needs none — if one ever appears, scope it to Production only, never Preview)."
    status: pending
  - id: "task-9c9377a6-c3"
    content: "Deployment protection for previews if on Pro (password/SSO); otherwise accept public unguessable preview URLs — fine for a marketing site."
    status: pending
  - id: "task-9c9377a6-c4"
    content: "Domain: `protocol.chalkagents.com` CNAME → Vercel; `chalk-protocol-site.vercel.app` until DNS is ready."
    status: pending
  - id: "task-9c9377a6-c5"
    content: "After the domain is live: set `chalkagents/chalk-protocol`'s repo `homepage` field and add the link to its README (small PR in the parent repo)."
    status: pending
  - id: "task-9c9377a6-c6"
    content: "Production deploys only from pushes to main; PR previews require member approval for forks."
    status: pending
  - id: "task-9c9377a6-c7"
    content: "No env vars / secrets in this repo or exposed to previews."
    status: pending
  - id: "task-9c9377a6-c8"
    content: "Site reachable at the production URL."
    status: pending
---

# chore(security): safe Vercel wiring for a public repo — main-only production, fork-approval previews, zero secrets

> state: **blocked** · phase: discovery

## Objective

- Vercel project connected to `chalkagents/chalk-protocol-site`, framework=Astro, production branch = `main` ONLY.
- Fork safety: "Require authorization for deployments from forked repositories" enabled (member approval before a fork PR gets a preview); no env vars configured at all (the site needs none — if one ever appears, scope it to Production only, never Preview).
- Deployment protection for previews if on Pro (password/SSO); otherwise accept public unguessable preview URLs — fine for a marketing site.
- Domain: `protocol.chalkagents.com` CNAME → Vercel; `chalk-protocol-site.vercel.app` until DNS is ready.
- After the domain is live: set `chalkagents/chalk-protocol`'s repo `homepage` field and add the link to its README (small PR in the parent repo).
- Production deploys only from pushes to main; PR previews require member approval for forks.
- No env vars / secrets in this repo or exposed to previews.
- Site reachable at the production URL.

---
_Generated from `.chalk/tasks.json` by `chalk plans`. Edit tasks via the chalk CLI, not here._
