import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const slugs = ['protocol', 'quickstart', 'research'];

// `node --test` may run test files concurrently, and test/build.test.mjs also runs
// `npm run build` against the repo root. Build in an isolated copy of the project
// (with node_modules symlinked in) so the two files can never race on dist/ or .astro/.
const sandbox = mkdtempSync(path.join(os.tmpdir(), 'chalk-docs-pages-'));

describe('build-time docs rendering', () => {
  // Building (and, on a clean checkout, installing) can take a while.
  before(
    () => {
      if (!existsSync(path.join(root, 'node_modules'))) {
        execSync('npm install --no-audit --no-fund', { cwd: root, stdio: 'inherit' });
      }
      for (const entry of ['src', 'public', 'astro.config.mjs', 'package.json', 'tsconfig.json']) {
        const from = path.join(root, entry);
        if (existsSync(from)) {
          cpSync(from, path.join(sandbox, entry), { recursive: true });
        }
      }
      symlinkSync(path.join(root, 'node_modules'), path.join(sandbox, 'node_modules'), 'dir');
      execSync('npm run build', { cwd: sandbox, stdio: 'inherit' });
    },
    { timeout: 300_000 },
  );

  after(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  for (const slug of slugs) {
    test(`/${slug} renders the upstream markdown at build time`, () => {
      const file = path.join(sandbox, 'dist', slug, 'index.html');
      assert.ok(existsSync(file), `expected dist/${slug}/index.html after \`npm run build\``);
      const html = readFileSync(file, 'utf8');
      assert.ok(html.length > 0, `expected dist/${slug}/index.html to be non-empty`);
      assert.match(
        html,
        /<h[12][\s>]/,
        `expected rendered markdown headings (h1/h2) in dist/${slug}/index.html`,
      );
      assert.ok(
        html.includes(
          `https://github.com/chalkagents/chalk-protocol/blob/main/${slug.toUpperCase()}.md`,
        ),
        `expected /${slug} to link back to its upstream source file`,
      );
    });
  }

  test('landing page docs links point at the local pages', () => {
    const html = readFileSync(path.join(sandbox, 'dist', 'index.html'), 'utf8');
    for (const slug of slugs) {
      assert.ok(
        html.includes(`href="/${slug}"`),
        `expected dist/index.html to link to the local /${slug} page`,
      );
    }
  });

  test(
    'a failed docs fetch fails npm run build with a non-zero exit',
    { timeout: 300_000 },
    () => {
      assert.throws(
        () =>
          execSync('npm run build', {
            cwd: sandbox,
            stdio: 'pipe',
            // Nothing listens on port 1 — every fetch must fail, and the build with it.
            env: { ...process.env, DOCS_BASE_URL: 'http://127.0.0.1:1' },
          }),
        'expected `npm run build` to exit non-zero when the docs fetch fails',
      );
    },
  );
});
