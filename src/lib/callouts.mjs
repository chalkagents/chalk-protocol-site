// Rehype plugin: render GitHub-alert blockquotes as styled callout boxes.
// `> [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]` at the head of a
// blockquote becomes <div class="callout callout-<type>"> with a title row. Zero-dep,
// portable (the syntax lives in the source markdown), and a no-op on plain blockquotes.
const TYPES = {
  NOTE: 'note',
  TIP: 'tip',
  IMPORTANT: 'important',
  WARNING: 'warning',
  CAUTION: 'caution',
};
const MARKER = /^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?/;

export function callouts() {
  return function transform(tree) {
    walk(tree);
  };
}

function walk(node) {
  for (const child of node.children ?? []) {
    if (child.type === 'element' && child.tagName === 'blockquote') {
      transform(child);
    }
    walk(child);
  }
}

function transform(bq) {
  const firstP = bq.children?.find((c) => c.type === 'element' && c.tagName === 'p');
  if (!firstP) return;
  const firstText = firstP.children?.find((c) => c.type === 'text');
  if (!firstText || typeof firstText.value !== 'string') return;
  const m = firstText.value.match(MARKER);
  if (!m) return;

  const kind = m[1];
  const label = kind.charAt(0) + kind.slice(1).toLowerCase();
  // Drop the marker from the paragraph so only the body text remains.
  firstText.value = firstText.value.slice(m[0].length);

  bq.tagName = 'div';
  bq.properties = { class: `callout callout-${TYPES[kind]}`, role: 'note' };
  bq.children.unshift({
    type: 'element',
    tagName: 'p',
    properties: { class: 'callout-title' },
    children: [{ type: 'text', value: label }],
  });
}
