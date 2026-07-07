// Resilient doc fetch for the content loader. The build renders markdown fetched from
// the parent repo; a transient blip (network drop, timeout, upstream 5xx) must NOT turn
// `chalk verify` RED, so transient failures are retried with bounded backoff. A genuine
// problem — 404 (renamed/removed file) or an empty body — is FATAL and never retried, so
// production still fails hard on bad content. Zero dependencies.
const DEFAULTS = { retries: 3, timeoutMs: 15_000, baseDelayMs: 400 };

// Marks failures that must not be retried and must fail the build (per criterion:
// "still fail hard on 404 or empty body").
export class FatalFetchError extends Error {}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function fetchDoc(url, opts = {}) {
  const { retries, timeoutMs, baseDelayMs } = { ...DEFAULTS, ...opts };
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      let res;
      try {
        res = await fetch(url, { signal: controller.signal });
      } finally {
        clearTimeout(timer);
      }
      if (res.status === 404) {
        throw new FatalFetchError(`Failed to fetch ${url}: HTTP 404 Not Found`);
      }
      if (!res.ok) {
        // 5xx and other non-ok statuses are treated as transient — retry.
        throw new Error(`Failed to fetch ${url}: HTTP ${res.status} ${res.statusText}`);
      }
      const markdown = await res.text();
      if (!markdown.trim()) {
        throw new FatalFetchError(`Fetched ${url} but the document is empty`);
      }
      return markdown;
    } catch (err) {
      if (err instanceof FatalFetchError) throw err; // 404 / empty — never retry
      lastErr = err;
      if (attempt < retries) await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  const cause = String(lastErr?.message ?? lastErr);
  throw new Error(`Failed to fetch ${url} after ${retries + 1} attempt(s): ${cause}`);
}
