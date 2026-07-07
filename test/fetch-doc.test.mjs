import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { fetchDoc, FatalFetchError } from '../src/lib/fetch-doc.mjs';

// A tiny controllable origin: each path encodes how it should behave, and we count hits
// so retry behavior is directly observable. No network, no Astro build — fast + offline.
const hits = new Map();
const bump = (k) => {
  const n = (hits.get(k) ?? 0) + 1;
  hits.set(k, n);
  return n;
};

const server = http.createServer((req, res) => {
  const url = req.url ?? '/';
  if (url.startsWith('/flaky-')) {
    // /flaky-2 fails (503) twice, then succeeds.
    const failUntil = Number(url.slice('/flaky-'.length));
    const n = bump(url);
    if (n <= failUntil) {
      res.writeHead(503);
      res.end('temporarily unavailable');
      return;
    }
    res.writeHead(200, { 'content-type': 'text/markdown' });
    res.end('# ok\n\nRecovered after retries.\n');
    return;
  }
  if (url === '/missing') {
    bump(url);
    res.writeHead(404);
    res.end('nope');
    return;
  }
  if (url === '/empty') {
    bump(url);
    res.writeHead(200, { 'content-type': 'text/markdown' });
    res.end('   \n');
    return;
  }
  if (url === '/always-503') {
    bump(url);
    res.writeHead(503);
    res.end('down');
    return;
  }
  res.writeHead(200);
  res.end('# fine\n\nBody.\n');
});

let base = '';
before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

describe('fetchDoc retry behavior', () => {
  test('retries transient 5xx failures and succeeds', async () => {
    const md = await fetchDoc(`${base}/flaky-2`, { baseDelayMs: 1 });
    assert.match(md, /Recovered after retries/);
    assert.equal(hits.get('/flaky-2'), 3, 'expected 2 failures + 1 success');
  });

  test('fails hard on 404 with no retry', async () => {
    await assert.rejects(
      () => fetchDoc(`${base}/missing`, { baseDelayMs: 1 }),
      (err) => err instanceof FatalFetchError && /404/.test(err.message),
    );
    assert.equal(hits.get('/missing'), 1, '404 must not be retried');
  });

  test('fails hard on an empty body with no retry', async () => {
    await assert.rejects(
      () => fetchDoc(`${base}/empty`, { baseDelayMs: 1 }),
      (err) => err instanceof FatalFetchError && /empty/.test(err.message),
    );
    assert.equal(hits.get('/empty'), 1, 'empty body must not be retried');
  });

  test('gives up after the configured retries on persistent failure', async () => {
    await assert.rejects(
      () => fetchDoc(`${base}/always-503`, { retries: 2, baseDelayMs: 1 }),
      /after 3 attempt\(s\)/,
    );
    assert.equal(hits.get('/always-503'), 3, 'expected initial try + 2 retries');
  });
});
