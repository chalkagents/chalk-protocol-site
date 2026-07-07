# Decisions (ADR-lite)

## verify runs npm test + worktrees npm-install on setup

- _when:_ 2026-07-06T10:00:02.736Z
- _why:_ pipeline worktrees start without node_modules — verify went RED on 'astro: command not found' for issue #6; setup hook installs deps, and npm test carries the --test-concurrency=1 the executor added so parallel test files can't race the build

## repair lock path recorded from a worktree cwd

- _when:_ 2026-07-06T10:30:08.978Z
- _why:_ chalk spec --test run from the task worktree recorded '../<worktree>/test/docs-pages.test.mjs' — dead after cleanup; normalized to 'test/docs-pages.test.mjs' with the SAME sha (15892a308f4b). Path repair only, no gate touched; filing the resolution bug upstream

## Overrode review gate for "chore(security): branch-protect main — PR + required test check, squash-only, Dependabot"

- _when:_ 2026-07-06T11:44:48.817Z
- _why:_ settings-only task — no code diff to review: protection applied via gh api (required check 'test', enforce_admins, no force-push/delete, conversation resolution, 0-approval PR requirement), squash-only merge methods, Dependabot vulnerability alerts + security fixes enabled; evidence posted on issue #4

## v2.1 mono/sans boundary — mono means terminal content, not navigation

- _when:_ 2026-07-06T13:29:31.062Z
- _why:_ reviewer flagged the line as ambiguous: mono is for content a terminal would emit (commands, file names like PROTOCOL.md, the header/footer chrome which IS a terminal tab/status bar, session output); navigation prose (pager labels, doc-meta links, descriptions) is sans and sentence case. Glow only inside .terminal frames plus the hero install command; steps-list commands are phosphor without glow by design (calm surface).
