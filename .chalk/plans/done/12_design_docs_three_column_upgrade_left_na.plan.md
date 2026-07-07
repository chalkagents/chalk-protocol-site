---
generator: chalk-protocol
id: "task-058ccfa8"
name: "design: docs three-column upgrade — left nav + sticky TOC, code-copy buttons, callouts (hand-rolled, zero-dep)"
overview: "Docs pages render a three-column layout: left doc nav (active highlighted), constrained prose, right sticky TOC of the page's headings."
created: "2026-07-07T08:39:34.589Z"
todos:
  - id: "task-058ccfa8-c1"
    content: "Docs pages render a three-column layout: left doc nav (active highlighted), constrained prose, right sticky TOC of the page's headings."
    status: done
  - id: "task-058ccfa8-c2"
    content: "Every code block has a working copy button (hand-rolled, no dep)."
    status: done
  - id: "task-058ccfa8-c3"
    content: "GitHub-alert callouts in the source markdown render as styled note/tip/warning/caution boxes."
    status: done
  - id: "task-058ccfa8-c4"
    content: "Prose column is width-constrained and readable; prev/next, source link, heading anchors retained."
    status: done
  - id: "task-058ccfa8-c5"
    content: "All locked tests pass unmodified; new chrome covered by revert-sensitive assertions in test/site-chrome.test.mjs."
    status: done
  - id: "task-058ccfa8-c6"
    content: "Zero new deps; full suite green."
    status: done
---

# design: docs three-column upgrade — left nav + sticky TOC, code-copy buttons, callouts (hand-rolled, zero-dep)

> state: **done** · phase: discovery

## Objective

- Docs pages render a three-column layout: left doc nav (active highlighted), constrained prose, right sticky TOC of the page's headings.
- Every code block has a working copy button (hand-rolled, no dep).
- GitHub-alert callouts in the source markdown render as styled note/tip/warning/caution boxes.
- Prose column is width-constrained and readable; prev/next, source link, heading anchors retained.
- All locked tests pass unmodified; new chrome covered by revert-sensitive assertions in test/site-chrome.test.mjs.
- Zero new deps; full suite green.

## Reviews

- **block** · 2026-07-07T08:59 · adversary
- **pass** · 2026-07-07T09:03 · adversary

---
_Generated from `.chalk/tasks.json` by `chalk plans`. Edit tasks via the chalk CLI, not here._
