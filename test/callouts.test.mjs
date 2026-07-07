import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { callouts } from '../src/lib/callouts.mjs';
import { codeCopy } from '../src/lib/code-copy.mjs';

// The parent docs don't (yet) use GitHub-alert syntax, so the callout capability is
// tested directly against synthetic hast trees rather than a rendered page. This proves
// the transform works and is ready the moment upstream markdown adopts `> [!NOTE]`.
const el = (tagName, children = [], properties = {}) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });
const blockquote = (firstLine, body = 'Body text.') =>
  el('root', [el('blockquote', [el('p', [text(`${firstLine}\n${body}`)])])]);

describe('callouts rehype pass', () => {
  test('turns a [!NOTE] blockquote into a styled callout with a title', () => {
    const tree = blockquote('[!NOTE]', 'Heads up.');
    callouts()(tree);
    const div = tree.children[0];
    assert.equal(div.tagName, 'div', 'blockquote should become a div');
    assert.equal(div.properties.class, 'callout callout-note');
    const title = div.children[0];
    assert.equal(title.properties.class, 'callout-title');
    assert.equal(title.children[0].value, 'Note');
    // The marker text is stripped from the body paragraph.
    const bodyP = div.children[1];
    assert.ok(!bodyP.children[0].value.includes('[!NOTE]'), 'marker removed from body');
    assert.ok(bodyP.children[0].value.includes('Heads up.'), 'body text preserved');
  });

  test('maps every supported alert kind to its class', () => {
    for (const [kind, cls] of [
      ['[!TIP]', 'callout-tip'],
      ['[!IMPORTANT]', 'callout-important'],
      ['[!WARNING]', 'callout-warning'],
      ['[!CAUTION]', 'callout-caution'],
    ]) {
      const tree = blockquote(kind);
      callouts()(tree);
      assert.ok(tree.children[0].properties.class.includes(cls), `${kind} → ${cls}`);
    }
  });

  test('leaves a plain blockquote untouched', () => {
    const tree = el('root', [el('blockquote', [el('p', [text('Just a quote.')])])]);
    callouts()(tree);
    assert.equal(tree.children[0].tagName, 'blockquote', 'plain blockquote stays a blockquote');
  });
});

describe('code-copy rehype pass', () => {
  test('wraps a <pre> in a .code-block with a copy button', () => {
    const tree = el('root', [el('pre', [el('code', [text('chalk verify')])])]);
    codeCopy()(tree);
    const wrap = tree.children[0];
    assert.equal(wrap.tagName, 'div');
    assert.equal(wrap.properties.class, 'code-block');
    const [btn, pre] = wrap.children;
    assert.equal(btn.tagName, 'button');
    assert.equal(btn.properties.class, 'code-copy');
    assert.equal(pre.tagName, 'pre', 'the original <pre> is preserved inside the wrapper');
  });

  test('does not wrap inline code (only <pre>)', () => {
    const tree = el('root', [el('p', [el('code', [text('inline')])])]);
    codeCopy()(tree);
    assert.equal(tree.children[0].tagName, 'p');
    assert.equal(tree.children[0].children[0].tagName, 'code', 'inline code untouched');
  });
});
