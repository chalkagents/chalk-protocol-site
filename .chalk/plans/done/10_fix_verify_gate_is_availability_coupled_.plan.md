---
generator: chalk-protocol
id: "task-499ca372"
name: "fix: verify gate is availability-coupled — root-build tests live-fetch upstream markdown and transient network failures turn verify RED"
overview: "The docs loader retries transient fetch failures (network error / timeout / 5xx) with bounded backoff, and still fails hard on 404 or empty body"
created: "2026-07-06T12:46:50.921Z"
todos:
  - id: "task-499ca372-c1"
    content: "The docs loader retries transient fetch failures (network error / timeout / 5xx) with bounded backoff, and still fails hard on 404 or empty body"
    status: done
  - id: "task-499ca372-c2"
    content: "npm test is deterministic offline: the default suite never live-fetches raw.githubusercontent (build.test.mjs builds against a local fixture)"
    status: done
  - id: "task-499ca372-c3"
    content: "One clearly-labeled live smoke test builds against the real upstream default, opt-in (skipped unless CHALK_LIVE_SMOKE=1) so it can never flake the gate"
    status: done
  - id: "task-499ca372-c4"
    content: "Production build behavior is unchanged: a genuinely bad fetch (404/empty after retries) still fails the build non-zero"
    status: done
---

# fix: verify gate is availability-coupled — root-build tests live-fetch upstream markdown and transient network failures turn verify RED

> state: **done** · phase: discovery

## Objective

- The docs loader retries transient fetch failures (network error / timeout / 5xx) with bounded backoff, and still fails hard on 404 or empty body
- npm test is deterministic offline: the default suite never live-fetches raw.githubusercontent (build.test.mjs builds against a local fixture)
- One clearly-labeled live smoke test builds against the real upstream default, opt-in (skipped unless CHALK_LIVE_SMOKE=1) so it can never flake the gate
- Production build behavior is unchanged: a genuinely bad fetch (404/empty after retries) still fails the build non-zero

## Reviews

- **pass** · 2026-07-07T09:15 · adversary

---
_Generated from `.chalk/tasks.json` by `chalk plans`. Edit tasks via the chalk CLI, not here._
