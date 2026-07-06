import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile, execSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// `node --test` may run test files concurrently, and test/build.test.mjs runs
// `npm run build` against the repo root. Build in an isolated copy of the project
// (with node_modules symlinked in) so the files can never race on dist/.
const sandbox = mkdtempSync(path.join(os.tmpdir(), 'chalk-site-chrome-'));

// Fixture markdown with an h2 (heading-anchor target) and a fenced code block
// (Shiki target) so the docs chrome can be asserted end to end.
const fixtureMarkdown = [
  '# Fixture doc',
  '',
  'Fixture body for the site-chrome test.',
  '',
  '## Fixture section anchor target',
  '',
  'Section body.',
  '',
  '```sh',
  'chalk verify',
  '```',
  '',
].join('\n');

const server = http.createServer((req, res) => {
  if (!req.url.endsWith('.md')) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8' });
  res.end(fixtureMarkdown);
});

const pages = [
  { name: 'landing', file: 'index.html', isDoc: false },
  { name: 'protocol', file: path.join('protocol', 'index.html'), isDoc: true },
  { name: 'quickstart', file: path.join('quickstart', 'index.html'), isDoc: true },
  { name: 'research', file: path.join('research', 'index.html'), isDoc: true },
];

const read = (page) => {
  const file = path.join(sandbox, 'dist', page.file);
  assert.ok(existsSync(file), `expected dist/${page.file} after \`npm run build\``);
  return readFileSync(file, 'utf8');
};

const pagerOf = (html, name) => {
  const match = html.match(/<nav[^>]*class="doc-pager"[^>]*>([\s\S]*?)<\/nav>/);
  assert.ok(match, `expected a <nav class="doc-pager"> block on /${name}`);
  return match[1];
};

describe('site chrome — shared layout, docs chrome, social meta', () => {
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
      // The fixture server lives in THIS process — the build must run async so the
      // event loop stays free to answer the loader's fetches.
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

  for (const page of pages) {
    test(`${page.name}: favicon and OG/social meta are present`, () => {
      const html = read(page);
      assert.ok(html.includes('rel="icon"'), `expected a rel="icon" link on ${page.name}`);
      assert.ok(html.includes('/favicon.svg'), `expected the favicon href on ${page.name}`);
      assert.ok(html.includes('property="og:title"'), `expected og:title on ${page.name}`);
      assert.ok(
        html.includes('property="og:description"'),
        `expected og:description on ${page.name}`,
      );
      assert.ok(html.includes('property="og:url"'), `expected og:url on ${page.name}`);
      assert.ok(html.includes('rel="canonical"'), `expected a canonical link on ${page.name}`);
      assert.ok(html.includes('name="twitter:card"'), `expected twitter:card on ${page.name}`);
    });

    test(`${page.name}: shared header and footer chrome are present`, () => {
      const html = read(page);
      const header = html.match(/<header[^>]*>([\s\S]*?)<\/header>/);
      assert.ok(header, `expected a <header> on ${page.name}`);
      assert.ok(
        header[1].includes('href="/"'),
        `expected the header on ${page.name} to link home`,
      );
      assert.ok(/<footer[^>]*>/.test(html), `expected a <footer> on ${page.name}`);
    });
  }

  test('the favicon asset itself ships in dist (the icon link cannot 404)', () => {
    assert.ok(
      existsSync(path.join(sandbox, 'dist', 'favicon.svg')),
      'expected public/favicon.svg to be copied to dist/favicon.svg by the build',
    );
  });

  test('landing: the loop section uses the terminal motif', () => {
    const html = read(pages[0]);
    assert.ok(html.includes('class="terminal"'), 'expected a terminal window in the loop section');
    assert.ok(html.includes('class="terminal-bar"'), 'expected the terminal title bar');
  });

  test('landing: the hero plays the gate-refusal session', () => {
    const html = read(pages[0]);
    assert.ok(html.includes('hero-session'), 'expected the hero terminal session');
    assert.ok(
      html.includes('The gate decides, not you.'),
      'expected the gate-refusal line in the hero session',
    );
    assert.ok(
      html.includes('the gate decided, not the model.'),
      'expected the session to end with the gate deciding',
    );
  });

  test('landing: the install command has a copy button', () => {
    const html = read(pages[0]);
    assert.ok(
      html.includes('data-copy="npm install -g chalk-protocol"'),
      'expected a copy button carrying the install command',
    );
  });

  test('landing: the session animation is reduced-motion-safe', () => {
    const html = read(pages[0]);
    assert.ok(
      html.includes('prefers-reduced-motion'),
      'expected animations gated behind a prefers-reduced-motion media query (styles are inlined)',
    );
  });

  for (const page of pages.filter((p) => p.isDoc)) {
    test(`${page.name}: h2 headings carry an anchor link`, () => {
      const html = read(page);
      assert.ok(
        html.includes('class="heading-anchor"'),
        `expected a heading-anchor link on /${page.name}`,
      );
      assert.ok(
        html.includes('href="#fixture-section-anchor-target"'),
        `expected the anchor to point at the fixture h2 id on /${page.name}`,
      );
    });

    test(`${page.name}: fenced code renders as a Shiki block`, () => {
      const html = read(page);
      assert.ok(html.includes('astro-code'), `expected a Shiki .astro-code block on /${page.name}`);
    });
  }

  test('quickstart: prev/next pager links to protocol and research', () => {
    const pager = pagerOf(read(pages[2]), 'quickstart');
    assert.ok(pager.includes('href="/protocol"'), 'expected the pager to link back to /protocol');
    assert.ok(pager.includes('href="/research"'), 'expected the pager to link on to /research');
  });

  test('protocol: pager has next (/quickstart) and no prev', () => {
    const pager = pagerOf(read(pages[1]), 'protocol');
    assert.ok(pager.includes('href="/quickstart"'), 'expected the pager to link to /quickstart');
    assert.ok(!pager.includes('href="/research"'), 'expected no direct /research link on the first doc');
  });

  test('research: pager has prev (/quickstart) and no next', () => {
    const pager = pagerOf(read(pages[3]), 'research');
    assert.ok(pager.includes('href="/quickstart"'), 'expected the pager to link back to /quickstart');
    assert.ok(!pager.includes('href="/protocol"'), 'expected no direct /protocol link on the last doc');
  });
});
