---
generator: chalk-protocol
id: "task-8286522e"
name: "ci: GitHub Actions verify lane — node --test on PRs + main (remote broke-check for the merge gate)"
overview: "CI runs on PRs and on pushes to main; green on the current main."
created: "2026-07-06T09:49:31.664Z"
todos:
  - id: "task-8286522e-c1"
    content: "CI runs on PRs and on pushes to main; green on the current main."
    status: done
  - id: "task-8286522e-c2"
    content: "Workflow declares explicit read-only `permissions` and uses no secrets."
    status: done
  - id: "task-8286522e-c3"
    content: "`chalk merge`'s broke-check reports source=remote-CI (not local fallback) on the next issue-backed PR."
    status: done
---

# ci: GitHub Actions verify lane — node --test on PRs + main (remote broke-check for the merge gate)

> state: **done** · phase: discovery

## Objective

- CI runs on PRs and on pushes to main; green on the current main.
- Workflow declares explicit read-only `permissions` and uses no secrets.
- `chalk merge`'s broke-check reports source=remote-CI (not local fallback) on the next issue-backed PR.

## Reviews

- **pass** · 2026-07-06T09:53 · adversary

---
_Generated from `.chalk/tasks.json` by `chalk plans`. Edit tasks via the chalk CLI, not here._
