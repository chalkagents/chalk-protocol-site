import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile, execSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOCS } from '../src/lib/docs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The one post we ship. Its slug is the filename; these strings must survive the build.
const POST_SLUG = 'your-coding-agent-is-lying-to-you';
const POST_TITLE = 'Your Coding Agent Is Lying to You';
const BODY_SENTINELS = ['We made agents cheat on purpose', 'test-integrity VIOLATED'];

// A draft dropped into the sandbox — it must NOT produce a page or appear in the index.
const DRAFT_SLUG = 'zz-draft-guard';
const DRAFT_SENTINEL = 'draft-should-never-render-6f3a1c';

// Build in an isolated copy (node_modules symlinked) so this never races test/build.test.mjs on dist/.
const sandbox = mkdtempSync(path.join(os.tmpdir(), 'chalk-blog-'));

// Serve the docs from a local fixture so the build never live-fetches the network.
const server = http.createServer((req, res) => {
  const doc = DOCS.find((d) => req.url === `/${d.file}`);
  if (!doc) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8' });
  res.end(`# ${doc.title} fixture\n\nFixture body for the offline blog build.\n`);
});

describe('blog build', () => {
  before(
    async () => {
      if (!existsSync(path.join(root, 'node_modules'))) {
        execSync('npm install --no-audit --no-fund', { cwd: root, stdio: 'inherit' });
      }
      for (const entry of ['src', 'public', 'astro.config.mjs', 'package.json', 'tsconfig.json']) {
        const from = path.join(root, entry);
        if (existsSync(from)) cpSync(from, path.join(sandbox, entry), { recursive: true });
      }
      symlinkSync(path.join(root, 'node_modules'), path.join(sandbox, 'node_modules'), 'dir');

      // Plant a draft post in the sandbox to prove drafts are excluded from the build.
      writeFileSync(
        path.join(sandbox, 'src', 'content', 'blog', `${DRAFT_SLUG}.md`),
        `---\ntitle: Draft guard\ndescription: ${DRAFT_SENTINEL}\ndate: 2026-01-01\ndraft: true\n---\n\n${DRAFT_SENTINEL}\n`,
      );

      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const base = `http://127.0.0.1:${server.address().port}`;
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

  test('the blog index lists the post and links to it', () => {
    const file = path.join(sandbox, 'dist', 'blog', 'index.html');
    assert.ok(existsSync(file), 'expected dist/blog/index.html after `npm run build`');
    const html = readFileSync(file, 'utf8');
    assert.ok(html.includes(POST_TITLE), 'expected the blog index to show the post title');
    assert.ok(
      html.includes(`href="/blog/${POST_SLUG}"`),
      'expected the blog index to link to the post',
    );
  });

  test('the post page renders the article, not raw markdown', () => {
    const file = path.join(sandbox, 'dist', 'blog', POST_SLUG, 'index.html');
    assert.ok(existsSync(file), `expected dist/blog/${POST_SLUG}/index.html`);
    const html = readFileSync(file, 'utf8');
    assert.ok(html.includes(`${POST_TITLE}`), 'expected the post title in the page');
    for (const s of BODY_SENTINELS) {
      assert.ok(html.includes(s), `expected the post body to contain "${s}"`);
    }
    // Markdown was rendered: headings became <h2>, not literal "## ".
    assert.ok(html.includes('<h2'), 'expected rendered <h2> headings in the post');
    assert.ok(!html.includes('## We made agents'), 'expected rendered markdown, not a raw dump');
  });

  test('drafts are excluded from the build', () => {
    assert.ok(
      !existsSync(path.join(sandbox, 'dist', 'blog', DRAFT_SLUG, 'index.html')),
      'a draft post must not produce a page',
    );
    const index = readFileSync(path.join(sandbox, 'dist', 'blog', 'index.html'), 'utf8');
    assert.ok(!index.includes(DRAFT_SENTINEL), 'a draft post must not appear in the blog index');
  });

  test('site chrome links to the blog', () => {
    const home = readFileSync(path.join(sandbox, 'dist', 'index.html'), 'utf8');
    assert.ok(home.includes('href="/blog"'), 'expected the nav/footer to link to /blog');
  });
});
