import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile, execSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const upstreamBase = 'https://raw.githubusercontent.com/chalkagents/chalk-protocol/main';

// Fixture markdown served from a local HTTP server. Building against it proves the whole
// fetch -> renderMarkdown -> page pipeline end to end: each page must contain exactly the
// content that was fetched at build time (stale, cached, or partial content fails), with
// no dependency on live network access or the current shape of the upstream docs.
const fixtures = [
  {
    slug: 'protocol',
    file: 'PROTOCOL.md',
    heading: 'Protocol fixture heading f31a',
    sentinel: 'chalk-docs-fixture-protocol-9b7e2a',
  },
  {
    slug: 'quickstart',
    file: 'QUICKSTART.md',
    heading: 'Quickstart fixture heading c04d',
    sentinel: 'chalk-docs-fixture-quickstart-51d8e7',
  },
  {
    slug: 'research',
    file: 'RESEARCH.md',
    heading: 'Research fixture heading 7be2',
    sentinel: 'chalk-docs-fixture-research-e26c40',
  },
];
const markdownFor = (doc) => `# ${doc.heading}\n\nBody paragraph with sentinel ${doc.sentinel}.\n`;

// `node --test` may run test files concurrently, and test/build.test.mjs also runs
// `npm run build` against the repo root. Build in an isolated copy of the project
// (with node_modules symlinked in) so the two files can never race on dist/. The
// content-layer cache is project-local too (`cacheDir` in astro.config.mjs), so the
// sandbox build and the root build never share a data store either.
const sandbox = mkdtempSync(path.join(os.tmpdir(), 'chalk-docs-pages-'));

const server = http.createServer((req, res) => {
  const doc = fixtures.find((f) => req.url === `/${f.file}`);
  if (!doc) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8' });
  res.end(markdownFor(doc));
});

describe('build-time docs rendering', () => {
  // Building (and, on a clean checkout, installing) can take a while.
  before(
    async () => {
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
      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const base = `http://127.0.0.1:${server.address().port}`;
      // The fixture server lives in THIS process — a sync exec would freeze the event
      // loop, the loader's fetches would never be answered, and the build would hang
      // until undici's headers timeout. The build must run async so the server can serve.
      await new Promise((resolve, reject) => {
        execFile(
          'npm',
          ['run', 'build'],
          { cwd: sandbox, env: { ...process.env, DOCS_BASE_URL: base } },
          (err, stdout, stderr) =>
            err ? reject(new Error(`npm run build failed:\n${stdout}\n${stderr}`)) : resolve(),
        );
      });
    },
    { timeout: 300_000 },
  );

  after(() => {
    server.close();
    rmSync(sandbox, { recursive: true, force: true });
  });

  for (const doc of fixtures) {
    test(`/${doc.slug} renders exactly the markdown fetched at build time`, () => {
      const file = path.join(sandbox, 'dist', doc.slug, 'index.html');
      assert.ok(existsSync(file), `expected dist/${doc.slug}/index.html after \`npm run build\``);
      const html = readFileSync(file, 'utf8');
      assert.ok(html.length > 0, `expected dist/${doc.slug}/index.html to be non-empty`);
      assert.ok(
        html.includes(`${doc.heading}</h1>`),
        `expected the fetched markdown's h1 ("${doc.heading}") rendered as HTML in /${doc.slug}`,
      );
      assert.ok(
        html.includes(doc.sentinel),
        `expected the fetched markdown's body (sentinel ${doc.sentinel}) in /${doc.slug}`,
      );
      assert.ok(
        !html.includes(`# ${doc.heading}`),
        `expected /${doc.slug} to render the markdown, not dump it raw`,
      );
      assert.ok(
        html.includes(`https://github.com/chalkagents/chalk-protocol/blob/main/${doc.file}`),
        `expected /${doc.slug} to link back to its upstream source file`,
      );
    });
  }

  test('the docs loader defaults to the parent repo raw markdown', () => {
    // The fixture build overrides DOCS_BASE_URL; production builds must fetch the
    // parent repo's current markdown from chalkagents/chalk-protocol@main.
    const loader = readFileSync(path.join(sandbox, 'src', 'content.config.ts'), 'utf8');
    assert.ok(
      loader.includes(`'${upstreamBase}'`),
      `expected src/content.config.ts to default DOCS_BASE_URL to ${upstreamBase}`,
    );
  });

  test('landing page docs links point at the local pages', () => {
    const html = readFileSync(path.join(sandbox, 'dist', 'index.html'), 'utf8');
    for (const doc of fixtures) {
      assert.ok(
        html.includes(`href="/${doc.slug}"`),
        `expected dist/index.html to link to the local /${doc.slug} page`,
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
