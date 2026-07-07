---
generator: chalk-protocol
id: "task-9a589c92"
name: "fix: docs three-column layout is broken — TOC lands in the middle, article crammed into the right column"
overview: "At desktop (≥64rem) the layout renders left nav | article (center, widest) | TOC (right), each in its own explicit grid column."
created: "2026-07-07T09:32:52.399Z"
todos:
  - id: "task-9a589c92-c1"
    content: "At desktop (≥64rem) the layout renders left nav | article (center, widest) | TOC (right), each in its own explicit grid column."
    status: done
  - id: "task-9a589c92-c2"
    content: "On mobile the article stacks first, above the nav and TOC."
    status: done
  - id: "task-9a589c92-c3"
    content: "A revert-sensitive test asserts the built CSS pins the article to the center column (grid-column 2) and the rails to 1 and 3."
    status: done
  - id: "task-9a589c92-c4"
    content: "Full suite green; no new deps."
    status: done
---

# fix: docs three-column layout is broken — TOC lands in the middle, article crammed into the right column

> state: **done** · phase: discovery

## Objective

- At desktop (≥64rem) the layout renders left nav | article (center, widest) | TOC (right), each in its own explicit grid column.
- On mobile the article stacks first, above the nav and TOC.
- A revert-sensitive test asserts the built CSS pins the article to the center column (grid-column 2) and the rails to 1 and 3.
- Full suite green; no new deps.

## Reviews

- **block** · 2026-07-07T09:37 · adversary
- **block** · 2026-07-07T09:39 · adversary
- **pass** · 2026-07-07T09:42 · adversary

---
_Generated from `.chalk/tasks.json` by `chalk plans`. Edit tasks via the chalk CLI, not here._
