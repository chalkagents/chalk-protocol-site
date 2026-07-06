import { before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distIndex = path.join(root, 'dist', 'index.html');

let html = '';

describe('astro landing page build', () => {
  // Building (and, on a clean checkout, installing) can take a while.
  before(
    () => {
      if (!existsSync(path.join(root, 'node_modules'))) {
        execSync('npm install --no-audit --no-fund', { cwd: root, stdio: 'inherit' });
      }
      execSync('npm run build', { cwd: root, stdio: 'inherit' });
      html = readFileSync(distIndex, 'utf8');
    },
    { timeout: 300_000 },
  );

  test('npm run build produces dist/index.html', () => {
    assert.ok(existsSync(distIndex), 'expected dist/index.html to exist after `npm run build`');
    assert.ok(html.length > 0, 'expected dist/index.html to be non-empty');
  });

  test('hero contains the pitch line', () => {
    assert.match(html, /Chalk Protocol/, 'expected the Chalk Protocol hero heading');
    assert.ok(
      html.includes('Ship agent-written code through gates, not vibes'),
      'expected the pitch line in the built page',
    );
    assert.ok(
      html.includes('a locked spec decides success, not the model'),
      'expected the full pitch line in the built page',
    );
  });

  test('the loop lists all four gates', () => {
    for (const gate of ['Locked test', 'Verify', 'Adversarial review', 'Merge gate']) {
      assert.ok(html.includes(gate), `expected gate "${gate}" in the built page`);
    }
  });

  test('quickstart lists the per-task loop steps', () => {
    for (const step of [
      'chalk next',
      'chalk context',
      'chalk start',
      'chalk verify',
      'chalk review',
      'chalk done',
    ]) {
      assert.ok(html.includes(step), `expected quickstart step "${step}" in the built page`);
    }
  });

  test('docs section links to the parent repo docs', () => {
    const base = 'https://github.com/chalkagents/chalk-protocol/blob/main';
    for (const doc of ['README.md', 'PROTOCOL.md', 'QUICKSTART.md', 'RESEARCH.md']) {
      assert.ok(html.includes(`${base}/${doc}`), `expected a link to ${base}/${doc}`);
    }
  });

  test('the only runtime dependency is astro', () => {
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
    assert.deepEqual(Object.keys(pkg.dependencies ?? {}), ['astro']);
    assert.deepEqual(Object.keys(pkg.devDependencies ?? {}), []);
  });
});
