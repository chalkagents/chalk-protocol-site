---
generator: chalk-protocol
id: "task-13052f31"
name: "feat: build-time docs rendering from chalk-protocol markdown (/protocol, /quickstart, /research)"
overview: "`/protocol`, `/quickstart`, `/research` render the parent repo's current markdown at build time."
created: "2026-07-06T09:49:31.663Z"
todos:
  - id: "task-13052f31-c1"
    content: "`/protocol`, `/quickstart`, `/research` render the parent repo's current markdown at build time."
    status: done
  - id: "task-13052f31-c2"
    content: "A failed fetch fails `npm run build` (non-zero), it does not ship an empty page."
    status: done
  - id: "task-13052f31-c3"
    content: "Landing-page docs links point at the local pages; locked test covers all three pages."
    status: done
---

# feat: build-time docs rendering from chalk-protocol markdown (/protocol, /quickstart, /research)

> state: **done** · phase: discovery

## Objective

- `/protocol`, `/quickstart`, `/research` render the parent repo's current markdown at build time.
- A failed fetch fails `npm run build` (non-zero), it does not ship an empty page.
- Landing-page docs links point at the local pages; locked test covers all three pages.

## Locked tests (read-only — P6)

- `test/docs-pages.test.mjs`

## Reviews

- **block** · 2026-07-06T10:06 · adversary
- **pass** · 2026-07-06T10:31 · adversary

---
_Generated from `.chalk/tasks.json` by `chalk plans`. Edit tasks via the chalk CLI, not here._
