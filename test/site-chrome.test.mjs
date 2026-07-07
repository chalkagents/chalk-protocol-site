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
  '> [!NOTE]',
  '> Fixture note body for the callout assertion.',
  '',
  '> [!WARNING]',
  '> Fixture warning body.',
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

  // --- v2.1 "modern terminal" — the calm-surface contract. Each assertion would fail
  // if the refinement were reverted (typography re-aliased to mono, scanlines going
  // page-global again, or the eyebrow+heading hierarchy collapsing back to $-headings).
  test('v2.1: prose is a real sans stack and the body uses it', () => {
    const html = read(pages[0]);
    assert.match(
      html,
      /--sans:\s*ui-sans-serif/,
      'expected --sans to define a real sans stack, not alias the mono stack',
    );
    assert.match(
      html,
      /body\s*\{[^}]*font-family:\s*var\(--sans\)/,
      'expected the body to read in sans — mono is reserved for terminal content',
    );
  });

  test('v2.1: scanlines are scoped to terminal frames, never page-global', () => {
    const html = read(pages[0]);
    assert.match(
      html,
      /\.terminal(\[[^\]]*\])?::?after\s*\{[^}]*repeating-linear-gradient/,
      'expected the CRT scanline texture inside .terminal::after',
    );
    assert.ok(
      !/body(\[[^\]]*\])?::?(before|after)\s*\{[^}]*repeating-linear-gradient/.test(html),
      'expected NO page-global scanline overlay on body — texture must not sit over reading text',
    );
  });

  test('v2.1: sections use the eyebrow + sans-heading pattern', () => {
    const html = read(pages[0]);
    assert.ok(html.includes('class="eyebrow"'), 'expected mono eyebrow labels above section headings');
    for (const eyebrow of ['$ chalk gates', '$ cat quickstart', '$ ls docs/']) {
      assert.ok(html.includes(eyebrow), `expected the "${eyebrow}" eyebrow`);
    }
    assert.ok(
      html.includes('The loop — four gates every change must clear'),
      'expected the loop section to carry a readable sans heading, not a command-styled one',
    );
  });

  // --- landing reframe (#22): argument + proof sections. Each assertion fails if the
  // section is reverted, per the reviewer's revert-sensitivity bar.
  test('reframe: hero leads with a category headline and an enemy line', () => {
    const html = read(pages[0]);
    assert.ok(
      html.includes('The quality gate for AI coding agents'),
      'expected the category headline',
    );
    assert.ok(
      html.includes('Chalk makes them prove it'),
      'expected the problem/enemy framing line',
    );
    // The proven pitch line is demoted, not deleted — the locked contract survives.
    assert.ok(
      html.includes('Ship agent-written code through gates, not vibes'),
      'expected the original pitch retained as sub-copy',
    );
  });

  test('reframe: a feature grid names all four levers with links', () => {
    const html = read(pages[0]);
    assert.ok(html.includes('class="lever-grid"'), 'expected the lever feature grid');
    for (const lever of ['Locked test', 'Verify', 'Adversarial review', 'Merge gate']) {
      assert.ok(html.includes(lever), `expected the "${lever}" lever card`);
    }
    assert.ok(html.includes('class="lever-link"'), 'expected each lever to link to a doc');
  });

  test('reframe: a before/after comparison is present', () => {
    const html = read(pages[0]);
    assert.ok(html.includes('class="compare-grid"'), 'expected the without/with comparison');
    assert.ok(html.includes('Agent without Chalk'), 'expected the "without" column');
    assert.ok(html.includes('Agent with Chalk'), 'expected the "with" column');
  });

  test('reframe: an honest trust strip lists the agents Chalk drives (no fabricated metrics)', () => {
    const html = read(pages[0]);
    assert.ok(html.includes('Works with any agent'), 'expected the trust strip label');
    for (const agent of ['Claude Code', 'Cursor', 'opencode', 'aider']) {
      assert.ok(html.includes(agent), `expected "${agent}" in the trust strip`);
    }
  });

  for (const page of pages) {
    test(`${page.name}: footer has Docs + Community link columns`, () => {
      const html = read(page);
      const footer = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/);
      assert.ok(footer, `expected a footer on ${page.name}`);
      assert.ok(footer[1].includes('footer-cols'), `expected footer link columns on ${page.name}`);
      assert.ok(footer[1].includes('>Docs<'), `expected a Docs column on ${page.name}`);
      assert.ok(footer[1].includes('>Community<'), `expected a Community column on ${page.name}`);
    });
  }

  test('landing: the typed session animation only exists inside the no-preference guard', () => {
    const html = read(pages[0]);
    // The CSS minifier strips whitespace (`@media(prefers-reduced-motion:no-preference)`).
    const m = html.match(/@media\s*\(\s*prefers-reduced-motion:\s*no-preference\s*\)/);
    assert.ok(m, 'expected a prefers-reduced-motion: no-preference media query (styles are inlined)');
    const guard = m.index;
    // The typing reveal (width:0 → N ch) must live INSIDE the guard: with reduced
    // motion the session renders fully, instantly. Before the guard, nothing may
    // hide a line or start the reveal.
    const guarded = html.slice(guard, guard + 6000);
    assert.ok(guarded.includes('width:0'), 'expected the typing reveal inside the no-preference guard');
    assert.ok(guarded.includes('steps('), 'expected the stepped typing timing inside the no-preference guard');
    const before = html.slice(0, guard);
    assert.ok(
      !before.includes('opacity:0'),
      'expected no unguarded opacity:0 — reduced-motion users must see every session line',
    );
  });

  for (const page of pages) {
    test(`${page.name}: the footer is the status bar with npm + github links`, () => {
      const html = read(page);
      const footer = html.match(/<footer[^>]*>([\s\S]*?)<\/footer>/);
      assert.ok(footer, `expected a footer on ${page.name}`);
      assert.ok(footer[1].includes('status-bar'), `expected the tmux-style status bar on ${page.name}`);
      assert.ok(
        footer[1].includes('https://www.npmjs.com/package/chalk-protocol'),
        `expected the npm link in the status bar on ${page.name}`,
      );
      assert.ok(
        footer[1].includes('https://github.com/chalkagents/chalk-protocol'),
        `expected the github link in the status bar on ${page.name}`,
      );
    });
  }

  test('landing: client JS is the copy interaction only', () => {
    const html = read(pages[0]);
    const scripts = html.match(/<script/g) || [];
    assert.equal(scripts.length, 1, `expected exactly one script tag, found ${scripts.length}`);
    assert.ok(html.includes('clipboard'), 'expected the single script to be the clipboard copy handler');
  });

  for (const page of pages.filter((p) => p.isDoc)) {
    test(`${page.name}: docs chrome follows the brutalist no-radius rule`, () => {
      const html = read(page);
      assert.ok(
        !/border-radius:(?!0[;}])[^;}]*[1-9]/.test(html),
        `expected no non-zero border-radius on ${page.name} — everything is a readout`,
      );
    });
  }

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

    // --- docs three-column upgrade (#23): revert-sensitive per the reviewer's bar.
    test(`${page.name}: renders the three-column docs layout with a left nav`, () => {
      const html = read(page);
      assert.ok(html.includes('class="doc-layout"'), `expected the three-column layout on /${page.name}`);
      assert.ok(html.includes('doc-nav-link'), `expected the left doc nav on /${page.name}`);
      // The current doc is the active nav entry.
      assert.ok(
        /doc-nav-link[^"]*active/.test(html) && html.includes('aria-current="page"'),
        `expected the current doc marked active on /${page.name}`,
      );
      // All three docs are reachable from the nav.
      for (const id of ['protocol', 'quickstart', 'research']) {
        assert.ok(html.includes(`href="/${id}"`), `expected the nav to link /${id} on /${page.name}`);
      }
    });

    test(`${page.name}: has a right-hand "On this page" TOC built from the headings`, () => {
      const html = read(page);
      assert.ok(html.includes('class="doc-toc"'), `expected the TOC rail on /${page.name}`);
      assert.ok(html.includes('On this page'), `expected the TOC label on /${page.name}`);
      // The fixture's H2 must appear as a TOC link pointing at its heading id.
      assert.ok(
        html.includes('data-toc-target="fixture-section-anchor-target"'),
        `expected a TOC entry for the fixture section on /${page.name}`,
      );
    });

    test(`${page.name}: every code block has a copy button`, () => {
      const html = read(page);
      assert.ok(html.includes('class="code-block"'), `expected code blocks wrapped for copy on /${page.name}`);
      assert.ok(html.includes('class="code-copy"'), `expected a copy button on /${page.name}`);
      // The wrapper contains the Shiki block (copy reads the sibling <pre> at click time).
      assert.ok(
        /class="code-block">[\s\S]*?class="code-copy"[\s\S]*?astro-code/.test(html),
        `expected the copy button to sit alongside the Shiki block on /${page.name}`,
      );
    });

    // End-to-end callout proof: exercises the REAL remark→rehype pipeline (not a
    // synthetic tree) AND is revert-sensitive — removing `callouts` from the
    // astro.config rehypePlugins turns these plain blockquotes and fails here.
    test(`${page.name}: GitHub-alert markdown renders as styled callouts`, () => {
      const html = read(page);
      assert.ok(html.includes('callout callout-note'), `expected a rendered [!NOTE] callout on /${page.name}`);
      assert.ok(html.includes('callout callout-warning'), `expected a rendered [!WARNING] callout on /${page.name}`);
      assert.ok(html.includes('class="callout-title">Note<'), `expected the Note title row on /${page.name}`);
      // The marker text must be stripped, and the body preserved.
      assert.ok(!html.includes('[!NOTE]'), `expected the [!NOTE] marker stripped from output on /${page.name}`);
      assert.ok(
        html.includes('Fixture note body for the callout assertion.'),
        `expected the callout body preserved on /${page.name}`,
      );
    });

    test(`${page.name}: the docs interactions are wired (copy + scroll-spy JS present)`, () => {
      const html = read(page);
      // Not a DOM execution, but a removed/renamed handler fails here — stronger than
      // asserting only the markup the handler targets.
      assert.ok(html.includes('clipboard'), `expected the copy handler on /${page.name}`);
      assert.ok(html.includes('IntersectionObserver'), `expected the TOC scroll-spy on /${page.name}`);
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
