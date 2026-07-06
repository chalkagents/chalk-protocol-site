import { before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflowPath = path.join(root, '.github', 'workflows', 'ci.yml');

let yaml = '';

describe('github actions verify lane', () => {
  before(() => {
    assert.ok(existsSync(workflowPath), 'expected .github/workflows/ci.yml to exist');
    yaml = readFileSync(workflowPath, 'utf8');
  });

  test('workflow triggers on pull requests', () => {
    assert.match(yaml, /^\s*pull_request\s*:/m, 'expected a pull_request trigger');
  });

  test('workflow triggers on pushes to main', () => {
    assert.match(
      yaml,
      /^\s*push\s*:\s*\n\s+branches\s*:\s*\[?\s*main\s*\]?/m,
      'expected a push trigger scoped to the main branch',
    );
  });

  test('workflow declares explicit read-only permissions', () => {
    assert.match(yaml, /^permissions\s*:/m, 'expected a top-level permissions block');
    assert.match(
      yaml,
      /^permissions\s*:\s*\n\s+contents\s*:\s*read\s*$/m,
      'expected permissions to grant contents: read',
    );
    assert.doesNotMatch(yaml, /:\s*write\b/, 'expected no write permission grants');
  });

  test('workflow uses no secrets', () => {
    assert.doesNotMatch(yaml, /secrets\./, 'expected no secrets.* references');
  });

  test('workflow runs the test suite', () => {
    assert.match(yaml, /^\s*-\s*run\s*:\s*npm ci\s*$/m, 'expected an `npm ci` step');
    assert.match(yaml, /^\s*-\s*run\s*:\s*npm test\s*$/m, 'expected an `npm test` step');
  });
});
