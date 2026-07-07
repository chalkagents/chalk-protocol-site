import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchDoc } from '../src/lib/fetch-doc.mjs';
import { DOCS } from '../src/lib/docs.mjs';

// The ONE live test: it hits the real upstream default, so it is OPT-IN and skipped
// unless CHALK_LIVE_SMOKE=1. This keeps `npm test` deterministic offline (the default
// suite never touches the network) while still giving a way to prove the production
// default URL and its docs are reachable — run it manually or on a scheduled job.
const RUN = process.env.CHALK_LIVE_SMOKE === '1';
const UPSTREAM = 'https://raw.githubusercontent.com/chalkagents/chalk-protocol/main';

describe('live upstream smoke (opt-in: CHALK_LIVE_SMOKE=1)', { skip: !RUN }, () => {
  for (const doc of DOCS) {
    test(`${doc.file} is reachable and non-empty upstream`, async () => {
      const md = await fetchDoc(`${UPSTREAM}/${doc.file}`);
      assert.ok(md.trim().length > 0, `expected non-empty ${doc.file} from upstream`);
    });
  }
});
