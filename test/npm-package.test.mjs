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
const sandbox = mkdtempSync(path.join(os.tmpdir(), 'chalk-npm-package-'));

// The build fetches docs markdown at build time and fails on any fetch error, so
// serve minimal fixture markdown locally instead of depending on live network.
const server = http.createServer((req, res) => {
  if (!req.url.endsWith('.md')) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8' });
  res.end('# Fixture doc\n\nFixture body for the npm-package test.\n');
});

describe('landing page references the npm package', () => {
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

  test('the install command is rendered as visible, selectable text', () => {
    const file = path.join(sandbox, 'dist', 'index.html');
    assert.ok(existsSync(file), 'expected dist/index.html after `npm run build`');
    const html = readFileSync(file, 'utf8');
    assert.match(
      html,
      />npm install -g chalk-protocol</,
      'expected "npm install -g chalk-protocol" rendered as element text (not an attribute or image)',
    );
  });

  test('the page links to the npm package', () => {
    const html = readFileSync(path.join(sandbox, 'dist', 'index.html'), 'utf8');
    assert.ok(
      html.includes('href="https://www.npmjs.com/package/chalk-protocol"'),
      'expected a link to https://www.npmjs.com/package/chalk-protocol',
    );
  });
});
