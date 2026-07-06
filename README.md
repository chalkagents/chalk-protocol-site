# chalk-protocol-site

Landing page and docs for [Chalk Protocol](https://github.com/chalkagents/chalk-protocol) —
deploys to **protocol.chalkagents.com**.

Marketing copy lives here; protocol documentation is rendered at build time from the
[`chalk-protocol`](https://github.com/chalkagents/chalk-protocol) repo (README, PROTOCOL.md,
QUICKSTART.md, RESEARCH.md), so this site can't drift from the source of truth.

## Built through chalk itself

This repo is driven by Chalk Protocol — the `.chalk/` directory is its live spine. Every change
lands through the gated loop (specced task → locked test → verify → adversarial review → merge
gate). See [AGENTS.md](./AGENTS.md) for the contract, and the parent repo's
[PROTOCOL.md](https://github.com/chalkagents/chalk-protocol/blob/main/PROTOCOL.md) for why the
gates exist.

## Develop

```sh
npm install
npm run dev      # local dev server
npm run build    # static build → dist/
node --test      # the verify gate's test lane
```
